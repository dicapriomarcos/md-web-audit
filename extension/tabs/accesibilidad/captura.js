import { analizarPagina } from './analisis.js';
import { limpiar, localizar } from './resaltado.js';

const analizable = url => /^https?:\/\//i.test(url || '');

export function crearCaptura(ctx) {
  let pestana = null, documento = null, resultado = null, error = null, cargando = false;
  let secuencia = 0, temporizador = null, cola = Promise.resolve();
  const estado = () => ({ url: pestana?.url || '', analizable: analizable(pestana?.url), resultado, error, cargando });
  const empujar = () => ctx.empujar(estado());
  const ejecutar = (target, func, args = []) => chrome.scripting.executeScript({ target, func, args, world: 'ISOLATED' });
  async function retirar(id, doc) {
    if (id == null || !doc) return;
    try { await ejecutar({ tabId: id, documentIds: [doc] }, limpiar); } catch { /* documento cerrado */ }
  }

  function analizar() {
    clearTimeout(temporizador);
    if (!pestana || !analizable(pestana.url)) return Promise.resolve();
    const mia = ++secuencia, id = pestana.id;
    cargando = true; resultado = null; error = null; empujar();
    const vigente = () => mia === secuencia && pestana?.id === id;
    // Serializa carga e invocación; cada inyección se fija al documentId comprobado.
    cola = cola.catch(() => {}).then(async () => {
      if (!vigente()) return;
      try {
        const [sonda] = await ejecutar({ tabId: id }, () => location.href);
        if (!vigente()) return;
        if (!sonda?.documentId || sonda.result !== pestana.url) throw new Error('La página cambió. Volvé a analizar.');
        const doc = sonda.documentId, target = { tabId: id, documentIds: [doc] };
        documento = doc;
        await chrome.scripting.executeScript({ target, files: ['vendor/axe-core/axe.min.js', 'vendor/axe-core/locale-es.js'], world: 'ISOLATED' });
        if (!vigente()) return;
        const [r] = await ejecutar(target, analizarPagina);
        if (!vigente()) return;
        if (!r?.result) throw new Error('No se recibieron resultados del motor.');
        if (r.result.error) throw new Error(r.result.error);
        resultado = r.result;
      } catch (e) {
        if (!vigente()) return;
        resultado = null; error = 'No se pudo analizar esta página. Volvé a analizar: ' + (e?.message || String(e));
      }
      if (vigente()) { cargando = false; empujar(); }
    });
    return cola;
  }

  function seguir(tab) {
    const anterior = pestana, docAnterior = documento;
    const url = tab?.pendingUrl || tab?.url || '';
    // Invalida inmediatamente, antes de limpiar o esperar cualquier operación.
    secuencia++; clearTimeout(temporizador);
    pestana = tab ? { id: tab.id, url } : null;
    documento = null; resultado = null; error = null; cargando = !!tab && analizable(url);
    empujar();
    retirar(anterior?.id, docAnterior);
    if (cargando && tab.status !== 'loading') temporizador = setTimeout(analizar, 350);
  }

  async function detener() {
    const id = pestana?.id, doc = documento;
    secuencia++; clearTimeout(temporizador);
    pestana = null; documento = null; resultado = null; error = null; cargando = false;
    await retirar(id, doc);
  }

  async function comando(m) {
    if (m.cmd === 'reanalizar') await analizar();
    else if (m.cmd === 'limpiar-resaltado') await retirar(pestana?.id, documento);
    else if (m.cmd === 'localizar') {
      const mia = secuencia, id = pestana?.id, doc = documento;
      if (!resultado || !doc || m.ejecucion !== resultado.ejecucion) return { ...estado(), localizado: false };
      try {
        const [r] = await ejecutar({ tabId: id, documentIds: [doc] }, localizar, [m.id, m.ejecucion]);
        return { ...estado(), localizado: mia === secuencia && !!r?.result };
      } catch { return { ...estado(), localizado: false }; }
    }
    return estado();
  }
  return { seguir, detener, comando, estado };
}
