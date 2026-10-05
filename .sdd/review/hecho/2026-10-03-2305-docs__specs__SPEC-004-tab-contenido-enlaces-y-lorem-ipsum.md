# Revisión pendiente · docs/specs/SPEC-004-tab-contenido-enlaces-y-lorem-ipsum.md

> La persona ha modificado este documento desde MD SDD Hub. Revisa los cambios siguiendo `.skills/sdd/revision.md`: lee el diff y el archivo actual, ajusta spec/tareas/código si procede, añade al final «## Resultado de la revisión» y mueve este archivo a `.sdd/review/hecho/`.

- Archivo: `docs/specs/SPEC-004-tab-contenido-enlaces-y-lorem-ipsum.md`

## Cambio · 2026-10-03 22:28 · Cambio de estado

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
@@ línea 117 @@
  | Fecha | Estado | Nota |
  |---|---|---|
  | 2026-10-03 | `awaiting-approval` | Creación y redacción completa, pendiente de aprobación |
+ | 2026-10-03 | `in-progress` | Cambio de estado desde MD SDD Hub (awaiting-approval → in-progress) |
  
```

## Resultado de la revisión

- **Entendido**: la persona ha pasado SPEC-004 de `awaiting-approval` a `in-progress`: luz verde para implementar. Sin cambios de requisitos, criterios ni tareas.
- **Cambiado**: implementada la Tab Contenido en `extension/tabs/contenido/` (T-01 a T-07) y registrada en `tabs/registro.js`; estilos en `panel.css`; README actualizado. El indicador usa el contrato real `indicador(estado)` del registro (la spec decía «campo de SPEC-003»; se ajustó el texto del diseño técnico).
- **Decisiones menores**: un `<a name="x">` sin `href` no cuenta como enlace sin destino (es un destino de ancla); «posible botón» se detecta por `role="button"`, `onclick`, `aria-controls/expanded` y `data-toggle`, porque los manejadores añadidos con JavaScript no se ven desde el mundo aislado de la extensión.
- **Preguntas abiertas**: las de la sección 11 de la spec siguen abiertas. Falta T-08: probar AC-07 a AC-11 en Chrome con la extensión cargada.
