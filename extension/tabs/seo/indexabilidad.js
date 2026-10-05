// Señales de indexabilidad y veredicto (T-02). No consulta a Google: solo evalúa lo que permite o impide indexar.

const ESPERA_MS = 8000;

export async function pedir(url, opciones) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), ESPERA_MS);
  try { return await fetch(url, { cache: 'no-store', redirect: 'follow', ...opciones, signal: control.signal }); }
  finally { clearTimeout(reloj); }
}

// Directivas que no inician un «bot: …» aunque lleven dos puntos (cabecera X-Robots-Tag)
const DIRECTIVAS_CON_VALOR = ['unavailable_after', 'max-snippet', 'max-image-preview', 'max-video-preview'];

// Devuelve { noindex, nofollow } que aplican a Googlebot. `bot` es el bot de la meta (null = todos).
export function leerDirectivas(valor, bot = null) {
  const r = { noindex: false, nofollow: false };
  let actual = bot;
  for (let trozo of String(valor || '').split(',')) {
    const m = trozo.match(/^\s*([\w-]+)\s*:\s*(.*)$/);
    if (m && !DIRECTIVAS_CON_VALOR.includes(m[1].toLowerCase())) { actual = m[1].toLowerCase(); trozo = m[2]; }
    if (actual && actual !== 'googlebot') continue;
    const d = trozo.trim().toLowerCase();
    if (d === 'noindex' || d === 'none') r.noindex = true;
    if (d === 'nofollow' || d === 'none') r.nofollow = true;
  }
  return r;
}

// robots.txt: agrupa por User-agent y devuelve las reglas que aplican a Googlebot (o a *)
function reglasParaGooglebot(texto) {
  const grupos = [];
  let grupo = null, enAgentes = false;
  for (const linea of texto.split(/\r?\n/)) {
    const l = linea.replace(/#.*/, '').trim();
    const i = l.indexOf(':');
    if (i < 0) continue;
    const clave = l.slice(0, i).trim().toLowerCase(), valor = l.slice(i + 1).trim();
    if (clave === 'user-agent') {
      if (!enAgentes) { grupo = { agentes: [], reglas: [] }; grupos.push(grupo); }
      grupo.agentes.push(valor.toLowerCase()); enAgentes = true;
    } else if ((clave === 'allow' || clave === 'disallow') && grupo) {
      enAgentes = false;
      if (valor) grupo.reglas.push({ permite: clave === 'allow', ruta: valor });
    } else enAgentes = false;
  }
  const propios = grupos.filter(g => g.agentes.includes('googlebot'));
  const elegidos = propios.length ? propios : grupos.filter(g => g.agentes.includes('*'));
  return elegidos.flatMap(g => g.reglas);
}

// Prefijo con comodines `*` y ancla `$`; gana la regla más larga y, a igualdad, Allow
function bloqueaRobots(texto, ruta) {
  let ganadora = null;
  for (const r of reglasParaGooglebot(texto)) {
    const patron = '^' + r.ruta.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\$$/, '$$');
    let coincide = false;
    try { coincide = new RegExp(patron).test(ruta); } catch { /* regla rara: se ignora */ }
    if (!coincide) continue;
    if (!ganadora || r.ruta.length > ganadora.ruta.length || (r.ruta.length === ganadora.ruta.length && r.permite)) ganadora = r;
  }
  return ganadora && !ganadora.permite ? ganadora.ruta : null;
}

// Misma URL sin hash ni barra final, para comparar con el canonical
const normalizar = u => { try { const x = new URL(u); x.hash = ''; return x.href.replace(/\/$/, ''); } catch { return u; } };

// datos: { url, robots: [{nombre, contenido}], canonical }
export async function evaluar(datos) {
  const senales = [];
  const hay = (estado, etiqueta, detalle) => senales.push({ estado, etiqueta, detalle });
  let origen, ruta;
  try { const u = new URL(datos.url); origen = u.origin; ruta = u.pathname + u.search; } catch { origen = null; ruta = '/'; }

  // 1. Código HTTP y X-Robots-Tag (HEAD; si el servidor no lo admite, GET)
  let cabecera = null;
  try {
    let r = await pedir(datos.url, { method: 'HEAD' });
    if (r.status === 405 || r.status === 501) r = await pedir(datos.url, { method: 'GET' });
    cabecera = r.headers.get('x-robots-tag');
    const redir = r.redirected ? ` (tras redirección a ${r.url})` : '';
    if (r.status >= 400) hay('mal', 'Código HTTP', `${r.status}${redir}: Google no indexa páginas con error`);
    else hay('ok', 'Código HTTP', `${r.status}${redir}`);
  } catch {
    hay('info', 'Código HTTP', 'No se pudo comprobar (red o permisos)');
  }

  // 2. meta robots / googlebot
  let metaNoindex = false;
  if (!datos.robots.length) hay('ok', 'meta robots', 'No hay: se permite indexar y seguir enlaces');
  for (const m of datos.robots) {
    const d = leerDirectivas(m.contenido, m.nombre === 'googlebot' ? 'googlebot' : null);
    metaNoindex ||= d.noindex;
    const estado = d.noindex ? 'mal' : d.nofollow ? 'aviso' : 'ok';
    hay(estado, `meta ${m.nombre}`, `«${m.contenido || 'vacía'}»` + (d.noindex ? ': noindex, no se indexará' : d.nofollow ? ': nofollow, no se siguen sus enlaces' : ''));
  }

  // 3. X-Robots-Tag
  let xNoindex = false;
  if (cabecera) {
    const d = leerDirectivas(cabecera);
    xNoindex = d.noindex;
    hay(d.noindex ? 'mal' : d.nofollow ? 'aviso' : 'ok', 'X-Robots-Tag', `«${cabecera}»` + (d.noindex ? ': noindex, no se indexará' : d.nofollow ? ': nofollow' : ''));
  } else hay('ok', 'X-Robots-Tag', 'No hay cabecera');

  // 4. Canonical
  let otroCanonical = false;
  if (!datos.canonical) hay('info', 'Canonical', 'No declara canonical');
  else if (normalizar(datos.canonical) === normalizar(datos.url)) hay('ok', 'Canonical', 'Apunta a esta misma URL');
  else { otroCanonical = true; hay('duda', 'Canonical', `Apunta a otra URL: ${datos.canonical}`); }

  // 5. robots.txt
  let robotsBloquea = false;
  if (origen) {
    try {
      const r = await pedir(origen + '/robots.txt');
      if (r.status === 404 || r.status === 410) hay('ok', 'robots.txt', 'No existe: todo permitido');
      else if (!r.ok) hay('info', 'robots.txt', `Responde ${r.status}: no se pudo evaluar`);
      else {
        const regla = bloqueaRobots(await r.text(), ruta);
        robotsBloquea = !!regla;
        hay(regla ? 'mal' : 'ok', 'robots.txt', regla ? `Bloquea esta URL a Googlebot (Disallow: ${regla})` : 'No bloquea esta URL a Googlebot');
      }
    } catch { hay('info', 'robots.txt', 'No se pudo comprobar'); }
  }

  const errorHttp = senales.some(s => s.etiqueta === 'Código HTTP' && s.estado === 'mal');
  const veredicto = metaNoindex || xNoindex || errorHttp || robotsBloquea ? 'bloqueada' : otroCanonical ? 'dudas' : 'indexable';
  return { veredicto, senales };
}
