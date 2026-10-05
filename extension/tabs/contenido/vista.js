// Vista de la Tab Contenido: contadores, listas de hallazgos, interruptores de resaltado y resumen de enlaces.

import { esc } from '../../compartido/formato.js';

const CATEGORIAS = [
  { cat: 'sin-destino', clave: 'sinDestino', titulo: 'Enlaces sin destino', vacio: 'Ningún enlace sin destino.' },
  { cat: 'anclas', clave: 'anclas', titulo: 'Anclas rotas', vacio: 'Ninguna ancla rota.' },
  { cat: 'lorem', clave: 'lorem', titulo: 'Lorem ipsum', vacio: 'Sin texto de relleno.' }
];

// Insignia en la pestaña del panel: total de hallazgos (sin destino + anclas rotas + lorem ipsum); nada si no hay.
export function indicador(s) {
  const c = s?.resultado?.conteo;
  const n = c ? c.sinDestino + c.anclas + c.lorem : 0;
  return n ? { texto: String(n > 99 ? '99+' : n), tipo: 'error', titulo: n + ' hallazgos de contenido' } : null;
}

export async function montar(cont, ctx) {
  cont.innerHTML = `
    <div class="con">
      <div class="ctl"><span class="espacio"></span><button id="reanalizar" title="Volver a analizar la página">⟳ Reanalizar</button></div>
      <div id="cuerpo"><div class="vacio">Analizando…</div></div>
    </div>`;
  const $ = s => cont.querySelector(s);
  const abiertas = new Set(CATEGORIAS.map(c => c.cat));   // secciones desplegadas

  const ejecutar = (cmd, datos) => ctx.enviar(cmd, datos).then(s => { if (s && !s.error) pintar(s); return s; });
  $('#reanalizar').onclick = () => ejecutar('reanalizar');

  function pintar(s) {
    const cuerpo = $('#cuerpo');
    if (!s.analizable) { cuerpo.innerHTML = '<div class="vacio">Esta página no se puede analizar: solo funciona en páginas http y https.</div>'; return; }
    if (s.error) { cuerpo.innerHTML = `<div class="vacio">${esc(s.error)}</div>`; return; }
    const r = s.resultado;
    if (!r) { cuerpo.innerHTML = `<div class="vacio">${s.cargando ? 'Analizando…' : 'Sin datos todavía.'}</div>`; return; }

    const c = r.conteo, rs = r.resumen;
    const contadores = CATEGORIAS.map(k => `
      <label class="cont" style="--c:${s.colores[k.cat]}" title="Resaltar en la página con borde">
        <b>${c[k.clave]}</b><small>${k.titulo}</small>
        <span><input type="checkbox" data-resaltar="${k.cat}" ${s.activas.includes(k.cat) ? 'checked' : ''}> borde</span>
      </label>`).join('');

    const lista = (items, total, k, extra) => {
      if (!items.length) return extra ? '' : `<div class="vacio">${k.vacio}</div>`;
      return items.map(h => `
        <div class="hallazgo ${h.id ? '' : 'sin-id'}" ${h.id ? `data-id="${h.id}"` : ''} title="${h.id ? 'Clic para ir a este elemento' : 'Sin elemento que localizar'}">
          <span class="punto" style="background:${s.colores[k.cat] || 'var(--mut)'}"></span>
          <span class="txt">${h.fragmento !== undefined ? `<i>${esc(h.donde)}</i> «${esc(h.fragmento)}»` : esc(h.texto || '(sin texto)')}</span>
          ${h.href !== undefined ? `<code>${esc(h.destino || h.href)}</code>` : ''}
          <small class="sel">${esc(h.selector)}</small>
        </div>`).join('') + (total > items.length ? `<div class="nota">Mostrando ${items.length} de ${total}.</div>` : '');
    };

    const secciones = CATEGORIAS.map(k => {
      const botones = k.cat === 'sin-destino' && r.botones.length
        ? `<div class="subtit">Posibles botones (${c.botones}) · no cuentan como error</div>${lista(r.botones, c.botones, { cat: 'botones', vacio: '' }, true)}` : '';
      return `<details class="tarjeta" data-cat="${k.cat}" ${abiertas.has(k.cat) ? 'open' : ''}>
        <summary><h2>${k.titulo} (${c[k.clave]})</h2></summary>${lista(r[k.clave], c[k.clave], k)}${botones}</details>`;
    }).join('');

    cuerpo.innerHTML = `
      <div class="url">${esc(r.titulo || '')}<br>${esc(r.url)}</div>
      <div class="conts">${contadores}</div>
      ${r.shadow ? '<div class="nota aviso-sh">Esta página usa Shadow DOM: los enlaces y textos dentro no se analizan.</div>' : ''}
      ${secciones}
      <section class="tarjeta"><h2>Enlaces en la página</h2>
        <div class="cifras"><div><b>${rs.total}</b><small>total</small></div><div><b>${rs.internos}</b><small>internos</small></div>
        <div><b>${rs.externos}</b><small>externos</small></div><div><b>${rs.mailto}</b><small>mailto:</small></div>
        <div><b>${rs.tel}</b><small>tel:</small></div><div><b>${rs.otros}</b><small>otros</small></div></div></section>
      <div class="nota">No se hacen peticiones a los destinos: no se comprueba si responden.</div>`;
  }

  cont.addEventListener('change', e => {
    const k = e.target.dataset?.resaltar;
    if (k) ejecutar('resaltar', { categoria: k, valor: e.target.checked });
  });
  cont.addEventListener('toggle', e => {
    const d = e.target.closest?.('details[data-cat]');
    if (d) d.open ? abiertas.add(d.dataset.cat) : abiertas.delete(d.dataset.cat);
  }, true);
  cont.addEventListener('click', async e => {
    const h = e.target.closest('.hallazgo[data-id]');
    if (!h) return;
    const s = await ctx.enviar('localizar', { id: h.dataset.id });
    if (s && s.localizado === false) h.classList.add('perdido');   // el elemento ya no está: conviene reanalizar
  });

  ctx.alEstado(pintar);
  ejecutar('estado');
}
