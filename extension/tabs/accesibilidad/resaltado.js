// Capa independiente: nunca cambia atributos ni estilos de los elementos auditados.
export function limpiar() { globalThis.__mdwaAcc?.limpiar?.(); }

export function localizar(id, ejecucion) {
  const memoria = globalThis.__mdwaAcc;
  const nodo = memoria?.ejecucion === ejecucion && memoria.nodos.get(id);
  if (!nodo?.isConnected) return false;
  memoria.limpiar?.();
  nodo.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  const capa = document.createElement('div');
  capa.dataset.mdwaAccesibilidad = '';
  capa.setAttribute('aria-hidden', 'true');
  capa.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;';
  const sombra = capa.attachShadow({ mode: 'closed' });
  const pintar = () => {
    sombra.replaceChildren();
    if (!nodo.isConnected) return memoria.limpiar?.();
    for (const rect of nodo.getClientRects()) {
      if (!rect.width || !rect.height) continue;
      const borde = document.createElement('div');
      borde.style.cssText = `position:fixed;box-sizing:border-box;pointer-events:none;border:3px solid #3b82f6;outline:1px solid #ffffff;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;`;
      sombra.appendChild(borde);
    }
  };
  memoria.limpiar = () => {
    capa.remove(); document.removeEventListener('scroll', pintar, true); window.removeEventListener('resize', pintar);
    memoria.limpiar = null;
  };
  document.documentElement.appendChild(capa);
  document.addEventListener('scroll', pintar, true); window.addEventListener('resize', pintar);
  pintar();
  return true;
}
