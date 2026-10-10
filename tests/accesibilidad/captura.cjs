// Contratos de concurrencia: datos tardíos, documentos fijados y errores de inyección.
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
async function main() {
  const { crearCaptura } = await import(pathToFileURL(path.resolve(__dirname, '../../extension/tabs/accesibilidad/captura.js')));
  let finalizar, fallo = false, doc = 'doc-1', url = 'https://ejemplo.test/uno';
  const llamadas = [], estados = [];
  global.chrome = { scripting: { executeScript: async opciones => {
    llamadas.push(opciones);
    if (fallo) throw new Error('Página restringida');
    if (opciones.files) return [];
    if (opciones.func.name === 'analizarPagina') return new Promise(r => { finalizar = () => r([{ documentId: doc, result: { ejecucion: 1, reglas: [] } }]); });
    if (opciones.func.name === 'limpiar') return [];
    return [{ documentId: doc, result: url }];
  } } };
  const c = crearCaptura({ empujar: s => estados.push(s) });
  c.seguir({ id: 1, url });
  const pendiente = c.comando({ cmd: 'reanalizar' });
  while (!finalizar) await new Promise(r => setImmediate(r));
  assert(llamadas.find(x => x.files).target.documentIds.includes('doc-1'));
  c.seguir({ id: 1, url, status: 'loading' });
  finalizar(); await pendiente;
  assert.equal(c.estado().resultado, null, 'La recarga invalida incluso con la misma URL');
  assert.equal(c.estado().cargando, true);
  await c.detener();
  c.seguir({ id: 1, url: 'chrome://extensions' });
  const antes = llamadas.length;
  await c.comando({ cmd: 'reanalizar' });
  assert.equal(llamadas.length, antes, 'No inyecta en páginas restringidas');
  assert.equal(c.estado().analizable, false);
  fallo = true;
  c.seguir({ id: 1, url });
  await c.comando({ cmd: 'reanalizar' });
  assert(c.estado().error.includes('Página restringida'));
  assert.equal(c.estado().cargando, false);
  await c.detener();
  assert.equal(c.estado().resultado, null);
  console.log('Captura: 7 comprobaciones correctas (documentId, recarga, resultado tardío, carga, página restringida, error y parada).');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
