# SPEC-003 · Tab Consola JS en panel lateral

| Campo | Valor |
|---|---|
| Estado | `in-progress` |
| Autor | Claude Code |
| Propietario | Marcos |
| Creada | 2026-10-03 |
| Actualizada | 2026-10-03 |
| Objetivo de release | 0.1.0 |
| Dependencias | SPEC-001, ADR-001 |

## 1. Resumen

Tercera Tab del panel lateral: **Consola**. Muestra, dentro del panel y sin abrir DevTools, la consola de JavaScript de la pestaña activa: `console.log/info/warn/error`, excepciones no capturadas, promesas rechazadas y errores que reporta el propio navegador (recursos que fallan, CSP, contenido mixto). Se puede filtrar, buscar, ver la traza y exportar.

## 2. Problema y evidencia

- Los errores de JS son una de las primeras cosas que se revisan al auditar una web, y hoy obliga a abrir DevTools aparte.
- Un panel único con Velocidad, SEO y Consola evita cambiar de herramienta.

## 3. Objetivos

- Ver los errores y avisos de JS de la página actual de un vistazo, con su contador.
- Poder ir al origen del error (archivo, línea y columna).
- Comparte conexión con la Tab Velocidad sin que se pisen.

## 4. Fuera de alcance

- Ejecutar JavaScript escribiendo en la consola (REPL).
- Inspeccionar objetos de forma interactiva (se muestran como texto).
- Source maps y depuración con puntos de interrupción.
- Mensajes de otras pestañas que no sea la activa.

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001 (`debugger`, `tabs`). Sin permisos nuevos.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | La Tab Consola aparece en la barra de Tabs y muestra los mensajes de la pestaña activa mientras el panel está abierto. |
| FR-02 | Se capturan `console.*` (log, info, warn, error, debug, assert, trace), excepciones no capturadas (`Runtime.exceptionThrown`) y entradas del navegador (`Log.entryAdded`: red, CSP, contenido mixto, deprecaciones). |
| FR-03 | Al abrir el panel se muestran también los mensajes que Chrome ya conserva de la página en curso. |
| FR-04 | Cada mensaje muestra nivel (con color e icono), texto, hora relativa, origen `archivo:línea:columna` y contador si se repite. |
| FR-05 | Los mensajes con traza (errores y excepciones) se pueden desplegar para ver la pila de llamadas. |
| FR-06 | Contadores por nivel (errores, avisos, info/log) en la cabecera de la Tab y en la propia pestaña del panel como indicador cuando hay errores. |
| FR-07 | Filtro por nivel, búsqueda por texto y opción «Ocultar mensajes de otros dominios». |
| FR-08 | Cada navegación crea un separador «Navegó a <URL>» y por defecto se conserva el historial; hay botón «Limpiar» y opción «Borrar al navegar». |
| FR-09 | Clic en el origen copia `archivo:línea` o abre el recurso en una pestaña nueva (se decide en el diseño); botón para copiar el mensaje completo. |
| FR-10 | Exportar el registro actual a JSON. |
| FR-11 | Convive con la Tab Velocidad: ambas usan una única conexión de depurador por pestaña (ADR-001). |
| FR-12 | En páginas no medibles (no http/https) se indica en lugar de fallar. |
| NFR-01 | El registro se limita a 1000 mensajes por pestaña; al pasar el límite se descartan los más antiguos. |
| NFR-02 | Los mensajes no salen del navegador y no se escriben en `chrome.storage`. |

## 7. Criterios de aceptación

- [ ] AC-01 · En una página que ejecuta `console.log`, `console.warn` y `console.error`, los tres aparecen con su nivel y color correctos (FR-02, FR-04).
- [ ] AC-02 · Una excepción no capturada aparece como error con archivo, línea y columna, y se puede desplegar su pila (FR-02, FR-05).
- [ ] AC-03 · Un recurso que da 404 o una petición bloqueada por CSP aparece como entrada del navegador (FR-02).
- [ ] AC-04 · Abrir el panel en una página ya cargada con errores muestra los que Chrome conserva (FR-03).
- [ ] AC-05 · Un mismo mensaje repetido se agrupa con contador en lugar de duplicarse (FR-04).
- [ ] AC-06 · Los contadores y el indicador de errores en la pestaña coinciden con los mensajes mostrados (FR-06).
- [ ] AC-07 · Filtrar por «Errores» y buscar un texto deja solo los mensajes que cumplen ambos (FR-07).
- [ ] AC-08 · Navegar a otra URL inserta el separador; con «Borrar al navegar» activado el registro se vacía (FR-08).
- [ ] AC-09 · Con la Tab Velocidad y la Tab Consola usadas a la vez en la misma pestaña, ninguna deja de recibir datos y no hay error de «ya hay un depurador conectado» (FR-11).
- [ ] AC-10 · «Exportar» descarga un JSON con los mensajes actuales (FR-10).
- [ ] AC-11 · Tras 1000 mensajes solo se conservan los últimos 1000 (NFR-01).
- [ ] AC-12 · En `chrome://extensions` la Tab muestra el aviso de página no analizable (FR-12).

## 8. Diseño técnico

```
extension/
  compartido/depurador.js   gestor único de chrome.debugger por pestaña: attach/detach con
                            recuento de usuarios y reparto de eventos CDP a los módulos suscritos
  tabs/consola/
    captura.js              suscribe Runtime.enable + Log.enable; normaliza console.*, excepciones
                            y Log.entryAdded a { nivel, texto, origen, pila, hora }
    vista.js                UI: cabecera con contadores y filtros, lista, separadores, exportar
```

- **Cambio sobre SPEC-001**: la captura de Velocidad deja de llamar directamente a `chrome.debugger.attach` y pasa por `compartido/depurador.js`, de modo que Velocidad y Consola comparten la conexión y el depurador solo se desengancha cuando ningún módulo la usa (ADR-001).
- Eventos CDP: `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`, `Log.entryAdded`. Al activar `Runtime.enable` Chrome reenvía los mensajes que conserva (FR-03).
- Los argumentos de `console.*` se convierten a texto con su `description`/`value`; los objetos se muestran como `Object` / `Array(n)` sin expandir.
- Agrupación: mensajes consecutivos con mismo nivel, texto y origen incrementan el contador.
- El indicador de errores en la pestaña del panel lo expone cada Tab mediante `registro.js` (campo opcional `indicador`).
- Almacenamiento: solo en memoria del service worker, por pestaña.

## 9. Plan de tareas

- [x] T-01 · `compartido/depurador.js`: conexión única por pestaña con recuento de usuarios y reparto de eventos.
- [x] T-02 · Adaptar la captura de Velocidad (SPEC-001) para usar el gestor compartido.
- [x] T-03 · `tabs/consola/captura.js`: normalizar `console.*`, excepciones y entradas de `Log`.
- [x] T-04 · Vista de la Tab: lista con niveles, origen, contador de repeticiones y pila desplegable.
- [x] T-05 · Filtros por nivel, búsqueda y ocultar otros dominios.
- [x] T-06 · Separadores de navegación, «Limpiar» y «Borrar al navegar».
- [x] T-07 · Contadores en cabecera e indicador de errores en la pestaña del panel (campo `indicador` en `registro.js`).
- [x] T-08 · Copiar mensaje/origen y exportar JSON.
- [x] T-09 · Límite de 1000 mensajes y páginas no analizables.
- [ ] T-10 · Prueba manual de los AC-01 a AC-12 y actualización del README.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Si DevTools ya está abierto en esa pestaña, `chrome.debugger` no puede conectar | Mostrar el error en la Tab con la instrucción de cerrar DevTools. |
| Dos Tabs intentan conectar el depurador a la vez | `depurador.js` es el único que llama a `attach`/`detach`. |
| Páginas muy ruidosas llenan la memoria | Límite de 1000 mensajes y agrupación de repetidos. |
| Los mensajes anteriores a abrir el panel pueden no estar completos | Se avisa en la Tab de que solo se muestra lo que Chrome conserva. |

## 11. Preguntas abiertas

- ¿Al hacer clic en el origen prefieres copiar `archivo:línea` o abrir el archivo en una pestaña nueva? Implementado como **copiar** `archivo:línea:columna` (sirve también con orígenes sin URL abrible); dímelo si prefieres abrir.
- ¿Quieres poder ejecutar JavaScript escribiendo en la Tab (como en la consola de DevTools) en una versión posterior?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `awaiting-approval` | Creación y redacción completa, pendiente de aprobación |
| 2026-10-03 | `in-progress` | Cambio de estado desde MD SDD Hub (awaiting-approval → in-progress) |
| 2026-10-03 | `in-progress` | Implementadas T-01 a T-09 (T-01 y T-02 ya existían desde SPEC-001); falta T-10, prueba manual de AC-01 a AC-12 en Chrome |
