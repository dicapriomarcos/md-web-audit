# SPEC-005 · Tab Resumen con puntuación global

| Campo | Valor |
|---|---|
| Estado | `backlog` |
| Autor | Claude Code |
| Propietario | Marcos |
| Creada | 2026-10-03 |
| Actualizada | 2026-10-03 |
| Objetivo de release | Por definir |
| Dependencias | SPEC-001, SPEC-002, SPEC-003, SPEC-004, ADR-001 |

## 1. Resumen

Tab inicial **Resumen**: junta en una sola pantalla el resultado de todas las demás Tabs de auditoría para la página actual (nota por área, número de problemas críticos, avisos y aciertos) y enlaza a cada Tab para ver el detalle. Es la pieza que convierte las Tabs sueltas en una auditoría total.

## 2. Problema y evidencia

- Con una Tab por área hay que recorrerlas todas para saber cómo está la página.
- Un cliente o un jefe quiere una nota y una lista corta de lo más urgente, no diez pestañas.

## 3. Objetivos

- Una nota por área (Velocidad, SEO, Contenido, Imágenes, Accesibilidad, Seguridad…) y una global.
- Lista priorizada de los problemas más graves de toda la página.

## 4. Fuera de alcance

- Generar el informe PDF (SPEC-014).
- Auditar varias páginas a la vez.

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001. Sin permisos nuevos.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Cada Tab de auditoría expone, mediante `registro.js`, una función `resumen()` que devuelve `{ nota 0–100, criticos, avisos, ok, hallazgos[] }`. |
| FR-02 | El Resumen muestra una tarjeta por Tab con su nota, contadores y un enlace para abrirla. |
| FR-03 | Muestra una nota global (media ponderada, pesos configurables en código) y la lista de los hallazgos críticos de todas las Tabs. |
| FR-04 | Un botón «Analizar todo» ejecuta el análisis de todas las Tabs sobre la página actual. |
| FR-05 | Las Tabs que aún no se han ejecutado se muestran como «Sin analizar», sin afectar a la nota. |

## 7. Criterios de aceptación

- [ ] AC-01 · «Analizar todo» rellena una tarjeta por cada Tab registrada (FR-02, FR-04).
- [ ] AC-02 · La nota global cambia al corregirse un problema y reanalizar (FR-03).
- [ ] AC-03 · Una Tab sin analizar no cuenta en la nota global (FR-05).

## 8. Diseño técnico

Contrato `resumen()` en `registro.js` (ver ADR-001); `extension/tabs/resumen/vista.js` consume ese contrato sin conocer el interior de cada Tab.

## 9. Plan de tareas

- [ ] T-01 · Definir el contrato `resumen()` y adaptar las Tabs existentes.
- [ ] T-02 · Vista del Resumen con tarjetas, nota global y críticos.
- [ ] T-03 · «Analizar todo» y estados «Sin analizar».

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Notas no comparables entre áreas | Criterios de nota documentados por Tab y pesos visibles. |

## 11. Preguntas abiertas

- ¿Qué peso tiene cada área en la nota global?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
