# SPEC-008 · Tab Seguridad

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

Tab **Seguridad**: revisa HTTPS, cabeceras de seguridad, cookies y malas prácticas visibles en el HTML. Solo lee lo que el navegador ya recibe; no hace ataques ni pruebas activas.

## 2. Problema y evidencia

- Faltan cabeceras y flags de seguridad en muchas webs y se comprueban a mano.

## 3. Objetivos

- Mostrar qué protecciones tiene y cuáles faltan en la página actual.

## 4. Fuera de alcance

- Escaneo de vulnerabilidades, pruebas de intrusión o fuerza bruta.
- Auditar otros dominios distintos al de la pestaña.

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001, más `cookies` si se confirma en el diseño.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Indica si la página usa HTTPS y detecta contenido mixto. |
| FR-02 | Lista las cabeceras de seguridad (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) con presente/ausente y su valor. |
| FR-03 | Lista las cookies del sitio con sus flags `Secure`, `HttpOnly` y `SameSite`, y avisa de las que no los tienen. |
| FR-04 | Detecta enlaces `target="_blank"` sin `rel="noopener"` y formularios que envían a HTTP. |
| FR-05 | Muestra una nota de seguridad y los hallazgos por gravedad. |

## 7. Criterios de aceptación

- [ ] AC-01 · En un sitio sin HSTS la cabecera aparece como ausente (FR-02).
- [ ] AC-02 · Una cookie sin `Secure` se marca como aviso (FR-03).
- [ ] AC-03 · Un recurso HTTP en una página HTTPS se reporta como contenido mixto (FR-01).

## 8. Diseño técnico

Las cabeceras se leen con la captura de red (SPEC-001/`depurador.js`); las cookies con `chrome.cookies`; el HTML con análisis inyectado.

## 9. Plan de tareas

- [ ] T-01 · Lectura de cabeceras de respuesta del documento.
- [ ] T-02 · Cookies y flags.
- [ ] T-03 · Análisis de HTML y vista con nota.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Permiso `cookies` ampliado | Documentarlo en la ficha y usarlo solo para el sitio auditado. |

## 11. Preguntas abiertas

- ¿Se incluye la comprobación de WordPress expuesto (`wp-json`, `xmlrpc`, versión visible) en esta Tab o en otra?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
