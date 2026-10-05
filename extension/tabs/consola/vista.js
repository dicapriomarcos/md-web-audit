// Vista de la Tab Consola: cabecera con contadores y filtros, lista de mensajes con pila desplegable,
// separadores de navegación, copiar y exportar.

import { esc, dominio, nombre } from '../../compartido/formato.js';

const ICONO = { error: '✖', warn: '▲', info: 'ℹ', log: '●', debug: '○' };
const ETIQUETA = { error: 'Errores', warn: 'Avisos', info: 'Info/log' };

// Indicador de la pestaña del panel (campo `indicador` de la Tab, ver registro.js)
export function indicador(s) {
  const n = s?.cuenta?.error || 0;
  return n ? { texto: String(n > 99 ? '99+' : n), tipo: 'error', titulo: n + ' errores en la consola' } : null;
}

const horaRel = t => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  return s < 5 ? 'ahora' : s < 60 ? `hace ${s} s` : s < 3600 ? `hace ${Math.round(s / 60)} min` : `hace ${Math.round(s / 3600)} h`;
};
const textoOrigen = o => o ? `${o.url}${o.linea ? ':' + o.linea : ''}${o.col ? ':' + o.col : ''}` : '';

function textoCompleto(m) {
  const o = textoOrigen(m.origen);
  const pila = (m.pila || []).map(f => `    en ${f.fn} (${f.url}:${f.linea}:${f.col})`).join('\n');
  return `[${m.nivel}] ${m.texto}` + (o ? `\n    ${o}` : '') + (pila ? '\n' + pila : '');
}

export async function montar(cont, ctx) {
  const prefs = await ctx.cargar();
  const ui = { nivel: 'Todos', q: '', otrosDominios: !!prefs.ocultarOtros };
  let ultimo = null;
  const abiertos = new Set();   // ids de mensajes con la pila desplegada

  cont.innerHTML = `
    <div class="con">
      <div class="ctl">
        <span id="cuentas" class="cuentas"></span>
        <span class="espacio"></span>
        <button id="limpiar" title="Vaciar el registro">Limpiar</button>
        <button id="exportar" title="Exportar el registro a JSON">Exportar</button>
      </div>
      <div class="herr">
        <button data-n="Todos" class="on">Todos</button><button data-n="error">Errores</button><button data-n="warn">Avisos</button><button data-n="info">Info</button><button data-n="log">Log</button><button data-n="debug">Debug</button>
        <input id="q" placeholder="Buscar texto…">
      </div>
      <div class="ctl">
        <label><input type="checkbox" id="otros"> Ocultar mensajes de otros dominios</label>
        <label><input type="checkbox" id="borrar"> Borrar al navegar</label>
      </div>
      <div class="estado" id="estado"></div>
      <div id="lista" class="lista-con"></div>
    </div>`;
  const $ = s => cont.querySelector(s);
  $('#otros').checked = ui.otrosDominios;

  const ejecutar = (cmd, datos) => ctx.enviar(cmd, datos).then(s => s && !s.json && pintar(s));
  $('#limpiar').onclick = () => ejecutar('limpiar');
  $('#borrar').onchange = e => ejecutar('borrarAlNavegar', { valor: e.target.checked });
  $('#otros').onchange = e => { ui.otrosDominios = e.target.checked; ctx.guardar({ ocultarOtros: ui.otrosDominios }); if (ultimo) pintarLista(ultimo); };
  $('#exportar').onclick = async () => {
    const r = await ctx.enviar('exportar'); if (!r?.json) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([r.json], { type: 'application/json' }));
    a.download = 'md-web-audit-consola-' + Date.now() + '.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  function copiar(texto, btn) {
    navigator.clipboard.writeText(texto).then(() => {
      if (!btn) return;
      const t = btn.textContent; btn.textContent = '✓'; setTimeout(() => { btn.textContent = t; }, 900);
    }).catch(() => {});
  }

  function pintar(s) {
    ultimo = s;
    $('#estado').textContent = s.status; $('#estado').title = s.status;
    $('#borrar').checked = s.borrarAlNavegar;
    $('#cuentas').innerHTML = ['error', 'warn', 'info'].map(k =>
      `<span class="cu ${k}" title="${ETIQUETA[k]}">${ICONO[k]} ${s.cuenta[k]}</span>`).join('');
    pintarLista(s);
  }

  function visible(m, s) {
    if (m.tipo === 'nav') return true;
    if (ui.nivel !== 'Todos' && m.nivel !== ui.nivel) return false;
    if (ui.q && !(m.texto + ' ' + textoOrigen(m.origen)).toLowerCase().includes(ui.q.toLowerCase())) return false;
    if (ui.otrosDominios && m.origen?.url && /^https?:/.test(m.origen.url) && dominio(m.origen.url) !== m.hostPagina) return false;
    return true;
  }

  function pintarLista(s) {
    const caja = $('#lista');
    const pegado = caja.scrollHeight - caja.scrollTop - caja.clientHeight < 40;
    const filas = s.mensajes.filter(m => visible(m, s));
    if (!s.mensajes.length) { caja.innerHTML = '<div class="vacio">Sin mensajes. Los <code>console.*</code>, errores y avisos del navegador aparecerán aquí.</div>'; return; }
    if (!filas.some(m => m.tipo === 'msg')) { caja.innerHTML = '<div class="vacio">Ningún mensaje cumple los filtros.</div>'; return; }
    caja.innerHTML = filas.map(m => {
      if (m.tipo === 'nav') return `<div class="sep" title="${esc(m.url)}">Navegó a ${esc(m.url)}</div>`;
      const o = m.origen, abierto = abiertos.has(m.id), conPila = m.pila?.length > 0;
      return `<div class="msg ${m.nivel}" data-id="${m.id}">
        <span class="ic">${ICONO[m.nivel]}</span>
        <div class="cuerpo">
          <div class="tx">${conPila ? `<button class="pila-b" data-pila="${m.id}" title="Ver la pila">${abierto ? '▾' : '▸'}</button>` : ''}${esc(m.texto)}${m.n > 1 ? ` <span class="rep">${m.n}</span>` : ''}</div>
          ${abierto ? `<div class="pila">${m.pila.map(f => `<div>en ${esc(f.fn)} <small>${esc(nombre(f.url))}:${f.linea}:${f.col}</small></div>`).join('')}</div>` : ''}
          <div class="pie"><small>${horaRel(m.hora)}${m.categoria ? ' · ' + esc(m.categoria) : ''}</small>
            ${o ? `<a href="#" class="org" data-org="${m.id}" title="Copiar ${esc(textoOrigen(o))}">${esc(nombre(o.url))}${o.linea ? ':' + o.linea : ''}${o.col ? ':' + o.col : ''}</a>` : ''}</div>
        </div>
        <button class="cp" data-cp="${m.id}" title="Copiar el mensaje completo">⧉</button></div>`;
    }).join('');
    if (pegado) caja.scrollTop = caja.scrollHeight;
  }

  cont.addEventListener('click', e => {
    if (!ultimo) return;
    const n = e.target.closest('[data-n]');
    if (n) { ui.nivel = n.dataset.n; cont.querySelectorAll('[data-n]').forEach(b => b.classList.toggle('on', b === n)); pintarLista(ultimo); return; }
    const pila = e.target.closest('[data-pila]');
    if (pila) { const id = +pila.dataset.pila; abiertos.has(id) ? abiertos.delete(id) : abiertos.add(id); pintarLista(ultimo); return; }
    const org = e.target.closest('[data-org]');
    if (org) {   // FR-09: clic en el origen copia «archivo:línea:columna»
      e.preventDefault();
      const m = ultimo.mensajes.find(x => x.id === +org.dataset.org);
      if (m) copiar(textoOrigen(m.origen));
      return;
    }
    const cp = e.target.closest('[data-cp]');
    if (cp) { const m = ultimo.mensajes.find(x => x.id === +cp.dataset.cp); if (m) copiar(textoCompleto(m), cp); }
  });
  cont.addEventListener('input', e => { if (e.target.id === 'q') { ui.q = e.target.value; if (ultimo) pintarLista(ultimo); } });

  ctx.alEstado(pintar);
  ejecutar('estado');
}
