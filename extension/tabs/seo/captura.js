// Parte de la Tab SEO que vive en el service worker. No usa el depurador: solo sigue la pestaña activa
// (para que la vista reanalice al navegar), aplica los bordes de resaltado y los retira al cerrar el panel.

import { aplicarResaltado, quitarResaltado, irAEncabezado } from './resaltado.js';

export function crearCaptura({ empujar }) {
  let actual = null;                     // { tabId, url, status, analizable }
  let marcado = { tabId: null, niveles: [], articles: false };
  let rev = 0;                           // cambia en cada aviso, así la vista reanaliza también al recargar

  const estado = () => ({
    tabId: actual?.tabId ?? null, url: actual?.url || '', status: actual?.status || '',
    analizable: !!actual?.analizable, rev,
    resaltado: marcado.tabId === actual?.tabId ? { niveles: marcado.niveles, articles: marcado.articles } : { niveles: [], articles: false }
  });

  async function limpiar() {
    const previa = marcado.tabId;
    marcado = { tabId: null, niveles: [], articles: false };
    if (previa != null) { try { await quitarResaltado(previa); } catch { /* pestaña cerrada o ya navegó */ } }
  }

  return {
    async seguir(tab) {
      const previa = actual;
      actual = tab ? { tabId: tab.id, url: tab.url || '', status: tab.status || '', analizable: /^https?:/i.test(tab.url || '') } : null;
      // Al cambiar de pestaña o de URL los bordes dejan de corresponder a lo que se ve
      if (marcado.tabId != null && (marcado.tabId !== actual?.tabId || previa?.url !== actual?.url)) await limpiar();
      rev++;
      empujar(estado());
    },

    async detener() { actual = null; await limpiar(); },

    async comando(m) {
      if (m.cmd === 'estado') return estado();
      if (!actual?.analizable) return estado();
      if (m.cmd === 'resaltar') {
        const niveles = (m.niveles || []).filter(n => n >= 1 && n <= 6);
        marcado = { tabId: actual.tabId, niveles, articles: !!m.articles };
        await aplicarResaltado(actual.tabId, niveles, marcado.articles);
        return estado();
      }
      if (m.cmd === 'ir') { await irAEncabezado(actual.tabId, Number(m.indice)); return estado(); }
      return estado();
    }
  };
}
