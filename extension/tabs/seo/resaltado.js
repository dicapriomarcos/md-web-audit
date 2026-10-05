// Resaltado sobre la página (T-07, T-09): bordes con `outline` para no mover el layout (NFR-01).
// Las funciones inyectadas son autocontenidas; las exportadas con chrome.scripting corren en el service worker.

export const ID_ESTILO = 'mdwa-resaltado';

// H1 rojo, H2 naranja, H3 verde, H4 azul, H5 violeta, H6 gris, <article> turquesa discontinuo
export const COLORES = { 1: '#e11d48', 2: '#f97316', 3: '#16a34a', 4: '#2563eb', 5: '#8b5cf6', 6: '#6b7280' };
export const COLOR_ARTICLE = '#0d9488';

export function crearCss(niveles, articles) {
  const reglas = [...niveles].sort().map(n => `h${n}{outline:2px solid ${COLORES[n]} !important;outline-offset:2px !important}`);
  if (articles) reglas.push(`article{outline:2px dashed ${COLOR_ARTICLE} !important;outline-offset:5px !important}`);
  return reglas.join('\n');
}

// Inyecta (o retira, si el css va vacío) el <style> de resaltado en la página
function ponerEstilo(id, css) {
  document.getElementById(id)?.remove();
  if (!css) return;
  const estilo = document.createElement('style');
  estilo.id = id;
  estilo.textContent = css;
  (document.head || document.documentElement).appendChild(estilo);
}

// Desplaza la página hasta el encabezado número `indice` (en orden de aparición) y lo destaca un instante
function destacar(indice) {
  const el = document.querySelectorAll('h1,h2,h3,h4,h5,h6')[indice];
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const antes = [el.style.getPropertyValue('outline'), el.style.getPropertyPriority('outline'), el.style.getPropertyValue('outline-offset')];
  el.style.setProperty('outline', '4px solid #facc15', 'important');
  el.style.setProperty('outline-offset', '3px', 'important');
  setTimeout(() => {
    el.style.removeProperty('outline'); el.style.removeProperty('outline-offset');
    if (antes[0]) el.style.setProperty('outline', antes[0], antes[1]);
    if (antes[2]) el.style.setProperty('outline-offset', antes[2]);
  }, 1400);
  return true;
}

export async function aplicarResaltado(tabId, niveles, articles) {
  await chrome.scripting.executeScript({ target: { tabId }, func: ponerEstilo, args: [ID_ESTILO, crearCss(niveles, articles)] });
}

export const quitarResaltado = tabId => aplicarResaltado(tabId, [], false);

export async function irAEncabezado(tabId, indice) {
  await chrome.scripting.executeScript({ target: { tabId }, func: destacar, args: [indice] });
}
