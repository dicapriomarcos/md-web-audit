# MD Web Audit

Extensión de Chrome (Manifest V3) que audita la página que estás viendo desde un **panel lateral** con una Tab por tipo de auditoría. Todo corre local.

## Instalación

1. Abre `chrome://extensions` y activa el **Modo desarrollador**.
2. **Cargar descomprimida** y elige esta carpeta (`extension/`).
3. Pulsa el icono de la extensión: se abre el panel lateral y empieza a medir.

Requiere Chrome 116 o superior.

## Tabs

- **Velocidad**: FCP, LCP, TBT, CLS y score aproximado, peso y requests por tipo, perfil escritorio/móvil, sin caché, historial de páginas y exportar JSON.
- **Consola**: `console.*`, excepciones no capturadas y entradas del navegador (red, CSP, contenido mixto) de la pestaña activa, con contadores, pila desplegable, filtros, búsqueda, separadores de navegación y exportar JSON. Solo muestra lo que Chrome conserva de antes de abrir el panel; si DevTools está abierto en la pestaña, ciérralo.
- **Contenido**: enlaces sin destino (sin `href`, vacío, `#`, `javascript:void(0)`), posibles botones, anclas `#id` rotas y texto «lorem ipsum» (texto visible, `alt`, `title`, `placeholder`, metas) de la pestaña activa, con contadores, resumen de enlaces, bordes por categoría en la página y clic para localizar cada hallazgo. No hace peticiones a los destinos.

- **SEO**: meta title y description con longitudes, señales de indexabilidad («¿Visible en Google?») con vista previa del resultado, comprobación de `robots.txt`, sitemap y `llms.txt` con enlace a cada uno, imagen destacada, conteo y lista de encabezados, schema (JSON-LD, Microdata, RDFa) e interruptores que dibujan bordes de color sobre H1–H6 y `<article>` en la página. No usa el depurador; los bordes se retiran al cerrar el panel.

Mientras el panel esté abierto se mide la pestaña activa y Chrome muestra el aviso de depuración. Al cerrar el panel se libera el depurador y se restauran la red y la CPU.

## Añadir una Tab

1. Crea `tabs/<nombre>/index.js` con `{ id, titulo, montar(contenedor, ctx), crearCaptura?(ctx) }`.
2. Añade una línea en `tabs/registro.js`.

Más detalle en `docs/architecture/ADR-001-panel-lateral-y-modulos-por-tab.md`.
