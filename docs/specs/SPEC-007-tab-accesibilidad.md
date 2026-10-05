# SPEC-007 · Tab Accesibilidad

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

Tab **Accesibilidad**: revisa la página con comprobaciones automáticas básicas de WCAG y las localiza en la página.

## 2. Problema y evidencia

- La accesibilidad suele auditarse tarde o con herramientas pesadas; unas comprobaciones rápidas detectan los fallos más comunes.

## 3. Objetivos

- Detectar los fallos automáticos más frecuentes y mostrarlos con su ubicación.

## 4. Fuera de alcance

- Sustituir una auditoría manual completa o con lectores de pantalla.
- Reimplementar un motor completo: se evalúa usar la librería axe-core (ver preguntas abiertas).

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Detecta campos de formulario sin `label` o nombre accesible, y botones o enlaces sin texto ni `aria-label`. |
| FR-02 | Detecta saltos en la jerarquía de encabezados (por ejemplo de h2 a h4) y ausencia de `lang` en `<html>`. |
| FR-03 | Calcula el contraste de texto frente a su fondo y marca los que no llegan a AA (4.5:1, 3:1 en texto grande). |
| FR-04 | Detecta objetivos táctiles menores de 24×24 px y `tabindex` positivos. |
| FR-05 | Lista los hallazgos por gravedad con su regla WCAG, resaltado en la página y clic para localizar. |

## 7. Criterios de aceptación

- [ ] AC-01 · Un `<input>` sin label aparece como hallazgo y se localiza (FR-01, FR-05).
- [ ] AC-02 · Un texto gris claro sobre blanco aparece con su ratio de contraste (FR-03).
- [ ] AC-03 · Un salto de h2 a h4 se reporta (FR-02).

## 8. Diseño técnico

`extension/tabs/accesibilidad/` con análisis inyectado; se decide entre reglas propias o axe-core incluida en el paquete (sin red).

## 9. Plan de tareas

- [ ] T-01 · Decidir axe-core frente a reglas propias (ADR).
- [ ] T-02 · Análisis y vista de hallazgos.
- [ ] T-03 · Resaltado y localización.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Contraste con fondos de imagen o degradados | Marcar como «No determinable» en lugar de error. |

## 11. Preguntas abiertas

- ¿Usamos axe-core (más completo, más peso) o reglas propias?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
