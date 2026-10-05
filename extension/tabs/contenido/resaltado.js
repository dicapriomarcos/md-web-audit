// Resaltado de la Tab Contenido (SPEC-004). Las tres funciones se inyectan con chrome.scripting.executeScript,
// por lo que son autocontenidas. El borde usa `outline` para no mover el layout (NFR-01).

export const COLORES = { 'sin-destino': '#ff4e42', anclas: '#ffa400', lorem: '#a855f7' };

// Dibuja el borde de las categorías activas (reemplaza la hoja de estilos anterior).
export function aplicarResaltado(activas, colores) {
  document.getElementById('mdwa-resaltado')?.remove();
  const reglas = activas.filter(c => colores[c]).map(c =>
    `[data-mdwa-cat~="${c}"]{outline:2px solid ${colores[c]} !important;outline-offset:1px !important}`);
  reglas.push('[data-mdwa-flash]{outline:4px solid #3b82f6 !important;outline-offset:3px !important}');
  const estilo = document.createElement('style');
  estilo.id = 'mdwa-resaltado';
  estilo.textContent = reglas.join('\n');
  (document.head || document.documentElement).appendChild(estilo);
}

// Desplaza la página hasta el elemento y lo destaca un instante. Devuelve false si ya no existe.
export function localizar(id) {
  const el = document.querySelector(`[data-mdwa-id="${id}"]`);
  if (!el) return false;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.setAttribute('data-mdwa-flash', '');
  setTimeout(() => el.removeAttribute('data-mdwa-flash'), 1500);
  return true;
}

// Retira estilos y marcas de la página (al apagar todo, cambiar de pestaña o cerrar el panel).
export function limpiar() {
  document.getElementById('mdwa-resaltado')?.remove();
  document.querySelectorAll('[data-mdwa-id],[data-mdwa-flash]').forEach(el => {
    el.removeAttribute('data-mdwa-id');
    el.removeAttribute('data-mdwa-cat');
    el.removeAttribute('data-mdwa-flash');
  });
}
