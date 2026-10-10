# SPEC-002 · Tab SEO en panel lateral

| Campo | Valor |
|---|---|
| Estado | `in-progress` |
| Autor | Claude Code |
| Propietario | Marcos |
| Creada | 2026-10-03 |
| Actualizada | 2026-10-10 |
| Objetivo de release | 0.1.0 |
| Dependencias | SPEC-001, ADR-001 |

## 1. Resumen

Segunda Tab del panel lateral: **SEO**. Analiza la página de la pestaña activa y muestra su meta title y meta description (con longitudes), si puede aparecer en Google (señales de indexabilidad y vista previa del resultado), la imagen destacada, el conteo de encabezados (con aviso si no hay exactamente un H1) y los schemas (datos estructurados) de la página actual. Permite resaltar con un borde de color los H1–H6 y, opcionalmente, los `<article>` directamente sobre la página.

## 2. Problema y evidencia

- Revisar lo básico de SEO on-page obliga a abrir el código fuente, DevTools o varias extensiones.
- Los errores más comunes (title o description ausentes/largos, noindex olvidado, varios H1, sin imagen social, schema ausente) se ven rápido si están juntos.

## 3. Objetivos

- Ver en un vistazo los datos SEO básicos de cualquier página.
- Detectar a simple vista la estructura de encabezados y de artículos sobre la propia página.
- Saber qué schema tiene la página actual.
- Que se actualice al navegar, sin acciones manuales.

## 4. Fuera de alcance

- Consultar Google o Search Console: no se puede saber con certeza si una URL está indexada desde la extensión; solo se evalúan las señales que impiden o permiten la indexación.
- Validar los schemas contra Google (Rich Results Test): solo se detectan y se listan.
- Análisis de contenido (palabras clave, densidad), enlaces rotos, hreflang y auditoría de todo el sitio.
- Editar el contenido de la página.

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001. Se usa `chrome.scripting` para leer el DOM bajo demanda y para inyectar/retirar el estilo de los bordes.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | La Tab SEO aparece en la barra de Tabs junto a las demás y analiza la pestaña activa, actualizándose al navegar o recargar. |
| FR-02 | Muestra el meta title (`<title>`) y su longitud en caracteres, con indicador de rango recomendado (aprox. 30–60). Avisa si falta o está vacío. |
| FR-03 | Muestra la meta description y su longitud, con indicador de rango recomendado (aprox. 70–160). Avisa si falta o está vacía. |
| FR-04 | Bloque «¿Visible en Google?» con un veredicto (Indexable / Bloqueada / Con dudas) y la lista de señales: código HTTP, `meta robots` y `X-Robots-Tag` (noindex, nofollow), `link rel=canonical` (y si apunta a otra URL), y si `robots.txt` bloquea la URL para Googlebot. |
| FR-05 | Vista previa de cómo se vería el resultado en Google (título, URL, descripción), con truncado aproximado a la longitud típica. |
| FR-06 | Muestra la imagen destacada si existe, tomada de `og:image` (o `twitter:image` como alternativa), con su URL; si no hay, lo indica. |
| FR-07 | Muestra el conteo de H1 a H6. Avisa si hay 0 o más de 1 H1. |
| FR-08 | Lista de encabezados en orden de aparición con su nivel y texto; al hacer clic en uno, la página se desplaza hasta él y lo destaca un instante. |
| FR-09 | Interruptores por nivel (H1…H6) para colorear con un borde (un color distinto por nivel) los encabezados de la página; se pueden activar varios a la vez y se retiran al apagarlos o al cerrar el panel. |
| FR-10 | En páginas no analizables (no http/https) el panel lo indica en lugar de fallar. |
| FR-11 | Interruptor opcional «Articles» que colorea con un borde todos los `<article>` de la página, independiente de los de encabezados y apagado por defecto. |
| FR-12 | Tarjeta «Schema» con los datos estructurados de la página actual: formato (JSON-LD, Microdata, RDFa), tipo(s) de schema.org (p. ej. Organization, Article, Product, BreadcrumbList), cantidad de bloques y vista del JSON de cada uno. Si no hay, lo indica. |
| FR-13 | Tarjeta «Archivos del sitio» que comprueba si existen `robots.txt`, el sitemap (el declarado en `robots.txt` o, si no, `/sitemap.xml`, `/sitemap_index.xml` y `/wp-sitemap.xml`) y `llms.txt`, e indica para cada uno si se encontró; los tres llevan un enlace que se abre en una pestaña nueva. |
| NFR-01 | Los bordes no cambian el layout de la página (se usa `outline`, no `border`). |
| NFR-02 | Todo el análisis es local; solo se pide `robots.txt` del mismo sitio que se audita. |

## 7. Criterios de aceptación

- [x] AC-01 · En una página con title y description, ambos aparecen con su longitud y el indicador de rango correcto (FR-02, FR-03).
- [ ] AC-02 · En una página sin description, se muestra el aviso de que falta (FR-03).
- [ ] AC-03 · En una página con `<meta name="robots" content="noindex">` el veredicto es «Bloqueada» y la señal lo indica; en una página normal es «Indexable» (FR-04).
- [ ] AC-04 · Una página con canonical a otra URL muestra la señal con la URL destino (FR-04).
- [ ] AC-05 · La vista previa de Google refleja title, URL y description de la página, truncados si son largos (FR-05).
- [ ] AC-06 · Una página con `og:image` muestra la imagen; una sin ella muestra «Sin imagen destacada» (FR-06).
- [ ] AC-07 · El conteo de H1–H6 coincide con el DOM y una página con 0 o 2 H1 muestra el aviso (FR-07).
- [ ] AC-08 · Activar el interruptor H2 dibuja un borde de color sobre todos los H2 sin mover el contenido; desactivarlo o cerrar el panel lo quita (FR-09, NFR-01).
- [ ] AC-09 · Hacer clic en un encabezado de la lista desplaza la página hasta él (FR-08).
- [ ] AC-10 · Al navegar a otra URL con el panel abierto la Tab se actualiza sola (FR-01).
- [ ] AC-11 · En `chrome://extensions` la Tab muestra el aviso de página no analizable (FR-10).
- [ ] AC-12 · «Articles» está apagado por defecto; al activarlo dibuja un borde sobre cada `<article>` sin mover el contenido y al apagarlo lo retira (FR-11).
- [ ] AC-13 · En una página con JSON-LD se listan sus tipos y se puede ver el JSON; en una con Microdata se detecta el `itemtype`; en una sin schema se muestra «Sin datos estructurados» (FR-12).
- [ ] AC-14 · En un sitio con `robots.txt`, sitemap y `llms.txt` los tres aparecen como encontrados y cada enlace abre su archivo en una pestaña nueva; en uno sin alguno de ellos se indica que no se encontró (FR-13).

## 8. Diseño técnico

```
extension/tabs/seo/
  vista.js          UI de la Tab (tarjetas: title, description, Google, imagen, encabezados, schema)
  analisis.js       función inyectada con chrome.scripting.executeScript que devuelve
                    { title, description, robots, canonical, ogImage, twitterImage, headings[], articles }
  indexabilidad.js  evalúa señales → veredicto; lee X-Robots-Tag con fetch HEAD de la URL
                    y consulta /robots.txt del origen
  archivos.js       comprueba robots.txt, sitemap (declarado en robots.txt o rutas habituales) y llms.txt
  schema.js         lee <script type="application/ld+json"> (incluido @graph), itemtype de
                    Microdata y typeof de RDFa; devuelve [{ formato, tipos[], json }]
  captura.js        parte del service worker: sigue la pestaña activa, aplica los bordes y los
                    retira al cerrar el panel o al cambiar de pestaña/URL (sin depurador)
  resaltado.js      inyecta/retira un <style id="mdwa-resaltado"> con reglas outline por
                    nivel de encabezado activo y para article si está activo
```

- Se registra en `tabs/registro.js` sin tocar el shell (FR-12 de SPEC-001).
- El análisis corre en el panel; el service worker (`captura.js`) avisa con `chrome.tabs.onUpdated` y `onActivated` y la Tab se relanza sola, además del botón «Reanalizar» para páginas que cambian por JS.
- Colores de borde: H1 rojo, H2 naranja, H3 verde, H4 azul, H5 violeta, H6 gris y `<article>` turquesa con trazo discontinuo; la leyenda va en los propios interruptores.
- Robots.txt: parser sencillo de `User-agent: *` y `Googlebot` con `Disallow`/`Allow` por prefijo.
- Veredicto: «Bloqueada» si hay noindex, `X-Robots-Tag: noindex`, estado 4xx/5xx o robots.txt bloquea; «Con dudas» si el canonical apunta a otra URL; si no, «Indexable». Se aclara en pantalla que no equivale a «está indexada».

## 9. Plan de tareas

- [x] T-01 · `analisis.js`: extraer title, description, robots, canonical, imágenes sociales y encabezados del DOM.
- [x] T-02 · `indexabilidad.js`: señales HTTP, X-Robots-Tag, robots.txt y veredicto.
- [x] T-03 · Vista de la Tab: tarjetas de title y description con longitudes e indicadores.
- [x] T-04 · Tarjeta «¿Visible en Google?» con veredicto, señales y vista previa del resultado.
- [x] T-05 · Tarjeta de imagen destacada.
- [x] T-06 · Tarjeta de encabezados: conteo H1–H6, avisos de H1 y lista navegable.
- [x] T-07 · `resaltado.js`: interruptores por nivel con `outline` de color y limpieza al cerrar el panel.
- [x] T-08 · Reanálisis al navegar/cambiar de pestaña y manejo de páginas no analizables.
- [x] T-09 · Interruptor opcional de `<article>` en `resaltado.js`.
- [x] T-10 · `schema.js` y tarjeta «Schema» con formatos, tipos y JSON de cada bloque.
- [ ] T-11 · Prueba manual de los AC-01 a AC-13 y actualización del README.
- [x] T-12 · `archivos.js` y tarjeta «Archivos del sitio»: robots.txt, sitemap y llms.txt con estado y enlace en pestaña nueva.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El veredicto se interpreta como «está en Google» | Texto explícito: son señales de indexabilidad, no consulta al índice. |
| Páginas que montan el contenido por JS tras la carga | Botón «Reanalizar» y reanálisis al terminar la carga. |
| El estilo de resaltado choca con el de la página | `outline` con `!important` y `outline-offset`, sin tocar el layout. |
| `fetch` HEAD bloqueado por CORS | Se hace desde el panel (página de la extensión) con `host_permissions`, que lo permite sin CORS. |
| JSON-LD mal formado en la página | Se captura el error de `JSON.parse` y se muestra el bloque como inválido sin romper la Tab. |
| La imagen destacada de WordPress no siempre es `og:image` | Se usa `og:image`/`twitter:image`; ver pregunta abierta. |

## 11. Preguntas abiertas

- ¿Quieres que la imagen destacada intente además detectar la de WordPress (`wp-post-image`) cuando no haya `og:image`?
- ¿Algún otro dato SEO básico para esta primera versión (idioma, canonical visible, H1 frente a title)?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `awaiting-approval` | Creación y redacción completa, pendiente de aprobación. Incluye resaltado opcional de `<article>` y tarjeta de schema |
| 2026-10-03 | `in-progress` | Cambio de estado desde MD SDD Hub (awaiting-approval → in-progress) |
| 2026-10-03 | `in-progress` | Revisados cambios de la persona: aprobación de la spec (luz verde para implementar) |
| 2026-10-03 | `in-progress` | Implementadas T-01 a T-10 en `extension/tabs/seo/` y README actualizado. Probado fuera del panel: lógica de indexabilidad (veredicto, robots.txt, X-Robots-Tag, canonical), extracción de DOM y schemas, y resaltado sin cambio de layout. Fetch HEAD y robots.txt se hacen desde el panel (no desde el service worker). Falta T-11: prueba manual de los AC-01 a AC-13 en Chrome |
| 2026-10-03 | `in-progress` | Petición de la persona: añadidos FR-13, AC-14 y T-12 (comprobar robots.txt, sitemap y llms.txt con enlace en pestaña nueva). T-12 implementada en `archivos.js` y probada con `fetch` simulado (declarado, ruta habitual, 200 con HTML, sin red); AC-14 pendiente de prueba manual en T-11 |

| 2026-10-10 | `in-progress` | Revisados cambios de la persona: AC-01 marcado desde MD SDD Hub. Se conserva la verificación aportada; las demás pruebas pendientes mantienen sus casillas. |
