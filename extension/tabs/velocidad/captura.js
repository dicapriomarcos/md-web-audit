// Captura de la Tab Velocidad. Corre en el service worker, usa chrome.debugger a través del
// depurador compartido y empuja el estado al panel. Cada navegación crea una «página» en el historial.

import * as dep from '../../compartido/depurador.js';
import { puntuar, cls, tbt } from './puntuacion.js';

const MODULO = 'velocidad';
const MAX_PAGINAS = 60;

const OBSERVER = `(() => {
  if (window.__perf) return;
  const p = window.__perf = { fcp: 0, lcp: 0, shifts: [], tasks: [] };
  const obs = (type, fn) => { try { new PerformanceObserver(l => l.getEntries().forEach(fn)).observe({ type, buffered: true }); } catch (e) {} };
  obs('paint', e => { if (e.name === 'first-contentful-paint') p.fcp = e.startTime; });
  obs('largest-contentful-paint', e => { p.lcp = e.startTime; });
  obs('layout-shift', e => { if (!e.hadRecentInput) p.shifts.push([e.startTime, e.value]); });
  obs('longtask', e => { p.tasks.push([e.startTime, e.duration]); });
})();`;

const COLLECT = `JSON.stringify((() => {
  const n = performance.getEntriesByType('navigation')[0] || {};
  return { perf: window.__perf || null, o: performance.timeOrigin, title: document.title, url: location.href,
    nav: { ttfb: n.responseStart, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd },
    nodes: document.getElementsByTagName('*').length };
})())`;

const BACKFILL = `JSON.stringify((() => {
  const n = performance.getEntriesByType('navigation')[0] || {};
  return { o: performance.timeOrigin, url: location.href, title: document.title,
    doc: { t: n.transferSize || 0, s: n.decodedBodySize || 0, en: n.responseEnd || 0, status: n.responseStatus || 200 },
    res: performance.getEntriesByType('resource').map(e => ({ u: e.name, it: e.initiatorType, t: e.transferSize, s: e.decodedBodySize, st: e.startTime, en: e.responseEnd })) };
})())`;

const PERFILES = {
  mobile: { cpu: 4, red: { offline: false, latency: 150, downloadThroughput: 180000, uploadThroughput: 84000 } },
  desktop: { cpu: 1, red: null }
};
const SIN_RED = { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 };

const medible = url => /^https?:/.test(url || '');

function grupoPorTipo(t) {
  if (['Document', 'Script', 'Stylesheet', 'Image', 'Font', 'Media'].includes(t)) return t;
  if (t === 'XHR' || t === 'Fetch') return 'Fetch/XHR';
  return 'Otros';
}

function adivinarGrupo(url, it) {
  const p = url.split('?')[0].toLowerCase();
  if (/\.(woff2?|ttf|otf|eot)$/.test(p)) return 'Font';
  if (/\.css$/.test(p)) return 'Stylesheet';
  if (/\.m?js$/.test(p)) return 'Script';
  if (/\.(png|jpe?g|gif|webp|avif|svg|ico|bmp)$/.test(p)) return 'Image';
  if (/\.(mp4|webm|mp3|ogg|wav|m4a)$/.test(p)) return 'Media';
  if (it === 'script') return 'Script';
  if (it === 'img') return 'Image';
  if (it === 'fetch' || it === 'xmlhttprequest') return 'Fetch/XHR';
  if (it === 'link') return 'Stylesheet';
  return 'Otros';
}

const crearReq = o => ({ type: 'Other', group: 'Otros', status: 0, transfer: 0, size: 0, cache: false, failed: false, end: null, ts0: 0, ...o });

export function crearCaptura(ctx) {
  const paginas = [];
  const ui = { perfil: 'desktop', sinCache: false, elegida: null };   // elegida: n de página (null = la última)
  let run = null, activa = false, estadoTxt = 'Esperando…', contador = 0;
  let pestana = null, ocupado = false, repetir = false, timerEmpuje = null;

  const actual = () => paginas[paginas.length - 1];

  function nuevaPagina(url, origen, tabId, titulo) {
    const p = { n: ++contador, url, title: titulo || '', origen, tabId, reqs: new Map(),
      m: { fcp: 0, lcp: 0, tbt: 0, cls: 0, ttfb: 0, dcl: 0, load: 0, nodes: 0 } };
    paginas.push(p);
    if (paginas.length > MAX_PAGINAS) paginas.shift();
    return p;
  }

  // --- Estado hacia el panel ---
  function estado() {
    const idx = ui.elegida === null ? paginas.length - 1 : paginas.findIndex(p => p.n === ui.elegida);
    const sel = idx >= 0 ? paginas[idx] : null;
    const detalle = sel && {
      n: sel.n, url: sel.url, title: sel.title, m: sel.m, score: puntuar(sel.m, ui.perfil),
      reqs: [...sel.reqs.values()].map(r => ({ id: r.id, url: r.url, group: r.group, status: r.status, transfer: r.transfer, size: r.size, start: r.start, end: r.end, cache: r.cache, failed: r.failed }))
    };
    return {
      running: activa, status: estadoTxt, profile: ui.perfil, noCache: ui.sinCache, want: ui.elegida, detail: detalle,
      hist: paginas.map(p => ({ n: p.n, url: p.url, score: puntuar(p.m, ui.perfil)?.total ?? null, reqs: p.reqs.size, transfer: [...p.reqs.values()].reduce((s, r) => s + r.transfer, 0) }))
    };
  }
  function empujarYa() { if (timerEmpuje) { clearTimeout(timerEmpuje); timerEmpuje = null; } ctx.empujar(estado()); }
  function empujar() {
    if (timerEmpuje) return;
    timerEmpuje = setTimeout(() => { timerEmpuje = null; ctx.empujar(estado()); }, 250);
  }

  // --- Conexión con la pestaña ---
  async function aplicarCondiciones() {
    if (!run?.target) return;
    const pr = PERFILES[ui.perfil];
    const id = run.tabId;
    await dep.enviar(id, 'Network.setCacheDisabled', { cacheDisabled: ui.sinCache });
    await dep.enviar(id, 'Network.emulateNetworkConditions', pr.red || SIN_RED);
    await dep.enviar(id, 'Emulation.setCPUThrottlingRate', { rate: pr.cpu });
  }

  async function rellenarPagina(tabId) {
    const { result } = await dep.enviar(tabId, 'Runtime.evaluate', { expression: BACKFILL, returnByValue: true });
    const d = JSON.parse(result.value);
    const p = nuevaPagina(d.url, d.o, tabId, d.title);
    p.reqs.set('doc', crearReq({ id: 'doc', url: d.url, type: 'Document', group: 'Document', status: d.doc.status, transfer: d.doc.t, size: d.doc.s, start: 0, end: d.doc.en }));
    d.res.forEach((e, i) => p.reqs.set('b' + i, crearReq({
      id: 'b' + i, url: e.u, group: adivinarGrupo(e.u, e.it), status: 200, transfer: e.t || 0, size: e.s || 0,
      cache: e.t === 0 && e.s > 0, start: e.st, end: e.en
    })));
  }

  async function enganchar(tab) {
    if (!medible(tab.url)) {
      run = { tabId: tab.id, target: null };
      estadoTxt = 'Esta pestaña no se puede medir (solo http/https). Abre un sitio y se engancha sola.';
      return;
    }
    try {
      await dep.usar(tab.id, MODULO);
    } catch (e) {
      run = { tabId: tab.id, target: null };
      estadoTxt = 'Error: ' + e.message;
      return;
    }
    run = { tabId: tab.id, target: true, hijos: new Set(), principal: null, scriptId: null, timer: null };
    const id = tab.id;
    await dep.enviar(id, 'Network.enable');
    await dep.enviar(id, 'Page.enable');
    await aplicarCondiciones();
    run.scriptId = (await dep.enviar(id, 'Page.addScriptToEvaluateOnNewDocument', { source: OBSERVER })).identifier;
    const { frameTree } = await dep.enviar(id, 'Page.getFrameTree');
    run.principal = frameTree.frame.id;
    (function recorrer(t) { (t.childFrames || []).forEach(c => { run.hijos.add(c.frame.id); recorrer(c); }); })(frameTree);
    await dep.enviar(id, 'Runtime.evaluate', { expression: OBSERVER });   // página ya cargada: toma lo bufferizado
    await rellenarPagina(id);
    run.timer = setInterval(sondear, 1000);                                // además mantiene vivo el service worker
    estadoTxt = 'Midiendo… navega normalmente.';
    sondear();
  }

  async function soltarRun() {
    if (!run) return;
    const r = run; run = null;
    clearInterval(r.timer);
    if (!r.target) return;
    const cmd = (m, p) => dep.enviar(r.tabId, m, p).catch(() => {});
    await cmd('Emulation.setCPUThrottlingRate', { rate: 1 });
    await cmd('Network.emulateNetworkConditions', SIN_RED);
    await cmd('Network.setCacheDisabled', { cacheDisabled: false });
    if (r.scriptId) await cmd('Page.removeScriptToEvaluateOnNewDocument', { identifier: r.scriptId });
    await dep.soltar(r.tabId, MODULO);
  }

  // Sigue a la pestaña que se le indique (la activa de la ventana del panel).
  async function seguir(tab) {
    activa = true;
    pestana = tab;
    if (ocupado) { repetir = true; return; }
    ocupado = true;
    try {
      do {
        repetir = false;
        const t = pestana;
        if (!t) { estadoTxt = 'No hay ninguna pestaña activa.'; break; }
        if (run && run.tabId === t.id && (run.target || !medible(t.url))) continue;
        await soltarRun();
        await enganchar(t);
      } while (repetir);
    } catch (e) {
      estadoTxt = 'Error: ' + (e?.message || e);
    } finally {
      ocupado = false;
      empujarYa();
    }
  }

  async function detener() {
    activa = false;
    pestana = null;
    estadoTxt = 'Detenido.';
    await soltarRun();
  }

  async function sondear() {
    if (!run?.target) return;
    try {
      const { result } = await dep.enviar(run.tabId, 'Runtime.evaluate', { expression: COLLECT, returnByValue: true });
      const d = JSON.parse(result.value);
      const p = actual();
      if (!p || p.tabId !== run.tabId || !d.perf) return;
      if (Math.abs(d.o - p.origen) > 5000) return;             // lectura de un documento anterior
      const fcp = d.perf.fcp || 0;
      p.origen = d.o; p.title = d.title; p.url = d.url;
      p.m = {
        fcp, lcp: d.perf.lcp || 0, cls: cls(d.perf.shifts || []), tbt: tbt(d.perf.tasks || [], fcp),
        ttfb: d.nav.ttfb || 0, dcl: d.nav.dcl || 0, load: d.nav.load || 0, nodes: d.nodes
      };
      empujar();
    } catch { /* navegando */ }
  }

  // --- Eventos de red ---
  dep.alEvento((tabId, metodo, p) => {
    if (!run?.target || tabId !== run.tabId) return;
    let pagina = actual();
    switch (metodo) {
      case 'Page.frameAttached': run.hijos.add(p.frameId); return;
      case 'Page.frameDetached': run.hijos.delete(p.frameId); return;
      case 'Page.frameNavigated': if (!p.frame.parentId) run.principal = p.frame.id; return;
      case 'Network.requestWillBeSent': {
        if (p.type === 'Document' && p.requestId === p.loaderId && !p.redirectResponse && !run.hijos.has(p.frameId)) {
          pagina = nuevaPagina(p.request.url, p.wallTime * 1000, run.tabId);   // navegación nueva
        }
        if (!pagina) return;
        const previa = pagina.reqs.get(p.requestId);
        pagina.reqs.set(p.requestId, crearReq({
          id: p.requestId, url: p.request.url, type: p.type || 'Other', group: grupoPorTipo(p.type),
          ts0: previa ? previa.ts0 : p.timestamp, start: previa ? previa.start : p.wallTime * 1000 - pagina.origen
        }));
        break;
      }
      case 'Network.responseReceived': {
        const r = pagina?.reqs.get(p.requestId); if (!r) return;
        r.status = p.response.status;
        r.cache = !!(p.response.fromDiskCache || p.response.fromServiceWorker);
        r.type = p.type || r.type; r.group = grupoPorTipo(r.type);
        break;
      }
      case 'Network.requestServedFromCache': { const r = pagina?.reqs.get(p.requestId); if (r) r.cache = true; break; }
      case 'Network.dataReceived': {
        const r = pagina?.reqs.get(p.requestId); if (!r) return;
        r.size += p.dataLength; r.transfer += p.encodedDataLength;
        break;
      }
      case 'Network.loadingFinished': {
        const r = pagina?.reqs.get(p.requestId); if (!r) return;
        r.transfer = p.encodedDataLength;
        r.end = r.start + (p.timestamp - r.ts0) * 1000;
        break;
      }
      case 'Network.loadingFailed': {
        const r = pagina?.reqs.get(p.requestId); if (!r) return;
        r.failed = true; r.end = r.start + (p.timestamp - r.ts0) * 1000;
        break;
      }
      default: return;
    }
    empujar();
  });

  dep.alDesconectar((tabId, motivo) => {
    if (!run || tabId !== run.tabId) return;
    clearInterval(run.timer);
    run = null;
    if (motivo === 'canceled_by_user') {
      activa = false;
      estadoTxt = 'Detenido (cancelaste la depuración). Cierra y abre el panel para volver a medir.';
      empujarYa();
    } else {
      estadoTxt = 'Pestaña desconectada (' + motivo + ').';
      seguir(pestana);
    }
  });

  // --- Comandos desde el panel ---
  async function comando(m) {
    switch (m.cmd) {
      case 'estado': break;
      case 'recargar': if (run?.target) await dep.enviar(run.tabId, 'Page.reload', { ignoreCache: true }); break;
      case 'limpiar':
        paginas.length = 0; ui.elegida = null;
        if (run?.target) await rellenarPagina(run.tabId);
        break;
      case 'perfil': ui.perfil = m.valor; await aplicarCondiciones(); break;
      case 'sincache': ui.sinCache = !!m.valor; await aplicarCondiciones(); break;
      case 'elegir': ui.elegida = m.n; break;
      case 'exportar':
        return { json: JSON.stringify(paginas.map(p => ({ n: p.n, url: p.url, title: p.title, metrics: p.m, score: puntuar(p.m, ui.perfil), requests: [...p.reqs.values()].map(({ ts0, ...r }) => r) })), null, 2) };
    }
    return estado();
  }

  return { seguir, detener, comando, estado };
}
