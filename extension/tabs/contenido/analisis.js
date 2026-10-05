// Análisis de la Tab Contenido (SPEC-004). `analizarPagina` se inyecta con chrome.scripting.executeScript:
// se serializa entera, así que NO puede usar nada de fuera de su cuerpo. Solo lee el DOM; no hace peticiones (NFR-02).
// Devuelve { url, titulo, resumen, conteo, sinDestino, botones, anclas, lorem, shadow }.

export const MAX_POR_CATEGORIA = 500;

export function analizarPagina(maximo) {
  const LOREM = /lorem\s+ipsum|dolor\s+sit\s+amet|consectetur\s+adipiscing/i;

  // Se retiran las marcas de un análisis anterior para no acumular atributos.
  document.querySelectorAll('[data-mdwa-id]').forEach(el => {
    el.removeAttribute('data-mdwa-id');
    el.removeAttribute('data-mdwa-cat');
  });

  let contador = 0;
  const marcar = (el, cat) => {
    if (!el.hasAttribute('data-mdwa-id')) el.setAttribute('data-mdwa-id', String(++contador));
    const previas = (el.getAttribute('data-mdwa-cat') || '').split(' ').filter(Boolean);
    if (!previas.includes(cat)) el.setAttribute('data-mdwa-cat', [...previas, cat].join(' '));
    return el.getAttribute('data-mdwa-id');
  };

  // Selector aproximado: hasta 3 niveles con id, o etiqueta + 2 clases, y posición entre hermanos del mismo tipo.
  const selector = el => {
    const partes = [];
    for (let n = el, i = 0; n && n.nodeType === 1 && n !== document.documentElement && i < 3; n = n.parentElement, i++) {
      let p = n.localName;
      if (n.id) { partes.unshift(p + '#' + n.id); break; }
      const clases = [...n.classList].slice(0, 2);
      if (clases.length) p += '.' + clases.join('.');
      const hermanos = n.parentElement ? [...n.parentElement.children].filter(h => h.localName === n.localName) : [];
      if (hermanos.length > 1) p += ':nth-of-type(' + (hermanos.indexOf(n) + 1) + ')';
      partes.unshift(p);
    }
    return partes.join(' > ');
  };

  const visible = el => {
    if (typeof el.checkVisibility === 'function') return el.checkVisibility({ checkVisibilityCSS: true, visibilityProperty: true });
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden') return false;
    }
    return true;
  };

  const recortar = txt => {
    const t = txt.replace(/\s+/g, ' ');
    const ini = Math.max(0, t.search(LOREM) - 15);
    return (ini > 0 ? '…' : '') + t.slice(ini, ini + 70).trim() + (ini + 70 < t.length ? '…' : '');
  };

  const res = { url: location.href, titulo: document.title, resumen: { total: 0, internos: 0, externos: 0, mailto: 0, tel: 0, otros: 0 },
    conteo: { sinDestino: 0, botones: 0, anclas: 0, lorem: 0 }, sinDestino: [], botones: [], anclas: [], lorem: [], shadow: false };

  const base = location.href.split('#')[0];
  const sinDestinoJs = /^javascript:\s*(void\s*\(\s*0?\s*\)\s*;?|;?|undefined)?\s*$/i;
  const parecenBoton = a => a.getAttribute('role') === 'button' || a.hasAttribute('onclick') ||
    a.hasAttribute('aria-controls') || a.hasAttribute('aria-expanded') || a.hasAttribute('data-toggle') || a.hasAttribute('data-bs-toggle');

  const anadir = (cat, clave, el, extra) => {
    res.conteo[clave]++;
    if (res[clave].length < maximo) res[clave].push({ id: marcar(el, cat), selector: selector(el), ...extra });
  };

  for (const a of document.querySelectorAll('a')) {
    const crudo = a.getAttribute('href');
    if (crudo == null && a.hasAttribute('name')) continue;   // <a name="x"> es un destino de ancla, no un enlace
    const href = crudo == null ? null : crudo.trim();
    const texto = (a.textContent || a.getAttribute('aria-label') || a.querySelector('img[alt]')?.getAttribute('alt') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const datos = { texto, href: crudo == null ? '(sin href)' : crudo };

    if (href == null || href === '' || href === '#' || sinDestinoJs.test(href)) {
      if (parecenBoton(a)) anadir('botones', 'botones', a, datos);
      else anadir('sin-destino', 'sinDestino', a, datos);
      if (href != null) res.resumen.total++;
      continue;
    }
    res.resumen.total++;

    if (/^mailto:/i.test(href)) { res.resumen.mailto++; continue; }
    if (/^tel:/i.test(href)) { res.resumen.tel++; continue; }
    let u;
    try { u = new URL(href, location.href); } catch { res.resumen.otros++; continue; }
    if (!/^https?:$/.test(u.protocol)) { res.resumen.otros++; continue; }
    if (u.origin === location.origin) res.resumen.internos++; else res.resumen.externos++;

    // Ancla rota: solo enlaces a la misma página con #id. Se excluyen #, #!, #top y las directivas de texto (:~:).
    if (u.href.split('#')[0] !== base || u.hash.length < 2) continue;
    if (u.hash.startsWith('#!') || u.hash.includes(':~:') || u.hash.toLowerCase() === '#top') continue;
    let id = u.hash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* se queda tal cual */ }
    if (document.getElementById(id) || document.querySelector('[name="' + CSS.escape(id) + '"]')) continue;
    anadir('anclas', 'anclas', a, { ...datos, destino: '#' + id });
  }

  // Lorem ipsum en texto visible (nodos de texto fuera de script/style/noscript y de elementos ocultos).
  const omitir = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
  const cacheVis = new Map();
  const tw = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  for (let nodo; (nodo = tw.nextNode());) {
    const txt = nodo.nodeValue;
    if (!txt || txt.length < 11 || !LOREM.test(txt)) continue;
    const padre = nodo.parentElement;
    if (!padre || omitir.has(padre.tagName)) continue;
    if (!cacheVis.has(padre)) cacheVis.set(padre, visible(padre));
    if (!cacheVis.get(padre)) continue;
    anadir('lorem', 'lorem', padre, { donde: 'texto', fragmento: recortar(txt) });
  }
  for (const el of document.querySelectorAll('[alt],[title],[placeholder]')) {
    for (const attr of ['alt', 'title', 'placeholder']) {
      const v = el.getAttribute(attr);
      if (v && LOREM.test(v)) anadir('lorem', 'lorem', el, { donde: attr, fragmento: recortar(v) });
    }
  }
  // Metas sin elemento visible que localizar: se listan igualmente, sin id.
  const meta = [['title', document.title], ['meta description', document.querySelector('meta[name="description" i]')?.content]];
  for (const [donde, v] of meta) {
    if (v && LOREM.test(v)) {
      res.conteo.lorem++;
      if (res.lorem.length < maximo) res.lorem.push({ id: null, selector: donde === 'title' ? 'head > title' : 'head > meta[name=description]', donde, fragmento: recortar(v) });
    }
  }

  for (const el of document.querySelectorAll('*')) { if (el.shadowRoot) { res.shadow = true; break; } }
  return res;
}
