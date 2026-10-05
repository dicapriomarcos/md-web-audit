// Vista de la Tab SEO: title, description, visibilidad en Google, imagen, encabezados y schema.
// El análisis corre aquí con chrome.scripting; el service worker solo avisa de los cambios de pestaña
// y aplica/retira los bordes de resaltado (ver captura.js).

import { esc } from '../../compartido/formato.js';
import { analizarPagina } from './analisis.js';
import { leerSchemas } from './schema.js';
import { evaluar } from './indexabilidad.js';
import { comprobarArchivos } from './archivos.js';
import { COLORES, COLOR_ARTICLE } from './resaltado.js';

const RANGO_TITLE = [30, 60];
const RANGO_DESC = [70, 160];
const MAX_ENCABEZADOS = 300;
const VEREDICTOS = { indexable: 'Indexable', bloqueada: 'Bloqueada', dudas: 'Con dudas' };
const ICONO = { ok: '✓', mal: '✕', aviso: '!', duda: '!', info: 'i' };

const recortar = (s, n) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
const migas = url => { try { const u = new URL(url); return [u.host, ...u.pathname.split('/').filter(Boolean)].join(' › '); } catch { return url; } };

// Tarjeta de texto con longitud e indicador de rango (FR-02, FR-03)
function tarjetaTexto(titulo, texto, [min, max], ausente) {
  if (!texto) return `<section class="tarjeta"><h2>${titulo}</h2><div class="aviso mal">${ausente}</div></section>`;
  const clase = texto.length < min || texto.length > max ? 'aviso' : 'ok';
  const juicio = texto.length < min ? 'corto' : texto.length > max ? 'largo' : 'dentro del rango';
  return `<section class="tarjeta"><h2>${titulo}</h2>
    <div class="valor">${esc(texto)}</div>
    <div class="medida"><span class="chip ${clase}">${texto.length} caracteres · ${juicio}</span><small>Recomendado: ${min}–${max}</small></div></section>`;
}

function tarjetaGoogle(d) {
  const titulo = d.title ? recortar(d.title, 60) : migas(d.url);
  const desc = d.description
    ? `<div class="g-desc">${esc(recortar(d.description, 160))}</div>`
    : '<div class="g-desc"><i>Sin meta description: Google generará un fragmento a partir del contenido.</i></div>';
  return `<section class="tarjeta"><h2>¿Visible en Google?</h2>
    <div id="veredicto"><span class="chip">Comprobando…</span></div>
    <div id="senales"></div>
    <div class="nota">Son señales de indexabilidad: no equivale a «está indexada». Para eso, Search Console.</div>
    <h2 class="sub">Vista previa del resultado</h2>
    <div class="google"><div class="g-url">${esc(migas(d.url))}</div><div class="g-tit">${esc(titulo)}</div>${desc}</div></section>`;
}

function tarjetaArchivos() {
  return '<section class="tarjeta"><h2>Archivos del sitio</h2><div id="archivos"><span class="chip">Comprobando…</span></div></section>';
}

function tarjetaImagen(d) {
  const url = d.ogImage || d.twitterImage;
  if (!url) return '<section class="tarjeta"><h2>Imagen destacada</h2><div class="aviso mal">Sin imagen destacada (ni og:image ni twitter:image).</div></section>';
  return `<section class="tarjeta"><h2>Imagen destacada</h2>
    <img class="destacada" src="${esc(url)}" alt="">
    <div class="valor url-img">${esc(url)}</div><small>${d.ogImage ? 'og:image' : 'twitter:image'}</small></section>`;
}

function tarjetaEncabezados(d) {
  const cuenta = [1, 2, 3, 4, 5, 6].map(n => d.headings.filter(h => h.nivel === n).length);
  const h1 = cuenta[0];
  const avisoH1 = h1 === 1 ? '<div class="aviso ok">Un único H1, como se recomienda.</div>'
    : h1 === 0 ? '<div class="aviso mal">No hay ningún H1.</div>'
    : `<div class="aviso mal">Hay ${h1} H1: lo recomendable es uno solo.</div>`;
  const interruptor = (dato, color, etiqueta, n, estilo = '') => `<label class="sw" style="--c:${color}${estilo}"><input type="checkbox" ${dato}><span class="muestra"></span><b>${etiqueta}</b><small>${n}</small></label>`;
  const lista = d.headings.slice(0, MAX_ENCABEZADOS).map((h, i) =>
    `<div class="enc" data-indice="${i}" style="--c:${COLORES[h.nivel]};padding-left:${(h.nivel - 1) * 10 + 4}px" title="Ir a este encabezado">
      <span class="niv">H${h.nivel}</span><span class="tx">${h.texto ? esc(h.texto) : '<small>(vacío)</small>'}</span></div>`).join('');
  return `<section class="tarjeta"><h2>Encabezados</h2>${avisoH1}
    <div class="switches">${[1, 2, 3, 4, 5, 6].map(n => interruptor(`data-nivel="${n}"`, COLORES[n], 'H' + n, cuenta[n - 1])).join('')}
      ${interruptor('data-articles', COLOR_ARTICLE, 'Articles', d.articles, ';--trazo:dashed')}</div>
    <small>Los interruptores dibujan un borde de color sobre la página; se quitan al apagarlos o al cerrar el panel.</small>
    <div class="lista-enc">${lista || '<div class="vacio">La página no tiene encabezados.</div>'}</div>
    ${d.headings.length > MAX_ENCABEZADOS ? `<div class="nota">Mostrando ${MAX_ENCABEZADOS} de ${d.headings.length}.</div>` : ''}</section>`;
}

function tarjetaSchema(schemas) {
  if (!schemas.length) return '<section class="tarjeta"><h2>Schema</h2><div class="aviso">Sin datos estructurados.</div></section>';
  const bloques = schemas.map(s => `<div class="sch">
    <div class="cab"><span class="chip ${s.invalido ? 'mal' : ''}">${s.formato}</span>
      ${s.invalido ? `<b>JSON no válido</b> <small>${esc(s.error)}</small>` : `<b>${s.tipos.length ? esc(s.tipos.join(', ')) : '(sin tipo)'}</b>`}</div>
    <details><summary>Ver ${s.invalido ? 'contenido' : 'JSON'}</summary><pre>${esc(s.json)}</pre></details></div>`).join('');
  return `<section class="tarjeta"><h2>Schema</h2><div class="medida"><small>${schemas.length} ${schemas.length === 1 ? 'bloque' : 'bloques'} en ${[...new Set(schemas.map(s => s.formato))].join(', ')}</small></div>${bloques}</section>`;
}

async function inyectar(tabId, func) {
  const [r] = await chrome.scripting.executeScript({ target: { tabId }, func });
  return r?.result;
}

export async function montar(cont, ctx) {
  cont.innerHTML = `
    <div class="seo">
      <div class="ctl"><span class="estado" id="estado"></span><span class="espacio"></span>
        <button id="reanalizar" title="Volver a leer la página (útil si cambia por JavaScript)">⟳ Reanalizar</button></div>
      <div id="resultado"><div class="vacio">Analizando…</div></div>
    </div>`;
  const $ = s => cont.querySelector(s);
  let ultimo = null;   // último estado recibido del service worker
  let turno = 0;       // descarta análisis que llegan tarde

  const vacio = html => { turno++; $('#resultado').innerHTML = `<div class="tarjeta"><div class="vacio">${html}</div></div>`; $('#estado').textContent = ''; };

  function marcar(r) {
    cont.querySelectorAll('[data-nivel]').forEach(i => { i.checked = !!r?.niveles.includes(Number(i.dataset.nivel)); });
    const a = cont.querySelector('[data-articles]'); if (a) a.checked = !!r?.articles;
  }

  function pintarSenales(r) {
    const v = $('#veredicto'); if (!v) return;
    v.innerHTML = `<span class="chip veredicto ${r.veredicto}">${VEREDICTOS[r.veredicto]}</span>`;
    $('#senales').innerHTML = r.senales.map(s => `<div class="senal ${s.estado}"><span class="ico">${ICONO[s.estado]}</span><span><b>${esc(s.etiqueta)}</b> ${esc(s.detalle)}</span></div>`).join('');
  }

  // Los tres enlaces se abren siempre en una pestaña nueva, se hayan encontrado o no
  function pintarArchivos(lista) {
    const caja = $('#archivos'); if (!caja) return;
    const estado = a => a.existe ? ['ok', 'Encontrado'] : a.existe === false ? ['mal', 'No encontrado'] : ['', 'No se pudo comprobar'];
    caja.innerHTML = lista.map(a => {
      const [clase, texto] = estado(a);
      return `<div class="archivo"><b>${esc(a.etiqueta)}</b><span class="chip ${clase}">${texto}</span>${a.nota ? `<small>${esc(a.nota)}</small>` : ''}
        <a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">Abrir ↗</a></div>`;
    }).join('');
  }

  async function analizar(est) {
    const mio = ++turno;
    $('#estado').textContent = 'Analizando…';
    try {
      const tab = await chrome.tabs.get(est.tabId);
      if (!/^https?:/i.test(tab.url || '')) return vacio('Esta página no se puede analizar: solo funciona en http y https.');
      const [datos, schemas] = await Promise.all([inyectar(tab.id, analizarPagina), inyectar(tab.id, leerSchemas)]);
      if (mio !== turno) return;
      if (!datos) throw new Error('la página no respondió');
      $('#resultado').innerHTML = tarjetaTexto('Meta title', datos.title, RANGO_TITLE, 'Falta el <code>&lt;title&gt;</code> o está vacío.') +
        tarjetaTexto('Meta description', datos.description, RANGO_DESC, 'Falta la meta description o está vacía.') +
        tarjetaGoogle(datos) + tarjetaArchivos() + tarjetaImagen(datos) + tarjetaEncabezados(datos) + tarjetaSchema(schemas || []);
      marcar(ultimo?.resaltado);
      $('#estado').textContent = 'Analizado a las ' + new Date().toLocaleTimeString('es-ES');
      evaluar(datos).then(r => { if (mio === turno) pintarSenales(r); });
      comprobarArchivos(datos.url).then(r => { if (mio === turno) pintarArchivos(r); });
    } catch (e) {
      if (mio === turno) vacio('No se pudo analizar esta página: ' + esc(e?.message || e));
    }
  }

  function recibir(est, reanalizar) {
    if (!est || est.error) return;
    ultimo = est;
    if (est.tabId == null) return vacio('No hay ninguna pestaña activa.');
    if (!est.analizable) return vacio('Esta página no se puede analizar: solo funciona en http y https.');
    marcar(est.resaltado);
    if (est.status !== 'complete') { $('#estado').textContent = 'Cargando la página…'; return; }
    if (reanalizar) analizar(est);
  }

  // Interruptores de resaltado (FR-09, FR-11) e ir a un encabezado (FR-08)
  cont.addEventListener('change', async e => {
    if (!e.target.matches('[data-nivel], [data-articles]')) return;
    const niveles = [...cont.querySelectorAll('[data-nivel]:checked')].map(i => Number(i.dataset.nivel));
    const articles = !!cont.querySelector('[data-articles]:checked');
    const est = await ctx.enviar('resaltar', { niveles, articles });
    if (est?.error) { $('#estado').textContent = 'No se pudo resaltar: ' + est.error; return; }
    recibir(est, false);
  });
  cont.addEventListener('click', async e => {
    const fila = e.target.closest('[data-indice]');
    if (!fila) return;
    const r = await ctx.enviar('ir', { indice: Number(fila.dataset.indice) });
    if (r?.error) $('#estado').textContent = 'No se pudo ir al encabezado: ' + r.error;
  });
  // Una imagen social rota no debe dejar un hueco vacío
  cont.addEventListener('error', e => {
    if (e.target.matches?.('img.destacada')) e.target.replaceWith(Object.assign(document.createElement('div'), { className: 'aviso', textContent: 'No se pudo cargar la imagen.' }));
  }, true);

  $('#reanalizar').onclick = async () => {
    const est = await ctx.enviar('estado');
    recibir(est, true);
  };

  ctx.alEstado(est => recibir(est, true));
  recibir(await ctx.enviar('estado'), true);
}
