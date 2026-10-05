# SPEC-014 · Informe PDF de la auditoría

| Campo | Valor |
|---|---|
| Estado | `backlog` |
| Autor | Claude Code |
| Propietario | Marcos |
| Creada | 2026-10-03 |
| Actualizada | 2026-10-03 |
| Objetivo de release | Por definir |
| Dependencias | SPEC-005, ADR-001 |

## 1. Resumen

Exportar el resultado de la auditoría total (Resumen y detalle por área) como informe imprimible o PDF para entregar a clientes.

## 2. Problema y evidencia

- Los resultados viven en el panel y hay que copiarlos a mano a un documento para enviarlos.

## 3. Objetivos

- Un botón que genere el informe de la página auditada con notas, hallazgos y capturas.

## 4. Fuera de alcance

- Enviar el informe por correo.
- Historial de informes o comparativas (futuro).

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | «Exportar informe» genera un documento con portada (URL, fecha), nota global, nota por área y hallazgos priorizados. |
| FR-02 | Cada Tab aporta su sección al informe a través del contrato `resumen()` de SPEC-005 (campo `informe` opcional). |
| FR-03 | El informe se abre en una pestaña de la extensión lista para imprimir/guardar como PDF, con estilos de impresión. |
| FR-04 | El informe se puede descargar también como JSON con todos los datos. |

## 7. Criterios de aceptación

- [ ] AC-01 · Tras «Analizar todo» el informe contiene una sección por cada Tab analizada (FR-01, FR-02).
- [ ] AC-02 · «Guardar como PDF» del navegador produce un documento paginado y legible (FR-03).

## 8. Diseño técnico

`extension/informe/` con una página HTML de la extensión y CSS de impresión. Se evaluará adaptar la identidad visual de Tres Tristes Tigres (skill `ttt-documento-pdf`) como plantilla.

## 9. Plan de tareas

- [ ] T-01 · Contrato `informe` en las Tabs.
- [ ] T-02 · Página del informe con CSS de impresión.
- [ ] T-03 · Exportar JSON.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Informe incoherente si faltan Tabs sin analizar | Solo incluir las analizadas e indicar las omitidas. |

## 11. Preguntas abiertas

- ¿Aplicamos la plantilla visual de la agencia desde la v1?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
