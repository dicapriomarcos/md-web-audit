// Función autocontenida para chrome.scripting; no depende de imports del service worker.
export async function analizarPagina() {
  const clave = '__mdwaAcc';
  const memoria = globalThis[clave] ||= { nodos: new Map(), ejecucion: 0, pendiente: null };
  // La exclusión también vive en el documento por si se reinicia el service worker.
  const anterior = memoria.pendiente || Promise.resolve();
  const trabajo = async () => {
    memoria.limpiar?.();
    if (!globalThis.axe || !globalThis.__mdwaLocaleAcc) throw new Error('El motor local no está disponible.');
    // La configuración de locale del motor compila plantillas con eval, prohibido en MV3.
    // Se traduce la salida con los mismos datos locales y sustitución de campos, sin eval.
    const locale = globalThis.__mdwaLocaleAcc;
    const traducir = (texto, data) => typeof texto === 'string' ? texto.replace(/\$\{data(?:\.([\w.]+))?\}/g, (_, campo) => {
      const valor = campo ? campo.split('.').reduce((v, p) => v?.[p], data) : data;
      return valor == null ? 'no disponible' : Array.isArray(valor) ? valor.join(', ') : typeof valor === 'object' ? 'revisar contexto' : String(valor);
    }) : '';
    const bruto = await axe.run({ exclude: [['iframe'], ['[data-mdwa-accesibilidad]']] }, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      iframes: false, resultTypes: ['violations', 'incomplete'],
      // Evita que el motor precargue hojas de estilo o medios mediante peticiones.
      preload: false
    });
    memoria.nodos.clear();
    const ejecucion = ++memoria.ejecucion;
    const resolver = ruta => {
      try {
        let raiz = document, nodo;
        for (const selector of ruta) {
          if (typeof selector !== 'string' || !raiz) return null;
          nodo = raiz.querySelector(selector); raiz = nodo?.shadowRoot;
        }
        return nodo;
      } catch { return null; }
    };
    const reglas = [];
    for (const categoria of ['violations', 'incomplete']) {
      for (const r of bruto[categoria] || []) {
        const wcag = (r.tags || []).filter(t => /^wcag\d{3,4}$/.test(t)).map(t => {
          const n = t.slice(4); return `${n[0]}.${n[1]}.${n.slice(2)}`;
        });
        const tipo = categoria === 'incomplete' ? 'manual' : wcag.length ? 'problema' : 'recomendacion';
        const nodos = r.nodes.slice(0, 100).map((n, indice) => {
          const id = `${ejecucion}:${tipo}:${r.id}:${indice}`;
          const nodo = resolver(n.target);
          if (nodo) memoria.nodos.set(id, nodo);
          const comprobaciones = [...(n.any || []), ...(n.all || []), ...(n.none || [])];
          const contraste = comprobaciones.find(c => c.id === 'color-contrast')?.data;
          return {
            id, localizable: !!nodo, selector: n.target.map(t => typeof t === 'string' ? t : '(selector complejo)').join(' → '),
            html: (n.html || '').slice(0, 1500),
            explicacion: comprobaciones.map(c => {
              const mensajes = locale.checks?.[c.id];
              let texto = categoria === 'incomplete' ? mensajes?.incomplete : mensajes?.fail;
              if (texto && typeof texto === 'object') texto = texto[c.data?.messageKey] || texto.default;
              const mensaje = traducir(texto, c.data).trim();
              return mensaje ? mensaje.replace(/[.!?]+$/, '') + '.' : '';
            }).filter(Boolean).join(' ') || 'Revisá este elemento y su contexto para resolver la regla indicada.',
            contraste: contraste ? { ratio: contraste.contrastRatio ?? null, umbral: contraste.expectedContrastRatio ?? null } : null
          };
        });
        reglas.push({ id: r.id, titulo: locale.rules?.[r.id]?.help || 'Revisar accesibilidad: ' + r.id, tipo, gravedad: r.impact || 'sin-clasificar', wcag,
          total: r.nodes.length, nodos });
      }
    }
    const orden = { critical: 0, serious: 1, moderate: 2, minor: 3, 'sin-clasificar': 4 };
    reglas.sort((a, b) => orden[a.gravedad] - orden[b.gravedad] || a.titulo.localeCompare(b.titulo, 'es'));
    return { ejecucion, motor: bruto.testEngine.version, fecha: Date.now(), reglas };
  };
  const pendiente = anterior.catch(() => {}).then(trabajo);
  memoria.pendiente = pendiente;
  try { return await pendiente; }
  catch (e) { return { error: e?.message || String(e) }; }
  finally { if (memoria.pendiente === pendiente) memoria.pendiente = null; }
}
