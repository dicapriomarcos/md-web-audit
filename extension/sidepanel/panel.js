// Shell del panel: barra de Tabs, carga de cada Tab y canal con el service worker.
import { TABS } from '../tabs/registro.js';

const barra = document.getElementById('tabs');
const contenido = document.getElementById('contenido');
const oyentes = {};   // id de Tab -> funciones que reciben su estado

// Mientras este puerto esté abierto, el service worker mide. Al cerrar el panel se desconecta solo.
const port = chrome.runtime.connect({ name: 'panel' });
port.onMessage.addListener(m => { if (m.tipo === 'estado') (oyentes[m.tab] || []).forEach(f => f(m.estado)); });
port.onDisconnect.addListener(() => { document.getElementById('aviso').hidden = false; });
document.getElementById('reconectar').onclick = () => location.reload();
chrome.windows.getCurrent().then(w => port.postMessage({ tipo: 'hola', windowId: w.id }));

// Preferencias por Tab en chrome.storage.local
const clavePrefs = id => 'mdwa_' + id;
const leer = async clave => { try { return (await chrome.storage.local.get(clave))[clave] || {}; } catch { return {}; } };
const guardar = async (clave, datos) => { try { await chrome.storage.local.set({ [clave]: { ...(await leer(clave)), ...datos } }); } catch { /* sin almacenamiento */ } };

const paneles = {};
async function activar(id) {
  for (const t of TABS) {
    barra.querySelector(`[data-id="${t.id}"]`)?.setAttribute('aria-selected', String(t.id === id));
    if (paneles[t.id]) paneles[t.id].hidden = t.id !== id;
  }
  guardar('mdwa_shell', { tab: id });
  if (!paneles[id]) {
    const t = TABS.find(x => x.id === id);
    const div = document.createElement('section');
    div.setAttribute('role', 'tabpanel');
    contenido.appendChild(div);
    paneles[id] = div;
    const ctx = {
      enviar: (cmd, datos = {}) => chrome.runtime.sendMessage({ tab: id, cmd, ...datos }),
      alEstado: fn => { (oyentes[id] ||= []).push(fn); },
      cargar: () => leer(clavePrefs(id)),
      guardar: datos => guardar(clavePrefs(id), datos)
    };
    await t.montar(div, ctx);
  }
}

barra.innerHTML = TABS.map(t => `<button role="tab" data-id="${t.id}" aria-selected="false">${t.titulo}<span class="insig" hidden></span></button>`).join('');

// Indicadores en la pestaña (p. ej. errores de la Consola): reciben el estado aunque la Tab no se haya abierto.
for (const t of TABS.filter(x => x.indicador)) {
  const boton = barra.querySelector(`[data-id="${t.id}"]`), insig = boton.querySelector('.insig');
  (oyentes[t.id] ||= []).push(estado => {
    const i = t.indicador(estado);
    insig.hidden = !i;
    if (i) { insig.textContent = i.texto; insig.className = 'insig ' + (i.tipo || ''); boton.title = i.titulo || ''; } else boton.title = '';
  });
  chrome.runtime.sendMessage({ tab: t.id, cmd: 'estado' }).then(e => e && !e.error && oyentes[t.id][0](e)).catch(() => {});
}
barra.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) activar(b.dataset.id); });

const { tab } = await leer('mdwa_shell');
await activar(TABS.some(t => t.id === tab) ? tab : TABS[0].id);
