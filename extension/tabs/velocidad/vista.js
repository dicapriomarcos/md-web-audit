// Vista de la Tab Velocidad: resumen con score y métricas, historial y lista de requests.

import { bytes, ms, esc, colorNota, dominio, nombre } from '../../compartido/formato.js';

const CORTO = { Document: 'HTML', Script: 'JS', Stylesheet: 'CSS', Image: 'IMG', Font: 'FONT', Media: 'MEDIA', 'Fetch/XHR': 'XHR', Otros: '···' };

export async function montar(cont, ctx) {
  const prefs = await ctx.cargar();
  const ui = { filtro: 'Todos', q: '', orden: prefs.orden || 'recientes' };
  let ultimo = null;

  cont.innerHTML = `
    <div class="vel">
      <div class="ctl">
        <select id="perfil"><option value="desktop">Escritorio</option><option value="mobile">Móvil (CPU 4x + 4G lenta)</option></select>
        <label><input type="checkbox" id="sincache"> sin caché</label>
        <span class="espacio"></span>
        <button id="recargar" title="Recargar sin caché y medir">⟳ Recargar</button>
        <button id="limpiar" title="Limpiar historial">Limpiar</button>
        <button id="exportar" title="Exportar historial a JSON">Exportar</button>
      </div>
      <div class="estado" id="estado"></div>
      <section class="tarjeta"><h2>Páginas visitadas</h2><div id="hist"></div></section>
      <section class="tarjeta" id="detalle"><div class="vacio">Navega y se va llenando solo.</div></section>
    </div>`;
  const $ = s => cont.querySelector(s);

  const ejecutar = (cmd, datos) => ctx.enviar(cmd, datos).then(s => s && !s.json && pintar(s));
  $('#perfil').onchange = e => ejecutar('perfil', { valor: e.target.value });
  $('#sincache').onchange = e => ejecutar('sincache', { valor: e.target.checked });
  $('#recargar').onclick = () => ejecutar('recargar');
  $('#limpiar').onclick = () => ejecutar('limpiar');
  $('#exportar').onclick = async () => {
    const r = await ctx.enviar('exportar'); if (!r?.json) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([r.json], { type: 'application/json' }));
    a.download = 'md-web-audit-velocidad-' + Date.now() + '.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  function pintar(s) {
    ultimo = s;
    $('#estado').textContent = s.status; $('#estado').title = s.status;
    if (document.activeElement !== $('#perfil')) $('#perfil').value = s.profile;
    $('#sincache').checked = s.noCache;

    const reciente = s.hist.length ? s.hist[s.hist.length - 1].n : null;
    const sel = s.want ?? reciente;
    $('#hist').innerHTML = s.hist.length ? [...s.hist].reverse().map(h => `
      <div class="h ${h.n === sel ? 'sel' : ''}" data-n="${h.n}" title="${esc(h.url)}"><small>#${h.n}</small>
        <span class="u">${esc(nombre(h.url))} <small>${esc(dominio(h.url))}</small></span>
        <span class="insignia" ${h.score != null ? `style="background:${colorNota(h.score)}"` : ''}>${h.score != null ? Math.round(h.score * 100) : '–'}</span>
        <small style="text-align:right">${bytes(h.transfer)}</small></div>`).join('')
      : '<div class="vacio">Sin páginas todavía.</div>';
    pintarDetalle(s);
  }

  function pintarDetalle(s) {
    const d = s.detail, caja = $('#detalle');
    if (!d) { caja.innerHTML = '<div class="vacio">Navega y se va llenando solo.</div>'; delete caja.dataset.n; return; }
    const R = d.reqs, m = d.m, sc = d.score;
    const tt = R.reduce((a, r) => a + r.transfer, 0), ts = R.reduce((a, r) => a + r.size, 0);
    const grupos = {};
    R.forEach(r => { const g = grupos[r.group] ||= { n: 0, t: 0 }; g.n++; g.t += r.transfer; });
    const maxG = Math.max(...Object.values(grupos).map(g => g.t), 1);
    const loseta = (etq, val, k) => `<div class="m" style="--c:${sc ? colorNota(sc[k]) : 'var(--mut)'}"><small>${etq}</small><b>${val}</b></div>`;
    const total = sc ? sc.total : null;

    // Los controles se crean solo al cambiar de página para conservar el foco y el desplegable abierto.
    if (caja.dataset.n !== String(d.n)) {
      caja.dataset.n = d.n;
      caja.innerHTML = `<div id="resumen"></div><div class="herr"><span id="chips" class="filtros-tipo"></span>
        <input id="q" placeholder="Filtrar URL…" value="${esc(ui.q)}"><select id="orden">
          <option value="recientes">Recientes</option><option value="pesados">Más pesados</option><option value="lentos">Más lentos</option>
        </select></div><div id="lista"></div>`;
      $('#orden').value = ui.orden;
    }
    $('#resumen').innerHTML = `
      <div class="url">${esc(d.title || '')}<br>${esc(d.url)}</div>
      <div class="cima">
        <div class="medidor" style="background:conic-gradient(${total != null ? colorNota(total) : 'var(--bd)'} ${(total || 0) * 360}deg,var(--bd) 0)"><span style="color:${total != null ? colorNota(total) : 'var(--mut)'}">${total != null ? Math.round(total * 100) : '–'}</span></div>
        <div class="losetas">${loseta('FCP', m.fcp ? ms(m.fcp) : '…', 'fcp')}${loseta('LCP', m.lcp ? ms(m.lcp) : '…', 'lcp')}${loseta('TBT', ms(m.tbt), 'tbt')}${loseta('CLS', m.cls.toFixed(3), 'cls')}</div>
      </div>
      <div class="cifras">
        <div><b>${R.length}</b><small>requests</small></div><div><b>${bytes(tt)}</b><small>transferido</small></div>
        <div><b>${bytes(ts)}</b><small>descomprim.</small></div><div><b>${m.load ? ms(m.load) : '…'}</b><small>load</small></div>
        <div><b>${ms(m.ttfb || 0)}</b><small>TTFB</small></div><div><b>${m.dcl ? ms(m.dcl) : '…'}</b><small>DCL</small></div>
        <div><b>${m.nodes}</b><small>nodos DOM</small></div>
      </div>
      ${Object.entries(grupos).sort((a, b) => b[1].t - a[1].t).map(([g, v]) =>
        `<div class="fila-tipo"><span>${CORTO[g] || g}</span><div class="barra" style="width:${Math.max(2, v.t / maxG * 100)}%"></div><span>${bytes(v.t)} · ${v.n}</span></div>`).join('')}`;

    $('#chips').innerHTML = ['Todos', ...Object.keys(grupos)].map(g => `<button data-g="${g}" class="${g === ui.filtro ? 'on' : ''}">${CORTO[g] || g}</button>`).join('');
    pintarLista(R);
    caja._pintar = () => pintarLista(R);
  }

  function pintarLista(todos) {
    const dur = r => (r.end ?? r.start) - r.start;
    const filas = todos.filter(r => (ui.filtro === 'Todos' || r.group === ui.filtro) && r.url.toLowerCase().includes(ui.q.toLowerCase()));
    filas.sort(ui.orden === 'pesados' ? (a, b) => b.transfer - a.transfer : ui.orden === 'lentos' ? (a, b) => dur(b) - dur(a) : (a, b) => b.start - a.start);
    const max = Math.max(...filas.map(r => r.transfer), 1);
    $('#lista').innerHTML = filas.slice(0, 400).map(r => {
      const pct = Math.round(r.transfer / max * 100);
      return `<div class="fila" style="background:linear-gradient(90deg,var(--suave) ${pct}%,transparent ${pct}%)" title="${esc(r.url)}">
        <span class="nm">${esc(nombre(r.url))}<small>${esc(dominio(r.url))}</small></span>
        <span class="ty">${CORTO[r.group] || r.group}</span>
        <span class="sz ${r.transfer > 102400 ? 'pesado' : ''}">${r.failed ? '❌' : r.cache && !r.transfer ? 'caché' : bytes(r.transfer)}</span>
        <span class="tm ${r.end == null ? 'pend' : ''}">${r.end == null ? '…' : ms(dur(r))}</span></div>`;
    }).join('') + (filas.length > 400 ? `<div class="nota">Mostrando 400 de ${filas.length}.</div>` : '') +
      '<div class="nota">Score aproximado (sin Speed Index): útil para comparar páginas entre sí, no como cifra oficial de Lighthouse.</div>';
  }

  // Eventos del contenido dinámico (delegación)
  cont.addEventListener('click', e => {
    const h = e.target.closest('.h');
    if (h && ultimo) {
      const n = +h.dataset.n, ult = ultimo.hist[ultimo.hist.length - 1]?.n;
      ejecutar('elegir', { n: n === ult ? null : n });
      return;
    }
    const g = e.target.closest('[data-g]');
    if (g) { ui.filtro = g.dataset.g; cont.querySelectorAll('[data-g]').forEach(b => b.classList.toggle('on', b === g)); $('#detalle')._pintar?.(); }
  });
  cont.addEventListener('input', e => { if (e.target.id === 'q') { ui.q = e.target.value; $('#detalle')._pintar?.(); } });
  cont.addEventListener('change', e => { if (e.target.id === 'orden') { ui.orden = e.target.value; ctx.guardar({ orden: ui.orden }); $('#detalle')._pintar?.(); } });

  ctx.alEstado(pintar);
  ejecutar('estado');
}
