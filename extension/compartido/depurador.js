// Gestor único de chrome.debugger por pestaña (ADR-001).
// Las Tabs que necesitan CDP piden la conexión con usar() y la devuelven con soltar();
// el depurador solo se desengancha cuando ninguna la usa. Es el único archivo que llama
// a chrome.debugger.attach/detach.
//
// Varias Tabs piden la misma pestaña a la vez: la conexión se hace una sola vez por pestaña
// (promesa compartida) y todas esperan a ella. Nunca se desengancha mientras haya alguien conectando.

const usos = new Map();            // tabId -> Set(módulos que usan la conexión)
const conexiones = new Map();      // tabId -> Promise de la conexión en curso o ya hecha
const oyentesEvento = new Set();   // fn(tabId, método, parámetros)
const oyentesDetach = new Set();   // fn(tabId, motivo)

function mensajeAmigable(e) {
  const m = e?.message || String(e);
  if (/already attached/i.test(m)) return 'Hay otro depurador conectado a esta pestaña (¿DevTools abierto?). Ciérralo y vuelve a intentarlo.';
  return m;
}

function conectar(tabId) {
  let p = conexiones.get(tabId);
  if (p) return p;
  p = (async () => {
    const target = { tabId };
    try {
      await chrome.debugger.attach(target, '1.3');
    } catch {
      // Tras reiniciarse el service worker la conexión anterior sigue viva: se libera y se reintenta una vez.
      await chrome.debugger.detach(target).catch(() => {});
      try { await chrome.debugger.attach(target, '1.3'); }
      catch (e) { throw new Error(mensajeAmigable(e)); }
    }
  })();
  conexiones.set(tabId, p);
  p.catch(() => { if (conexiones.get(tabId) === p) conexiones.delete(tabId); });
  return p;
}

export async function usar(tabId, modulo) {
  let s = usos.get(tabId);
  if (!s) { s = new Set(); usos.set(tabId, s); }
  s.add(modulo);
  try {
    await conectar(tabId);
  } catch (e) {
    s.delete(modulo);
    if (s.size === 0) usos.delete(tabId);
    throw e;
  }
}

export async function soltar(tabId, modulo) {
  const s = usos.get(tabId);
  if (!s) return;
  s.delete(modulo);
  if (s.size === 0) {
    usos.delete(tabId);
    const p = conexiones.get(tabId);
    conexiones.delete(tabId);
    await p?.catch(() => {});
    // Otro módulo pudo pedirla mientras se esperaba: solo se desengancha si sigue sin usarla nadie.
    if (!usos.has(tabId)) await chrome.debugger.detach({ tabId }).catch(() => {});
  }
}

export function enviar(tabId, metodo, params) {
  return chrome.debugger.sendCommand({ tabId }, metodo, params);
}

export function alEvento(fn) { oyentesEvento.add(fn); }
export function alDesconectar(fn) { oyentesDetach.add(fn); }

chrome.debugger.onEvent.addListener((src, metodo, params) => {
  if (src.tabId == null) return;
  oyentesEvento.forEach(f => f(src.tabId, metodo, params));
});

chrome.debugger.onDetach.addListener((src, motivo) => {
  if (src.tabId == null) return;
  usos.delete(src.tabId);
  conexiones.delete(src.tabId);
  oyentesDetach.forEach(f => f(src.tabId, motivo));
});
