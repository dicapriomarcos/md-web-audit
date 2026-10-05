// Captura de la Tab Consola. Corre en el service worker, usa chrome.debugger a través del
// depurador compartido y empuja el estado al panel. El registro vive solo en memoria, por pestaña (NFR-02).

import * as dep from '../../compartido/depurador.js';

const MODULO = 'consola';
const MAX_MENSAJES = 1000;   // NFR-01

const medible = url => /^https?:/.test(url || '');
const hostDe = u => { try { return new URL(u).host; } catch { return ''; } };

const NIVEL_CONSOLA = { log: 'log', info: 'info', warning: 'warn', error: 'error', debug: 'debug', assert: 'error', trace: 'log' };
const NIVEL_LOG = { verbose: 'debug', info: 'info', warning: 'warn', error: 'error' };

// Convierte un argumento de console.* a texto: valor primitivo o descripción, sin expandir objetos.
function argATexto(a) {
  if (a.type === 'string') return a.value;
  if ('value' in a) return String(a.value);
  if (a.unserializableValue) return a.unserializableValue;
  return a.description || a.className || a.type;
}

function pilaDe(st) {
  return (st?.callFrames || []).map(f => ({ fn: f.functionName || '(anónima)', url: f.url, linea: f.lineNumber + 1, col: f.columnNumber + 1 }));
}

export function crearCaptura(ctx) {
  const registros = new Map();   // tabId -> { mensajes, id, ultimoTs, host, borrarAlNavegar }
  const ui = { borrarAlNavegar: false };
  let run = null, activa = false, estadoTxt = 'Esperando…';
  let pestana = null, ocupado = false, repetir = false, timerEmpuje = null;
  let reproduciendo = false;   // true mientras Chrome reenvía los mensajes que ya conserva (FR-03)

  const registro = tabId => {
    let r = registros.get(tabId);
    if (!r) { r = { mensajes: [], id: 0, ultimoTs: 0, host: '' }; registros.set(tabId, r); }
    return r;
  };

  // --- Estado hacia el panel ---
  function estado() {
    const r = run ? registros.get(run.tabId) : null;
    const mensajes = r ? r.mensajes : [];
    const cuenta = { error: 0, warn: 0, info: 0 };
    for (const m of mensajes) {
      if (m.tipo !== 'msg') continue;
      if (m.nivel === 'error') cuenta.error += m.n;
      else if (m.nivel === 'warn') cuenta.warn += m.n;
      else cuenta.info += m.n;   // info, log y debug
    }
    return { running: activa, status: estadoTxt, borrarAlNavegar: ui.borrarAlNavegar, cuenta, mensajes, host: r?.host || '' };
  }
  function empujarYa() { if (timerEmpuje) { clearTimeout(timerEmpuje); timerEmpuje = null; } ctx.empujar(estado()); }
  function empujar() {
    if (timerEmpuje) return;
    timerEmpuje = setTimeout(() => { timerEmpuje = null; ctx.empujar(estado()); }, 250);
  }

  // --- Registro de mensajes ---
  function anadir(tabId, m) {
    const r = registro(tabId);
    if (reproduciendo && m.ts <= r.ultimoTs) return;   // ya lo teníamos de un enganche anterior
    r.ultimoTs = Math.max(r.ultimoTs, m.ts || 0);
    const ult = r.mensajes[r.mensajes.length - 1];
    const o = m.origen, uo = ult?.origen;
    if (ult && ult.tipo === 'msg' && ult.nivel === m.nivel && ult.texto === m.texto && ult.fuente === m.fuente &&
        (o?.url || '') === (uo?.url || '') && (o?.linea || 0) === (uo?.linea || 0) && (o?.col || 0) === (uo?.col || 0)) {
      ult.n++; ult.hora = m.ts;   // agrupa repetidos consecutivos (FR-04)
    } else {
      r.mensajes.push({ tipo: 'msg', id: ++r.id, n: 1, hora: m.ts, hostPagina: r.host, ...m, ts: undefined });
      if (r.mensajes.length > MAX_MENSAJES) r.mensajes.shift();   // NFR-01
    }
    empujar();
  }

  function navegacion(tabId, url) {
    const r = registro(tabId);
    r.host = hostDe(url);
    if (ui.borrarAlNavegar) r.mensajes.length = 0;
    r.mensajes.push({ tipo: 'nav', id: ++r.id, url, hora: Date.now() });
    if (r.mensajes.length > MAX_MENSAJES) r.mensajes.shift();
    empujar();
  }

  // --- Normalización de eventos CDP (FR-02) ---
  function consolaAPI(tabId, p) {
    const pila = pilaDe(p.stackTrace);
    const f = pila[0];
    let texto = p.args.map(argATexto).join(' ');
    if (p.type === 'assert') texto = 'Assertion failed' + (texto ? ': ' + texto : '');
    if (p.type === 'trace') texto = texto || 'console.trace';
    anadir(tabId, {
      fuente: 'consola', nivel: NIVEL_CONSOLA[p.type] || 'log', texto, ts: p.timestamp,
      origen: f ? { url: f.url, linea: f.linea, col: f.col } : null,
      pila: p.type === 'error' || p.type === 'assert' || p.type === 'trace' ? pila : []
    });
  }

  function excepcion(tabId, p) {
    const d = p.exceptionDetails;
    const pila = pilaDe(d.stackTrace);
    const texto = d.exception?.description?.split('\n')[0] || d.text || 'Excepción no capturada';
    anadir(tabId, {
      fuente: 'excepcion', nivel: 'error', texto: texto.startsWith('Uncaught') ? texto : 'Uncaught ' + texto, ts: p.timestamp,
      origen: d.url ? { url: d.url, linea: d.lineNumber + 1, col: d.columnNumber + 1 } : (pila[0] ? { url: pila[0].url, linea: pila[0].linea, col: pila[0].col } : null),
      pila
    });
  }

  function entradaNavegador(tabId, p) {
    const e = p.entry;
    // console-api y javascript ya llegan por Runtime (consoleAPICalled / exceptionThrown): se omiten para no duplicar.
    if (e.source === 'console-api' || e.source === 'javascript') return;
    const pila = pilaDe(e.stackTrace);
    anadir(tabId, {
      fuente: 'navegador', nivel: NIVEL_LOG[e.level] || 'info', texto: e.text, ts: e.timestamp,
      origen: e.url ? { url: e.url, linea: (e.lineNumber ?? 0) + 1, col: 0 } : null,
      pila, categoria: e.source
    });
  }

  // --- Conexión con la pestaña ---
  async function enganchar(tab) {
    if (!medible(tab.url)) {
      run = { tabId: tab.id, target: false };
      estadoTxt = 'Esta pestaña no se puede analizar (solo http/https). Abre un sitio y se engancha sola.';
      return;
    }
    try {
      await dep.usar(tab.id, MODULO);
    } catch (e) {
      run = { tabId: tab.id, target: false };
      estadoTxt = 'Error: ' + e.message;
      return;
    }
    run = { tabId: tab.id, target: true };
    const r = registro(tab.id);
    if (!r.host) r.host = hostDe(tab.url);
    estadoTxt = 'Escuchando la consola. Solo se muestra lo que Chrome conserva de antes de abrir el panel.';
    reproduciendo = true;
    try {
      await dep.enviar(tab.id, 'Page.enable');
      await dep.enviar(tab.id, 'Runtime.enable');   // reenvía los console.* y excepciones conservados
      await dep.enviar(tab.id, 'Log.enable');       // reenvía las entradas del navegador conservadas
    } finally {
      reproduciendo = false;
    }
  }

  async function soltarRun() {
    if (!run) return;
    const r = run; run = null;
    if (!r.target) return;
    await dep.enviar(r.tabId, 'Log.disable').catch(() => {});
    await dep.enviar(r.tabId, 'Runtime.disable').catch(() => {});
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

  // --- Eventos CDP ---
  dep.alEvento((tabId, metodo, p) => {
    if (!run?.target || tabId !== run.tabId) return;
    switch (metodo) {
      case 'Runtime.consoleAPICalled': consolaAPI(tabId, p); break;
      case 'Runtime.exceptionThrown': excepcion(tabId, p); break;
      case 'Log.entryAdded': entradaNavegador(tabId, p); break;
      case 'Page.frameNavigated': if (!p.frame.parentId) navegacion(tabId, p.frame.url); break;
    }
  });

  dep.alDesconectar((tabId, motivo) => {
    if (!run || tabId !== run.tabId) return;
    run = null;
    if (motivo === 'canceled_by_user') {
      activa = false;
      estadoTxt = 'Detenido (cancelaste la depuración). Cierra y abre el panel para volver a escuchar.';
      empujarYa();
    } else {
      estadoTxt = 'Pestaña desconectada (' + motivo + ').';
      seguir(pestana);
    }
  });

  // Al cerrarse una pestaña se libera su registro
  chrome.tabs.onRemoved.addListener(id => registros.delete(id));

  // --- Comandos desde el panel ---
  async function comando(m) {
    switch (m.cmd) {
      case 'estado': break;
      case 'limpiar': if (run) { const r = registro(run.tabId); r.mensajes.length = 0; } break;
      case 'borrarAlNavegar': ui.borrarAlNavegar = !!m.valor; break;
      case 'exportar': {
        const r = run ? registros.get(run.tabId) : null;
        return { json: JSON.stringify((r?.mensajes || []).map(({ id, ...x }) => ({ ...x, hora: new Date(x.hora).toISOString() })), null, 2) };
      }
    }
    return estado();
  }

  return { seguir, detener, comando, estado };
}
