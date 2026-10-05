# SPEC-006 · Tab Imágenes

| Campo | Valor |
|---|---|
| Estado | `backlog` |
| Autor | Claude Code |
| Propietario | Marcos |
| Creada | 2026-10-03 |
| Actualizada | 2026-10-03 |
| Objetivo de release | Por definir |
| Dependencias | SPEC-001, ADR-001 |

## 1. Resumen

Tab **Imágenes**: lista las imágenes de la página y detecta problemas de accesibilidad, rendimiento y SEO, con resaltado en la propia página.

## 2. Problema y evidencia

- Las imágenes son lo que más pesa y lo que más se descuida (sin `alt`, sin dimensiones, enormes, en formatos antiguos).

## 3. Objetivos

- Ver todas las imágenes con sus datos y los problemas de cada una.

## 4. Fuera de alcance

- Optimizar o convertir imágenes.
- Imágenes de fondo CSS en la v1 (ver preguntas abiertas).

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Lista las `<img>` (y `<picture>`) con miniatura, URL, tamaño mostrado, tamaño real (natural), peso transferido y formato. |
| FR-02 | Detecta `alt` ausente, `alt` vacío en imagen no decorativa y `alt` que parece un nombre de archivo. |
| FR-03 | Detecta imágenes sin `width`/`height` (riesgo de CLS) y sin `loading="lazy"` fuera del primer pantallazo. |
| FR-04 | Detecta imágenes con resolución natural mucho mayor que la mostrada (sobredimensionadas) y formatos no modernos (JPG/PNG frente a WebP/AVIF). |
| FR-05 | Contadores por problema y resaltado con borde de color por categoría, con clic para localizar. |

## 7. Criterios de aceptación

- [ ] AC-01 · Una imagen sin `alt` aparece marcada y se puede localizar en la página (FR-02, FR-05).
- [ ] AC-02 · Una imagen de 3000 px mostrada a 300 px aparece como sobredimensionada (FR-04).
- [ ] AC-03 · El peso de cada imagen coincide con la pestaña Red de DevTools (FR-01).

## 8. Diseño técnico

`extension/tabs/imagenes/` con `analisis.js` (inyectado con `chrome.scripting`), `vista.js` y `resaltado.js`; el peso se obtiene de `performance.getEntriesByType('resource')`.

## 9. Plan de tareas

- [ ] T-01 · Análisis del DOM y de los recursos de imagen.
- [ ] T-02 · Vista con lista, contadores y filtros.
- [ ] T-03 · Resaltado y localización.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Imágenes decorativas marcadas como error | Se respetan `alt=""`, `role="presentation"` y `aria-hidden`. |

## 11. Preguntas abiertas

- ¿Incluimos imágenes de fondo CSS?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
