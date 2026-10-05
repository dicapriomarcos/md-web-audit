# Revisión pendiente · docs/specs/SPEC-002-tab-seo-en-panel-lateral.md

> La persona ha modificado este documento desde MD SDD Hub. Revisa los cambios siguiendo `.skills/sdd/revision.md`: lee el diff y el archivo actual, ajusta spec/tareas/código si procede, añade al final «## Resultado de la revisión» y mueve este archivo a `.sdd/review/hecho/`.

- Archivo: `docs/specs/SPEC-002-tab-seo-en-panel-lateral.md`

## Cambio · 2026-10-03 22:26 · Cambio de estado

La persona ha cambiado el estado: `awaiting-approval` → `in-progress`

(+2 / −1 líneas)

```diff
@@ línea 2 @@
  
  | Campo | Valor |
  |---|---|
- | Estado | `awaiting-approval` |
+ | Estado | `in-progress` |
  | Autor | Claude Code |
  | Propietario | Marcos |
  | Creada | 2026-10-03 |
@@ línea 128 @@
  | Fecha | Estado | Nota |
  |---|---|---|
  | 2026-10-03 | `awaiting-approval` | Creación y redacción completa, pendiente de aprobación. Incluye resaltado opcional de `<article>` y tarjeta de schema |
+ | 2026-10-03 | `in-progress` | Cambio de estado desde MD SDD Hub (awaiting-approval → in-progress) |
  
```

## Resultado de la revisión

- **Qué he entendido**: la persona ha aprobado la SPEC-002 (`awaiting-approval` → `in-progress`). Es luz verde para implementar; no cambia requisitos ni criterios.
- **Qué he cambiado**: implementada la Tab SEO en `extension/tabs/seo/` (T-01 a T-10 marcadas), registrada en `tabs/registro.js`, estilos en `sidepanel/panel.css` y README actualizado. En la spec: casillas, diseño técnico (se añade `captura.js`) y Historial.
- **Desviación del diseño**: `fetch` HEAD y `robots.txt` se hacen desde el panel y no desde el service worker; ambos tienen `host_permissions` y funciona igual con menos piezas. Anotado en la spec.
- **Pendiente**: T-11 (prueba manual de AC-01 a AC-13 en Chrome con el panel real); los AC siguen sin marcar hasta entonces. Las dos preguntas abiertas de la sección 11 (imagen de WordPress y otros datos SEO) siguen sin respuesta.
