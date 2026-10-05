# SPEC-011 · Tab Cookies y rastreo

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

Tab **Cookies y rastreo**: lista las cookies, el almacenamiento local y los rastreadores de terceros de la página, para comprobar si se cargan antes de aceptar el banner de cookies.

## 2. Problema y evidencia

- En el cumplimiento RGPD es habitual que analítica y publicidad carguen antes del consentimiento y casi nunca se verifica.

## 3. Objetivos

- Ver qué se guarda y qué terceros se contactan, y en qué momento.

## 4. Fuera de alcance

- Dictamen legal de cumplimiento; solo se muestran hechos técnicos.
- Aceptar o rechazar el banner automáticamente.

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001, más `cookies`.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Lista las cookies (propias y de terceros) con dominio, caducidad y flags. |
| FR-02 | Lista el contenido de `localStorage` y `sessionStorage` (solo claves y tamaño). |
| FR-03 | Identifica dominios de rastreo conocidos (analítica, publicidad, píxeles) a partir de las peticiones de red y una lista editable. |
| FR-04 | Botón «Empezar limpio»: borra cookies y almacenamiento del sitio, recarga y registra qué se carga **antes** de interactuar con el banner. |

## 7. Criterios de aceptación

- [ ] AC-01 · «Empezar limpio» recarga la página y la Tab muestra qué cookies y terceros aparecen sin haber aceptado nada (FR-04).
- [ ] AC-02 · Una petición a un dominio de rastreo conocido aparece clasificada (FR-03).

## 8. Diseño técnico

`extension/tabs/cookies/` con `chrome.cookies`, captura de red compartida y `rastreadores.json` editable.

## 9. Plan de tareas

- [ ] T-01 · Cookies y almacenamiento.
- [ ] T-02 · Clasificación de terceros.
- [ ] T-03 · Flujo «Empezar limpio».

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| «Empezar limpio» borra la sesión del usuario | Confirmación previa y aviso claro. |

## 11. Preguntas abiertas

- ¿Qué lista de rastreadores usamos como base?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
