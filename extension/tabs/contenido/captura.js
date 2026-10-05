// Captura de la Tab Contenido. Corre en el service worker: analiza la pestaña activa con
// chrome.scripting al navegar, al cambiar de pestaña o bajo demanda, y empuja el estado al panel.
// No usa el depurador, así que no muestra el aviso de depuración de Chrome.

import { analizarPagina, MAX_POR_CATEGORIA } from './analisis.js';
import { aplicarResaltado, localizar, limpiar, COLORES } from './resaltado.js';

const analizable = url => /^https?:/.test(url || '');

export function crearCaptura(ctx) {
  let pestana = null;          // { id, url } de la pestaña seguida
  let activas = [];            // categorías con borde en la página
  let resultado = null;
  let error = null;
  let cargando = false;
  let secuencia = 0;           // descarta análisis que llegan tarde
  let temporizador = null;

  const estado = () => ({
    url: pestana?.url || '', analizable: analizable(pestana?.url), cargando, error, activas, resultado, colores: COLORES
  });
  const empujar = () => ctx.empujar(estado());

  const inyectar = (func, args = []) => chrome.scripting.executeScript({ target: { tabId: pestana.id }, func, args });

  async function analizar() {
    clearTimeout(temporizador);
    if (!pestana) return;
    if (!analizable(pestana.url)) { resultado = null; error = null; cargando = false; return empujar(); }
    const mia = ++secuencia, id = pestana.id;
    cargando = true; error = null; empujar();
    try {
      const [r] = await inyectar(analizarPagina, [MAX_POR_CATEGORIA]);
      if (mia !== secuencia) return;
      resultado = r?.result || null;
      if (activas.length) await inyectar(aplicarResaltado, [activas, COLORES]);
    } catch (e) {
      if (mia !== secuencia) return;
      resultado = null; error = 'No se pudo analizar esta página: ' + (e?.message || e);
    }
    if (mia === secuencia && pestana?.id === id) { cargando = false; empujar(); }
  }

  // El análisis se pospone un poco: una navegación dispara varios eventos seguidos.
  const programar = () => { clearTimeout(temporizador); temporizador = setTimeout(analizar, 350); };

  async function limpiarPagina(id) {
    try { await chrome.scripting.executeScript({ target: { tabId: id }, func: limpiar }); } catch { /* pestaña cerrada o no accesible */ }
  }

  async function seguir(tab) {
    const cambia = pestana && pestana.id !== tab?.id;
    if (cambia) { const anterior = pestana.id; activas = []; await limpiarPagina(anterior); }
    pestana = tab ? { id: tab.id, url: tab.url || tab.pendingUrl || '' } : null;
    if (cambia) { resultado = null; error = null; }
    if (!pestana) { resultado = null; return empujar(); }
    if (!analizable(pestana.url)) { resultado = null; error = null; return empujar(); }
    programar();
  }

  async function detener() {
    clearTimeout(temporizador);
    secuencia++;
    const id = pestana?.id;
    activas = []; resultado = null; error = null; cargando = false; pestana = null;
    if (id != null) await limpiarPagina(id);
  }

  async function comando(m) {
    if (m.cmd === 'reanalizar') await analizar();
    else if (m.cmd === 'resaltar' && pestana && analizable(pestana.url)) {
      activas = m.valor ? [...new Set([...activas, m.categoria])] : activas.filter(c => c !== m.categoria);
      try { await inyectar(aplicarResaltado, [activas, COLORES]); }
      catch (e) { error = 'No se pudo resaltar: ' + (e?.message || e); }
    } else if (m.cmd === 'localizar' && pestana) {
      try { const [r] = await inyectar(localizar, [m.id]); return { ...estado(), localizado: !!r?.result }; }
      catch (e) { return { ...estado(), localizado: false }; }
    }
    return estado();
  }

  return { seguir, detener, comando, estado };
}
