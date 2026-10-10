// Pruebas con Chrome real y la extensión cargada. Playwright es solo herramienta de desarrollo.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');

async function main() {
  const raiz = path.resolve(__dirname, '../..');
  const evidencias = path.join(raiz, '.impeccable/review/screenshots/final');
  fs.mkdirSync(evidencias, { recursive: true });
  const servidor = http.createServer((req, res) => {
    const ruta = decodeURIComponent(req.url.split('?')[0]);
    if (ruta === '/vista') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html><html lang="es"><meta charset="utf-8"><title>Accesibilidad</title><link rel="stylesheet" href="/extension/sidepanel/panel.css"><body><main id="vista"></main></body></html>'); }
    const archivo = path.resolve(raiz, '.' + ruta);
    if (!archivo.startsWith(raiz + path.sep) || !fs.existsSync(archivo)) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', archivo.endsWith('.js') ? 'text/javascript' : archivo.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(fs.readFileSync(archivo));
  });
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'md-audit-prueba-'));
  const extensionPrueba = path.join(perfil, 'extension-prueba');
  fs.cpSync(path.join(raiz, 'extension'), extensionPrueba, { recursive: true });
  // Exposición exclusiva del perfil de pruebas; el paquete entregado no incluye este acceso.
  fs.appendFileSync(path.join(extensionPrueba, 'service-worker.js'), '\nglobalThis.pruebaAcc = capturas.accesibilidad;\n');
  let contexto;
  const comprobados = [];
  try {
    contexto = await chromium.launchPersistentContext(perfil, { channel: 'chromium', executablePath: process.env.MD_AUDIT_BROWSER || undefined, headless: true,
      ignoreDefaultArgs: ['--disable-extensions'],
      args: process.env.MD_AUDIT_LOAD_CDP === '1' ? ['--enable-unsafe-extension-debugging'] : [`--disable-extensions-except=${extensionPrueba}`, `--load-extension=${extensionPrueba}`] });
    if (process.env.MD_AUDIT_LOAD_CDP === '1') {
      const extensiones = await contexto.newPage();
      await extensiones.goto('chrome://extensions/');
      const modo = extensiones.locator('#devMode');
      if (await modo.getAttribute('aria-pressed') !== 'true') await modo.click();
      const sesionCDP = await contexto.browser().newBrowserCDPSession();
      const { id } = await sesionCDP.send('Extensions.loadUnpacked', { path: extensionPrueba });
      const instaladas = await sesionCDP.send('Extensions.getExtensions');
      const extensionCargada = instaladas.extensions.find(e => e.id === id);
      if (!extensionCargada?.enabled) throw new Error('Chrome no habilitó la extensión en el perfil de pruebas: ' + JSON.stringify(extensionCargada));
      await sesionCDP.detach();
      // La carga por CDP no siempre arranca el worker hasta el primer mensaje.
      const arranque = await contexto.newPage();
      await arranque.goto(`chrome-extension://${id}/sidepanel/index.html`);
      await arranque.close();
      await extensiones.close();
    }
    const worker = contexto.serviceWorkers()[0] || await contexto.waitForEvent('serviceworker');
    const pagina = await contexto.newPage();
    await pagina.goto(base + '/tests/accesibilidad/casos.html');
    const llamadas = [];
    pagina.on('request', r => llamadas.push(r.url()));
    await worker.evaluate(async url => {
      const tabs = await chrome.tabs.query({});
      globalThis.tabAcc = tabs.find(t => t.url === url);
      pruebaAcc.seguir(tabAcc);
      await pruebaAcc.comando({ cmd: 'reanalizar' });
    }, pagina.url());
    const estado = await worker.evaluate(() => pruebaAcc.estado());
    assert.equal(estado.error, null, estado.error);
    const reglas = estado.resultado.reglas;
    const regla = id => reglas.find(r => r.id === id);
    assert(regla('label').nodos.some(n => n.selector.includes('#sin-nombre')));
    assert.equal(regla('label').total, 106);
    assert.equal(regla('label').nodos.length, 100);
    assert(!regla('label').nodos.some(n => n.selector.includes('#con-nombre')));
    assert(!reglas.filter(r => ['button-name', 'image-alt'].includes(r.id)).some(r => r.nodos.some(n => n.selector === '#boton-valido' || n.selector === '#decorativa')));
    assert.equal(regla('heading-order').tipo, 'recomendacion');
    assert.equal(regla('tabindex').tipo, 'recomendacion');
    assert.equal(regla('html-has-lang').tipo, 'problema');
    assert(regla('color-contrast').nodos.find(n => n.selector === '#contraste').contraste.ratio < 4.5);
    assert(!regla('target-size')?.nodos.some(n => n.selector === '#pequeno'));
    assert.equal(llamadas.length, 0, 'La auditoría no debe generar peticiones');
    comprobados.push('AC-02, AC-03, AC-04, AC-05, AC-07, AC-12: motor real, clasificación, nombres válidos, contraste, espaciado y ausencia de peticiones');
    const nodo = regla('label').nodos.find(n => n.selector.includes('#sin-nombre'));
    const estilo = await pagina.locator('#sin-nombre').getAttribute('style');
    assert.equal((await worker.evaluate(m => pruebaAcc.comando(m), { cmd: 'localizar', id: nodo.id, ejecucion: estado.resultado.ejecucion })).localizado, true);
    assert.equal(await pagina.locator('[data-mdwa-accesibilidad]').count(), 1);
    assert.equal(await pagina.locator('#sin-nombre').getAttribute('style'), estilo);
    await worker.evaluate(() => pruebaAcc.comando({ cmd: 'limpiar-resaltado' }));
    assert.equal(await pagina.locator('[data-mdwa-accesibilidad]').count(), 0);
    await pagina.locator('#sin-nombre').evaluate(e => e.remove());
    assert.equal((await worker.evaluate(m => pruebaAcc.comando(m), { cmd: 'localizar', id: nodo.id, ejecucion: estado.resultado.ejecucion })).localizado, false);
    comprobados.push('AC-01 y parte de AC-10: localizar, retirar capa, estilos intactos y elemento eliminado');

    const vista = await contexto.newPage();
    await vista.exposeFunction('comandoAcc', m => worker.evaluate(m => pruebaAcc.comando(m), m));
    await vista.goto(base + '/vista');
    await vista.evaluate(async estado => {
      const { montar } = await import('/extension/tabs/accesibilidad/vista.js');
      await montar(document.querySelector('#vista'), { alEstado: fn => globalThis.pintarAcc = fn,
        enviar: (cmd, datos = {}) => cmd === 'estado' ? Promise.resolve(estado) : globalThis.comandoAcc({ cmd, ...datos }) });
    }, estado);
    const filtro = vista.locator('[data-filtro="tipo"]');
    await filtro.selectOption('recomendacion');
    assert(await vista.locator('.acc-regla').count() > 0);
    assert(!(await vista.locator('.acc-lista').textContent()).includes('WCAG 3.1.1'));
    await vista.locator('[data-filtro="gravedad"]').selectOption('critical');
    assert.equal(await vista.locator('.acc-regla').count(), 0);
    await filtro.selectOption('problema');
    await vista.locator('[data-filtro="gravedad"]').selectOption('');
    assert((await vista.locator('.acc-totales').textContent()).includes('reglas'));
    assert((await vista.locator('.acc-lista').textContent()).includes('Mostrando 100 de 106'));
    await filtro.focus(); await vista.keyboard.press('Tab');
    assert.equal(await vista.locator('[data-filtro="gravedad"]').evaluate(e => e === document.activeElement), true);
    assert.equal(await vista.locator('[data-filtro="gravedad"]').evaluate(e => getComputedStyle(e).outlineStyle), 'solid');
    await vista.locator('.acc-regla').first().locator('summary').focus(); await vista.keyboard.press('Enter');
    assert(await vista.locator('.acc-regla').first().getAttribute('open') !== null);
    for (const [nombre, width, colorScheme] of [['panel-claro', 420, 'light'], ['panel-oscuro', 320, 'dark']]) {
      await vista.setViewportSize({ width, height: 900 }); await vista.emulateMedia({ colorScheme });
      assert(await vista.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Sin desbordamiento horizontal');
      await vista.screenshot({ path: path.join(evidencias, nombre + '.png'), fullPage: false });
    }
    comprobados.push('AC-08, AC-13: contadores, filtros, truncamiento, teclado, foco, temas y ancho 320/420');

    // Contraste incompleto simulado: comprueba el contrato sin depender de una imagen externa.
    const manual = await pagina.evaluate(async () => {
      const { analizarPagina } = await import('/extension/tabs/accesibilidad/analisis.js');
      const anterior = globalThis.axe;
      const locale = globalThis.__mdwaLocaleAcc;
      globalThis.__mdwaLocaleAcc = {};
      globalThis.axe = { configure() {}, run: async () => ({ testEngine: { version: 'prueba' }, violations: [], incomplete: [{ id: 'color-contrast', help: 'Revisar contraste', tags: ['wcag143'], impact: 'serious', nodes: [{ target: ['#contraste'], html: '<p>Texto</p>', any: [{ id: 'color-contrast', message: 'No determinable', data: {} }] }] }] }) };
      try { return await analizarPagina(); } finally { globalThis.axe = anterior; globalThis.__mdwaLocaleAcc = locale; }
    });
    assert.equal(manual.reglas[0].tipo, 'manual'); assert.equal(manual.reglas[0].nodos[0].contraste.ratio, null);
    comprobados.push('AC-06: contrato de resultado incompleto, ratio nulo conservado');

    await worker.evaluate(async () => {
      pruebaAcc.seguir({ id: tabAcc.id, url: 'chrome://extensions' });
      await pruebaAcc.comando({ cmd: 'reanalizar' });
    });
    assert.equal((await worker.evaluate(() => pruebaAcc.estado())).analizable, false);
    await vista.evaluate(s => pintarAcc(s), await worker.evaluate(() => pruebaAcc.estado()));
    assert((await vista.locator('.acc-estado').textContent()).includes('no se puede analizar'));
    await vista.evaluate(() => pintarAcc({ analizable: true, cargando: false, error: 'No se pudo analizar esta página. Volvé a analizar.' }));
    assert((await vista.locator('.acc-estado').textContent()).includes('Volvé a analizar'));
    await vista.evaluate(() => pintarAcc({ analizable: true, resultado: { motor: '4.14.0', reglas: [] } }));
    assert((await vista.locator('.acc-lista').textContent()).includes('revisión manual'));
    comprobados.push('AC-11: estados restringido, error y vacío sin certificar conformidad');

    await worker.evaluate(async () => { pruebaAcc.seguir(tabAcc); await pruebaAcc.comando({ cmd: 'reanalizar' }); });
    const nuevo = await worker.evaluate(() => pruebaAcc.estado());
    assert.equal(nuevo.error, null, nuevo.error);
    assert.equal(nuevo.resultado.reglas.find(r => r.id === 'label').total, 105);
    await worker.evaluate(() => {
      pruebaAcc.comando({ cmd: 'reanalizar' });
      pruebaAcc.seguir({ ...tabAcc, status: 'loading' });
    });
    assert.equal((await worker.evaluate(() => pruebaAcc.estado())).resultado, null);
    await worker.evaluate(() => pruebaAcc.detener());
    assert.equal(await pagina.locator('[data-mdwa-accesibilidad]').count(), 0);
    comprobados.push('AC-09 y limpieza: reanálisis actualiza datos; recarga invalida captura pendiente');

    // Panel completo y eventos reales del service worker, incluida su desconexión.
    const extensionId = new URL(worker.url()).host;
    const panel = await contexto.newPage();
    await panel.goto(`chrome-extension://${extensionId}/sidepanel/index.html`);
    await worker.evaluate(async url => {
      const tabs = await chrome.tabs.query({});
      await chrome.tabs.update(tabs.find(t => t.url === url).id, { active: true });
    }, pagina.url());
    await panel.getByRole('tab', { name: /Accesibilidad/ }).click();
    const superficie = panel.locator('.acc');
    await superficie.locator('.acc-estado').filter({ hasText: 'Análisis terminado' }).waitFor();
    await superficie.locator('.acc-regla').filter({ hasText: 'label' }).first().locator('summary').click();
    await superficie.getByRole('button', { name: 'Localizar y resaltar' }).first().click();
    await superficie.locator('.acc-estado').filter({ hasText: 'Elemento localizado' }).waitFor();
    assert.equal(await pagina.locator('[data-mdwa-accesibilidad]').count(), 1);
    await worker.evaluate(async url => {
      const tabs = await chrome.tabs.query({});
      await chrome.tabs.update(tabs.find(t => t.url === url).id, { active: true });
    }, vista.url());
    await pagina.waitForFunction(() => !document.querySelector('[data-mdwa-accesibilidad]'));
    await superficie.locator('.acc-url').filter({ hasText: '/vista' }).waitFor();
    await worker.evaluate(async url => {
      const tabs = await chrome.tabs.query({});
      await chrome.tabs.update(tabs.find(t => t.url === url).id, { active: true });
    }, pagina.url());
    await superficie.locator('.acc-estado').filter({ hasText: 'Análisis terminado' }).waitFor();
    await pagina.reload();
    await superficie.locator('.acc-estado').filter({ hasText: 'Análisis terminado' }).waitFor();
    // El nuevo documento repone el campo borrado; se verifica la actualización real.
    const detalleRecargado = superficie.locator('.acc-regla').filter({ hasText: 'Regla label' }).first();
    await detalleRecargado.locator('summary').filter({ hasText: '106 elementos' }).waitFor();
    if (await detalleRecargado.getAttribute('open') === null) await detalleRecargado.locator('summary').click();
    await superficie.getByRole('button', { name: 'Localizar y resaltar' }).first().click();
    await superficie.locator('.acc-estado').filter({ hasText: 'Elemento localizado' }).waitFor();
    await panel.close();
    await pagina.waitForFunction(() => !document.querySelector('[data-mdwa-accesibilidad]'));
    comprobados.push('AC-09, AC-10 y T-09: shell completo, cambio de pestaña y recarga reales, puerto, localizar y cierre del panel retiran la capa');

    fs.writeFileSync(path.join(__dirname, 'resultado.json'), JSON.stringify({ fecha: new Date().toISOString(), navegador: contexto.browser().version(), comprobados }, null, 2));
    console.log(JSON.stringify({ comprobados }, null, 2));
  } finally {
    await contexto?.close(); await new Promise(r => servidor.close(r));
    // Solo elimina el perfil temporal creado por esta prueba.
    assert.equal(path.dirname(perfil), os.tmpdir());
    assert(path.basename(perfil).startsWith('md-audit-prueba-'));
    fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
