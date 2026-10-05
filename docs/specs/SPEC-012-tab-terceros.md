# SPEC-012 · Tab Terceros

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

Tab **Terceros**: agrupa los recursos de la página por dominio externo (analítica, fuentes, chats, anuncios) y muestra cuánto pesan y cuánto retrasan la carga.

## 2. Problema y evidencia

- Los scripts de terceros suelen ser la mayor parte del peso y del bloqueo, y no se ven agrupados en la lista de requests.

## 3. Objetivos

- Saber qué dominios externos cargan la página y el coste de cada uno.

## 4. Fuera de alcance

- Bloquear dominios o simular su ausencia (posible mejora futura).

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001. Reutiliza los datos de captura de Velocidad.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Agrupa los requests de la página por dominio y los separa en propios y de terceros. |
| FR-02 | Por dominio muestra número de requests, peso transferido y tiempo acumulado, con barra proporcional. |
| FR-03 | Clasifica los dominios conocidos por categoría (analítica, publicidad, fuentes, CDN, social, otros) con una lista editable. |
| FR-04 | Muestra el TBT aproximado atribuible a cada tercero cuando sea posible, o lo indica como no disponible. |

## 7. Criterios de aceptación

- [ ] AC-01 · Los totales por dominio suman el total de la Tab Velocidad en la misma página (FR-01, FR-02).
- [ ] AC-02 · Un script de Google Tag Manager aparece como tercero de categoría analítica (FR-03).

## 8. Diseño técnico

`extension/tabs/terceros/` consume los requests de `compartido/depurador.js`; sin captura propia.

## 9. Plan de tareas

- [ ] T-01 · Agrupación por dominio y vista.
- [ ] T-02 · Clasificación por categoría.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Subdominios propios tratados como terceros | Se compara por dominio registrable (eTLD+1). |

## 11. Preguntas abiertas

- ¿Fusionar con la Tab Velocidad como una sección más?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
