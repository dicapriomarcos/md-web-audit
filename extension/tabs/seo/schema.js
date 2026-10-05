// Datos estructurados de la página (T-10). `leerSchemas` se inyecta con chrome.scripting.executeScript,
// así que debe ser autocontenida. Devuelve [{ formato, tipos[], json, invalido?, error? }].

export function leerSchemas() {
  const MAX_JSON = 20000;
  const salida = [];
  const ultimo = t => String(t).split(/[\/#:]/).filter(Boolean).pop() || String(t);
  const recortar = s => s.length > MAX_JSON ? s.slice(0, MAX_JSON) + '\n… (recortado)' : s;

  // — JSON-LD (con @graph); un JSON mal formado se muestra como inválido sin romper nada
  const tiposJsonLd = (nodo, acc) => {
    if (Array.isArray(nodo)) nodo.forEach(n => tiposJsonLd(n, acc));
    else if (nodo && typeof nodo === 'object') {
      if (nodo['@type']) [].concat(nodo['@type']).forEach(t => acc.add(ultimo(t)));
      if (nodo['@graph']) tiposJsonLd(nodo['@graph'], acc);
    }
    return acc;
  };
  document.querySelectorAll('script[type="application/ld+json" i]').forEach(s => {
    const crudo = s.textContent.trim();
    try {
      const datos = JSON.parse(crudo);
      salida.push({ formato: 'JSON-LD', tipos: [...tiposJsonLd(datos, new Set())], json: recortar(JSON.stringify(datos, null, 2)) });
    } catch (e) {
      salida.push({ formato: 'JSON-LD', tipos: [], invalido: true, error: e.message, json: recortar(crudo) });
    }
  });

  // — Microdata y RDFa: se recorren los elementos de nivel superior y se extraen sus propiedades
  const texto = el => el.textContent.replace(/\s+/g, ' ').trim().slice(0, 300);
  const valor = (el, rdfa) => {
    const t = el.tagName.toLowerCase();
    if (el.hasAttribute('content')) return el.getAttribute('content');
    if (rdfa && el.hasAttribute('resource')) return el.getAttribute('resource');
    if (['a', 'link', 'area'].includes(t)) return el.href;
    if (['img', 'audio', 'video', 'source', 'embed', 'iframe'].includes(t)) return el.src;
    if (t === 'time') return el.getAttribute('datetime') || texto(el);
    if (t === 'data' || t === 'meter') return el.getAttribute('value') || texto(el);
    return texto(el);
  };
  const leerNodo = (el, m, prof) => {
    const tipos = (el.getAttribute(m.tipo) || '').split(/\s+/).filter(Boolean).map(ultimo);
    const obj = { '@type': tipos.length === 1 ? tipos[0] : tipos };
    const recorrer = padre => {
      for (const hijo of padre.children) {
        const nombres = (hijo.getAttribute(m.prop) || '').split(/\s+/).filter(Boolean);
        const esNodo = hijo.hasAttribute(m.alcance);
        if (nombres.length) {
          const v = esNodo ? (prof < 4 ? leerNodo(hijo, m, prof + 1) : '…') : valor(hijo, m.rdfa);
          nombres.forEach(n => { n = ultimo(n); obj[n] = n in obj ? [].concat(obj[n], [v]) : v; });
        }
        if (!esNodo) recorrer(hijo);   // un nodo anidado es otro ítem: sus propiedades no son de este
      }
    };
    recorrer(el);
    return obj;
  };
  const extraer = (formato, selector, m) => {
    document.querySelectorAll(selector).forEach(el => {
      if (el.parentElement?.closest(`[${m.alcance}]`)) return;   // solo nodos de nivel superior
      const obj = leerNodo(el, m, 0);
      salida.push({ formato, tipos: [].concat(obj['@type']), json: recortar(JSON.stringify(obj, null, 2)) });
    });
  };
  extraer('Microdata', '[itemscope][itemtype]', { alcance: 'itemscope', prop: 'itemprop', tipo: 'itemtype', rdfa: false });
  extraer('RDFa', '[typeof]', { alcance: 'typeof', prop: 'property', tipo: 'typeof', rdfa: true });

  return salida;
}
