# SPEC-004 · Tab Contenido: enlaces rotos y lorem ipsum

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

Cuarta Tab del panel lateral: **Contenido**. Revisa la página de la pestaña activa en busca de problemas típicos de una web a medio terminar: enlaces sin destino (sin `href`, vacíos, `#` o `javascript:`), enlaces a ancla `#algo` que no apuntan a ningún elemento de la página, y texto de relleno tipo «lorem ipsum». Cada hallazgo se puede localizar en la página (desplazamiento y borde de color).

## 2. Problema y evidencia

- Es habitual entregar webs con botones que no llevan a ningún sitio, anclas rotas y textos de relleno olvidados.
- Detectarlo a mano exige recorrer la página entera o inspeccionar el DOM.

## 3. Objetivos

- Listar todos los enlaces problemáticos y los textos de relleno de la página actual, con contador.
- Poder ir a cada hallazgo en la propia página.

## 4. Fuera de alcance

- Comprobar si las URL de los enlaces responden (404, redirecciones): no se hacen peticiones a los destinos.
- Rastrear varias páginas o todo el sitio.
- Corregir el contenido.
- Detectar otros textos de relleno que no sean lorem ipsum (en la v1; ver preguntas abiertas).

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001. Se usa `chrome.scripting` para leer el DOM bajo demanda y para resaltar.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | La Tab Contenido aparece en la barra de Tabs y analiza la pestaña activa, actualizándose al navegar. |
| FR-02 | Detecta **enlaces sin destino**: `<a>` sin atributo `href`, con `href` vacío, con `href="#"` solo, o con `javascript:` (`void(0)`, vacío). Los `<a>` con `role="button"` o con manejador de clic se marcan como «posible botón» en lugar de error. |
| FR-03 | Detecta **anclas rotas**: enlaces con `href="#id"` (o a la misma URL con `#id`) cuyo `id` o `name` no existe en el documento. Excluye `#`, `#!` y `#top`. |
| FR-04 | Detecta **texto «lorem ipsum»** en el contenido visible de la página (y marca los `alt`, `title`, `placeholder` y meta title/description que lo contengan), con el fragmento encontrado. |
| FR-05 | Cada hallazgo muestra su tipo, el texto del enlace (o fragmento), el `href` y el selector aproximado del elemento. |
| FR-06 | Contadores por categoría (sin destino, ancla rota, lorem ipsum) y un indicador en la pestaña del panel si hay hallazgos. |
| FR-07 | Clic en un hallazgo desplaza la página hasta el elemento y lo destaca un instante. |
| FR-08 | Interruptores para colorear con borde en la página cada categoría (color distinto por categoría); se retiran al apagarlos o al cerrar el panel. |
| FR-09 | Botón «Reanalizar» para páginas que cambian por JS; el análisis se repite al navegar o cambiar de pestaña. |
| FR-10 | Se muestra un resumen de enlaces totales (internos, externos, `mailto:`, `tel:`) como contexto. |
| FR-11 | En páginas no analizables (no http/https) se indica en lugar de fallar. |
| NFR-01 | Los bordes no cambian el layout (se usa `outline`). |
| NFR-02 | Todo el análisis es local y no hace peticiones a los destinos de los enlaces. |

## 7. Criterios de aceptación

- [x] AC-01 · Una página con `<a>`, `<a href="">`, `<a href="#">` y `<a href="javascript:void(0)">` los lista como enlaces sin destino (FR-02).
- [x] AC-02 · Un `<a role="button">` sin `href` aparece como «posible botón», no como error (FR-02).
- [x] AC-03 · `<a href="#contacto">` sin elemento con ese `id`/`name` aparece como ancla rota; con el elemento presente no aparece (FR-03).
- [x] AC-04 · `#`, `#!` y `#top` no se reportan como ancla rota (FR-03).
- [x] AC-05 · Un párrafo con «Lorem ipsum dolor sit amet» se detecta con su fragmento; también en un `alt` o `placeholder` (FR-04).
- [x] AC-06 · El texto de elementos ocultos (`display:none`) no cuenta como lorem ipsum visible (FR-04).
- [ ] AC-07 · Los contadores coinciden con las listas y el indicador de la pestaña aparece solo si hay hallazgos (FR-06).
- [ ] AC-08 · Clic en un hallazgo desplaza la página hasta él y lo destaca (FR-07).
- [ ] AC-09 · Activar el interruptor de una categoría dibuja el borde sin mover el contenido y apagarlo o cerrar el panel lo quita (FR-08, NFR-01).
- [ ] AC-10 · Al navegar a otra URL con el panel abierto la Tab se actualiza sola (FR-01, FR-09).
- [ ] AC-11 · En `chrome://extensions` la Tab muestra el aviso de página no analizable (FR-11).

## 8. Diseño técnico

```
extension/tabs/contenido/
  vista.js        UI: contadores, tres listas (sin destino, anclas rotas, lorem ipsum),
                  interruptores de resaltado y resumen de enlaces
  analisis.js     función inyectada con chrome.scripting.executeScript:
                  recorre document.links / a, comprueba id y name, y busca lorem ipsum
                  con TreeWalker sobre nodos de texto visibles
  resaltado.js    marca los elementos con un atributo data-mdwa y un <style> con outline
                  por categoría; lo retira al apagar o cerrar el panel
```

- Se registra en `tabs/registro.js` sin tocar el shell; usa la función opcional `indicador(estado)` de la Tab (contrato de `tabs/registro.js`) para la insignia en la pestaña del panel.
- Lorem ipsum: expresión que busca «lorem ipsum» y variantes frecuentes del texto clásico («dolor sit amet», «consectetur adipiscing»), sin distinguir mayúsculas.
- Visibilidad del texto: se descartan nodos dentro de `display:none`, `visibility:hidden`, `script`, `style` y `noscript`.
- Ancla rota: se resuelve el `href` contra la URL actual y solo se evalúan los que apuntan a la misma página; se busca `getElementById` y `[name]`.
- Cada hallazgo guarda un selector aproximado (etiqueta, `id` o clases y posición) y un identificador interno `data-mdwa-id` para localizarlo.

## 9. Plan de tareas

- [x] T-01 · `analisis.js`: enlaces sin destino y «posible botón».
- [x] T-02 · `analisis.js`: anclas rotas con las exclusiones indicadas.
- [x] T-03 · `analisis.js`: lorem ipsum en texto visible, `alt`, `title`, `placeholder` y metas.
- [x] T-04 · Vista de la Tab: contadores, listas de hallazgos y resumen de enlaces.
- [x] T-05 · Localizar hallazgo en la página (desplazar y destacar).
- [x] T-06 · `resaltado.js`: interruptores por categoría con `outline` y limpieza al cerrar el panel.
- [x] T-07 · Reanálisis al navegar y botón «Reanalizar»; indicador en la pestaña; páginas no analizables.
- [ ] T-08 · Prueba manual de los AC-01 a AC-11 y actualización del README.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Falsos positivos: enlaces sin `href` que son botones con JavaScript | Se separan como «posible botón» y no cuentan como error. |
| Apps de una sola página con anclas que se crean tras la carga | Botón «Reanalizar» y reanálisis al terminar la carga. |
| Anclas dentro de Shadow DOM | Se reconoce la limitación y se muestra un aviso si se detecta Shadow DOM. |
| Páginas muy grandes ralentizan el análisis | El recorrido es de una sola pasada y limita la lista mostrada a 500 hallazgos por categoría. |

## 11. Preguntas abiertas

- ¿Quieres que además detecte otros rellenos habituales («texto de ejemplo», «Título aquí», «Your text here», imágenes `placeholder`)?
- ¿Comprobar también si los enlaces externos responden (404) en una versión posterior? Implica hacer peticiones y es más lento.
- ¿Prefieres mantener el nombre «Contenido» u otro («Calidad», «Enlaces»)?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `awaiting-approval` | Creación y redacción completa, pendiente de aprobación |
| 2026-10-03 | `in-progress` | Cambio de estado desde MD SDD Hub (awaiting-approval → in-progress) |
| 2026-10-03 | `in-progress` | Revisados cambios de la persona (luz verde). Implementadas T-01 a T-07 en `extension/tabs/contenido/`; AC-01 a AC-06 comprobados sobre una página de prueba. Pendiente T-08: prueba manual en Chrome (AC-07 a AC-11) |
