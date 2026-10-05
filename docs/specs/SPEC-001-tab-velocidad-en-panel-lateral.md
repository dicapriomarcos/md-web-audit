# SPEC-001 · Tab Velocidad en panel lateral

| Campo | Valor |
|---|---|
| Estado | `done` |
| Autor | Claude Code |
| Propietario | Marcos |
| Creada | 2026-10-03 |
| Actualizada | 2026-10-04 |
| Objetivo de release | 0.1.0 |
| Dependencias | ADR-001 |

## 1. Resumen

Extensión de Chrome «MD Web Audit» con un panel lateral que tiene una barra de Tabs. La primera Tab, **Velocidad**, reproduce lo que hace md-web-performance: mide en tiempo real FCP, LCP, TBT y CLS, calcula un score aproximado y muestra el peso y los requests de cada página, con historial de las páginas visitadas. El shell queda preparado para añadir más Tabs de auditoría (la siguiente es SEO, SPEC-002) sin tocar las existentes.

## 2. Problema y evidencia

- Auditar una web obliga hoy a saltar entre herramientas (Lighthouse, DevTools, extensiones sueltas).
- md-web-performance resolvió la parte de velocidad, pero como panel flotante que tapa la página y no admite más vistas.
- Sin un shell común, cada auditoría nueva sería una extensión aparte.

## 3. Objetivos

- Una sola extensión con panel lateral y Tabs; la Tab Velocidad al nivel de md-web-performance.
- Añadir una Tab nueva sin modificar el shell ni las otras Tabs (ADR-001).
- Todo local, sin servidores externos.

## 4. Fuera de alcance

- Otras Tabs de auditoría (SEO tiene su spec, SPEC-002; accesibilidad, seguridad… llegarán después).
- Recomendaciones accionables y Speed Index.
- Publicación en Chrome Web Store.
- Medir páginas `chrome://`, la Web Store u otras no http/https.

## 5. Usuarios y permisos

Una persona que audita webs (desarrollo, SEO, agencia). Usa la extensión en su navegador. Permisos de Chrome: `debugger`, `tabs`, `scripting`, `storage`, `sidePanel` y `host_permissions` `<all_urls>`.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Al pulsar el icono de la extensión se abre el panel lateral con una barra de Tabs; la Tab activa por defecto es Velocidad. |
| FR-02 | Mientras el panel está abierto, la Tab Velocidad mide la pestaña activa y la sigue al cambiar de pestaña o ventana. |
| FR-03 | Cada navegación crea una «página» nueva en el historial (máx. 60) y se puede seleccionar para ver su detalle. |
| FR-04 | Se muestran FCP, LCP, TBT, CLS, TTFB, DCL, load y nodos DOM de la página seleccionada. |
| FR-05 | Se muestra un score aproximado 0–100 (curvas de Lighthouse sin Speed Index, pesos renormalizados), con color por umbral. |
| FR-06 | Se muestra el peso transferido y descomprimido, el número de requests y el desglose por tipo (HTML, JS, CSS, imagen, fuente, media, XHR, otros). |
| FR-07 | Lista de requests filtrable por tipo y por texto de URL, ordenable por recientes, más pesados y más lentos; resalta los de más de 100 KB. |
| FR-08 | Perfil Escritorio o Móvil (CPU 4× y 4G lenta), opción «sin caché» y botón de recargar sin caché y medir. |
| FR-09 | Botones para limpiar el historial y exportar el historial completo a JSON. |
| FR-10 | Al cerrar el panel se restauran las condiciones de red y CPU y se desengancha el depurador. |
| FR-11 | En páginas no medibles (no http/https) el panel lo indica y se engancha solo al volver a un sitio medible. |
| FR-12 | Añadir una Tab nueva solo requiere su carpeta en `extension/tabs/` y una línea en `registro.js`. |
| NFR-01 | Los textos de la interfaz van en español, con tema claro/oscuro según el sistema. |
| NFR-02 | Ningún dato de la página sale del navegador. |

## 7. Criterios de aceptación

- [x] AC-01 · Cargada la carpeta `extension/` en Chrome, pulsar el icono abre el panel lateral con la Tab Velocidad seleccionada (FR-01).
- [x] AC-02 · En una web real aparecen FCP, LCP, TBT, CLS y el score en pocos segundos, y los valores coinciden razonablemente con md-web-performance en la misma URL (FR-04, FR-05).
- [x] AC-03 · Navegar a otra URL añade una entrada al historial y al hacer clic en una entrada anterior se ve su detalle (FR-03).
- [x] AC-04 · El peso total, el desglose por tipo y la lista de requests coinciden con la pestaña Red de DevTools con margen razonable (FR-06, FR-07).
- [x] AC-05 · Cambiar a perfil Móvil y recargar produce un score menor y tiempos mayores en una web pesada (FR-08).
- [x] AC-06 · Cambiar a otra pestaña hace que el panel pase a medirla; en `chrome://extensions` muestra el aviso de que no se puede medir (FR-02, FR-11).
- [x] AC-07 · «Exportar» descarga un JSON con todas las páginas, métricas y requests; «Limpiar» vacía el historial (FR-09).
- [x] AC-08 · Cerrar el panel quita el aviso de depuración de Chrome y la página vuelve a cargar sin throttling (FR-10).
- [x] AC-09 · Registrar una Tab de prueba vacía en `registro.js` la muestra en la barra sin tocar otros archivos (FR-12).

## 8. Diseño técnico

Estructura (ver ADR-001):

```
extension/
  manifest.json            MV3, side_panel, service worker "type": "module"
  service-worker.js        abre el panel al pulsar el icono y orquesta las capturas
  sidepanel/
    index.html, panel.js, panel.css   shell: barra de Tabs y contenedor
  tabs/
    registro.js            lista de Tabs: { id, titulo, montar }
    velocidad/
      vista.js             UI de la Tab (resumen, historial, lista de requests)
      captura.js           chrome.debugger: red, Web Vitals, throttling
      puntuacion.js        curvas de Lighthouse, CLS en ventanas, TBT
  compartido/              formatos (bytes, ms), utilidades comunes
```

- **Captura**: se porta de md-web-performance (`background.js`): `Network.*`, `PerformanceObserver` inyectado con `Page.addScriptToEvaluateOnNewDocument`, relleno inicial con `performance.getEntriesByType` y emulación de red/CPU.
- **Comunicación**: el panel abre un puerto `chrome.runtime.connect` con el service worker; al conectarse se empieza a medir, al desconectarse (cierre del panel) se desengancha el depurador. El service worker empuja el estado al panel (con un pequeño retardo para agrupar cambios) y el panel envía comandos (perfil, sin caché, recargar, limpiar, exportar, seleccionar página).
- **Sin content script permanente**: la UI vive en el panel, no se inyecta nada visible en la página.
- **Estado**: el historial vive en memoria del service worker; las preferencias de UI (Tab activa, perfil, filtros) en `chrome.storage.local`.

## 9. Plan de tareas

- [x] T-01 · Crear `extension/manifest.json` y `service-worker.js` que abre el panel lateral al pulsar el icono.
- [x] T-02 · Shell del panel: `sidepanel/` con barra de Tabs, `tabs/registro.js` y carga del módulo de la Tab activa.
- [x] T-03 · Portar `puntuacion.js` (curvas, CLS en ventanas, TBT) y `compartido/` (formatos).
- [x] T-04 · Portar `captura.js` (debugger, red, observadores, throttling) y el canal por puerto con el panel.
- [x] T-05 · Vista de la Tab Velocidad: resumen con score y métricas, desglose por tipo e historial.
- [x] T-06 · Lista de requests con filtros, búsqueda y ordenación.
- [x] T-07 · Controles: perfil, sin caché, recargar, limpiar y exportar JSON.
- [x] T-08 · Seguimiento de pestaña activa, páginas no medibles y desenganche al cerrar el panel.
- [x] T-09 · Tema claro/oscuro y revisión de textos en español.
- [x] T-10 · Prueba manual de los AC-01 a AC-09 (README de instalación ya escrito en `extension/README.md`).
- [x] T-11 · Conservar el selector de ordenación y el buscador durante las actualizaciones de la captura; comprobar ordenación y filtros con datos nuevos.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El service worker MV3 se suspende y pierde el historial | Mantenerlo vivo mientras el puerto esté abierto (polling cada segundo, como en performance). |
| `chrome.debugger` no puede enganchar si DevTools ya está abierto en esa pestaña | Mostrar el error en el estado del panel con instrucciones. |
| El side panel es por ventana y no recibe eventos de otras ventanas | Seguir la pestaña activa de la ventana donde está el panel. |
| El score aproximado se confunde con el de Lighthouse | Nota visible en la Tab, igual que en performance. |

## 11. Preguntas abiertas

- ¿Se quiere el historial persistente entre sesiones del navegador, o solo en memoria como ahora?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `awaiting-approval` | Creación y redacción completa, pendiente de aprobación |
| 2026-10-03 | `in-progress` | Cambio de estado desde MD SDD Hub (awaiting-approval → in-progress) |
| 2026-10-03 | `in-progress` | Revisados cambios de la persona: aprobación de la spec; sin cambios de contenido |
| 2026-10-03 | `in-progress` | Implementadas T-01 a T-09 (esqueleto, shell con Tabs, captura, vista, controles, tema). Sintaxis y score comprobados con Node; falta la prueba manual en Chrome (T-10) |
| 2026-10-04 | `awaiting-review` | La persona confirma la aprobación de las pruebas manuales de SPEC-001 (T-10 y AC-01 a AC-09). Corregida T-11: el selector y el buscador conservan sus nodos durante las actualizaciones. Verificación local en navegador con estados simulados cada 100 ms: 120 actualizaciones sin reemplazar controles; ordenación por peso y duración, búsqueda y filtro por tipo correctos. Sintaxis comprobada con Node. Corrección pendiente de revisión en la extensión recargada. |
| 2026-10-04 | `done` | Cambio de estado desde MD SDD Hub (awaiting-review → done) |

