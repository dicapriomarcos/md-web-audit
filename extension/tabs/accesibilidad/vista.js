import { esc } from '../../compartido/formato.js';

const TIPOS = { problema: 'Problemas detectados', manual: 'Revisión manual', recomendacion: 'Recomendaciones' };
const GRAVEDADES = { critical: 'Crítica', serious: 'Alta', moderate: 'Media', minor: 'Baja', 'sin-clasificar': 'Sin clasificar' };

export function indicador(s) {
  const n = s?.resultado?.reglas.filter(r => r.tipo === 'problema').reduce((total, r) => total + r.total, 0) || 0;
  return n ? { texto: n > 99 ? '99+' : String(n), tipo: 'error', titulo: `${n} elementos con problemas de accesibilidad` } : null;
}

export async function montar(cont, ctx) {
  cont.innerHTML = `<div class="acc">
    <div class="ctl"><button type="button" data-accion="reanalizar">Volver a analizar</button><button type="button" data-accion="limpiar-resaltado">Quitar resaltado</button></div>
    <p class="nota">Análisis automático de WCAG 2.2 A/AA. No sustituye la revisión con teclado y lectores de pantalla ni certifica conformidad. Incluye el documento principal y Shadow DOM abierto; excluye iframes y Shadow DOM cerrado. Abrí menús o diálogos y volvé a analizar para revisarlos.</p>
    <div class="acc-url"></div>
    <div class="acc-estado" role="status" aria-live="polite"></div>
    <div class="acc-totales" aria-label="Resumen de la auditoría"></div>
    <div class="ctl acc-filtros">
      <label>Categoría <select data-filtro="tipo"><option value="">Todas</option>${Object.entries(TIPOS).map(([id, texto]) => `<option value="${id}">${texto}</option>`).join('')}</select></label>
      <label>Gravedad <select data-filtro="gravedad"><option value="">Todas</option>${Object.entries(GRAVEDADES).map(([id, texto]) => `<option value="${id}">${texto}</option>`).join('')}</select></label>
    </div>
    <div class="acc-lista"></div>
  </div>`;
  const $ = s => cont.querySelector(s);
  let actual = null, tipo = '', gravedad = '';
  const abiertas = new Set();
  function pintar(s) {
    actual = s;
    const r = s.resultado;
    $('.acc-url').textContent = s.url || '';
    $('[data-accion="reanalizar"]').disabled = !s.analizable || s.cargando;
    $('[data-accion="limpiar-resaltado"]').disabled = !r || s.cargando;
    $('.acc-estado').textContent = !s.analizable ? 'Esta página no se puede analizar: abrí una página HTTP o HTTPS.' : s.error || (s.cargando ? 'Analizando accesibilidad…' : r ? `Análisis terminado · axe-core ${r.motor}` : 'Sin datos todavía.');
    $('.acc-totales').innerHTML = !r ? '' : Object.entries(TIPOS).map(([id, texto]) => {
      const reglas = r.reglas.filter(x => x.tipo === id), elementos = reglas.reduce((n, x) => n + x.total, 0);
      return `<div class="tarjeta"><b>${elementos}</b><span>${texto}</span><small>${reglas.length} reglas · ${elementos} incidencias en elementos</small></div>`;
    }).join('');
    if (!r) { $('.acc-lista').replaceChildren(); return; }
    const reglas = r.reglas.filter(x => (!tipo || x.tipo === tipo) && (!gravedad || x.gravedad === gravedad));
    $('.acc-lista').innerHTML = reglas.length ? reglas.map(x => `<details class="tarjeta acc-regla" data-regla="${esc(x.tipo + ':' + x.id)}" ${abiertas.has(x.tipo + ':' + x.id) ? 'open' : ''}>
      <summary><strong>${esc(x.titulo)}</strong><span>${TIPOS[x.tipo]} · ${GRAVEDADES[x.gravedad]} · ${x.total} elementos</span></summary>
      <p class="nota">Regla ${esc(x.id)}${x.wcag.length ? ' · WCAG ' + esc(x.wcag.join(', ')) : ' · Buena práctica'}</p>
      ${x.nodos.map(n => `<div class="acc-nodo">
        <code>${esc(n.html)}</code><small>${esc(n.selector)}</small><p>${esc(n.explicacion || 'Revisá este elemento y su contexto.')}</p>
        ${n.contraste ? `<p>Contraste: ${n.contraste.ratio == null ? 'no determinable' : esc(String(n.contraste.ratio)) + ':1'}${n.contraste.umbral == null ? '' : ' · Umbral: ' + esc(String(n.contraste.umbral))}</p>` : ''}
        <button type="button" data-localizar="${esc(n.id)}" ${n.localizable ? '' : 'disabled'}>Localizar y resaltar</button>
      </div>`).join('')}
      ${x.total > x.nodos.length ? `<p class="nota">Mostrando ${x.nodos.length} de ${x.total} elementos. El total incluye todos los resultados de esta regla.</p>` : ''}
    </details>`).join('') : `<p class="vacio">${r.reglas.length ? 'No hay resultados para estos filtros.' : 'No se detectaron problemas automáticos. Completá la revisión manual.'}</p>`;
  }
  cont.addEventListener('toggle', e => {
    const id = e.target.dataset?.regla;
    if (id) { if (e.target.open) abiertas.add(id); else abiertas.delete(id); }
  }, true);
  cont.addEventListener('change', e => {
    if (e.target.dataset.filtro === 'tipo') tipo = e.target.value;
    if (e.target.dataset.filtro === 'gravedad') gravedad = e.target.value;
    if (actual) pintar(actual);
  });
  cont.addEventListener('click', async e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    try {
      if (b.dataset.localizar) {
        const r = await ctx.enviar('localizar', { id: b.dataset.localizar, ejecucion: actual?.resultado?.ejecucion });
        $('.acc-estado').textContent = r?.localizado ? 'Elemento localizado y resaltado.' : 'El elemento ya no está disponible. Volvé a analizar la página.';
      } else if (b.dataset.accion) {
        const r = await ctx.enviar(b.dataset.accion);
        if (r) pintar(r);
      }
    } catch { $('.acc-estado').textContent = 'No se pudo conectar con la auditoría. Volvé a abrir el panel.'; }
  });
  ctx.alEstado(pintar);
  const inicial = await ctx.enviar('estado');
  if (inicial) pintar(inicial);
}
