// Service worker: abre el panel lateral al pulsar el icono y orquesta las capturas de las Tabs.
// Mientras el panel está abierto (puerto conectado) se mide la pestaña activa de su ventana;
// al cerrarlo se detienen las capturas y se libera el depurador.

import { TABS } from './tabs/registro.js';

const capturas = {};
let sesion = null;   // { port, windowId }

for (const t of TABS) {
  if (!t.crearCaptura) continue;
  capturas[t.id] = t.crearCaptura({
    empujar: estado => { try { sesion?.port.postMessage({ tipo: 'estado', tab: t.id, estado }); } catch { /* panel cerrado */ } }
  });
}

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

async function seguirActiva() {
  if (!sesion) return;
  const [tab] = await chrome.tabs.query({ active: true, windowId: sesion.windowId });
  await Promise.all(Object.values(capturas).map(c => c.seguir(tab || null)));
}

chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'panel') return;
  port.onMessage.addListener(m => {
    if (m.tipo !== 'hola') return;
    sesion = { port, windowId: m.windowId };
    seguirActiva();
  });
  port.onDisconnect.addListener(() => {
    if (sesion?.port !== port) return;   // ya hay un panel más reciente
    sesion = null;
    Object.values(capturas).forEach(c => c.detener());
  });
});

chrome.tabs.onActivated.addListener(({ windowId }) => { if (sesion?.windowId === windowId) seguirActiva(); });
chrome.tabs.onUpdated.addListener((id, info, tab) => {
  // Una recarga de la misma URL también invalida los resultados de accesibilidad.
  if (sesion && tab.active && tab.windowId === sesion.windowId && info.status === 'loading') capturas.accesibilidad?.seguir(tab);
  if (sesion && tab.active && tab.windowId === sesion.windowId && (info.url || info.status === 'complete')) seguirActiva();
});

// Comandos desde las Tabs del panel: { tab, cmd, ...datos }
chrome.runtime.onMessage.addListener((m, sender, responder) => {
  const c = capturas[m?.tab];
  if (!c) return false;
  c.comando(m).then(responder, e => responder({ error: e?.message || String(e) }));
  return true;
});
