# SPEC-010 · Tab Tecnologías

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

Tab **Tecnologías**: detecta con qué está hecha la web (CMS, tema y plugins visibles, frameworks JS, librerías, analítica, CDN, servidor) y si usa captcha o protección antibots (reCAPTCHA, hCaptcha, Turnstile…).

## 2. Problema y evidencia

- Antes de auditar o mantener una web hay que saber qué tecnología usa; hoy se averigua mirando el código a mano.

## 3. Objetivos

- Mostrar las tecnologías detectadas con su versión cuando sea visible.

## 4. Fuera de alcance

- Detectar vulnerabilidades de cada versión.
- Mantener una base de huellas tan amplia como Wappalyzer.

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Detecta WordPress (meta generator, rutas `wp-content`/`wp-includes`) y muestra el tema y los plugins visibles por sus rutas. |
| FR-02 | Detecta frameworks y librerías JS (React, Vue, Angular, jQuery…) y su versión cuando está disponible. |
| FR-03 | Detecta analítica y etiquetas (Google Analytics, Tag Manager, Meta Pixel…), servidor y CDN por cabeceras. |
| FR-04 | Las huellas viven en un archivo de datos editable (`huellas.json`) para ampliarlas sin tocar el código. |
| FR-05 | Detecta si la página usa **captcha o protección antibots** (reCAPTCHA v2/v3, hCaptcha, Cloudflare Turnstile, Friendly Captcha, honeypot de Akismet) y muestra el tipo, la versión, la clave pública (`sitekey`) y en qué formularios se aplica. Si no hay, lo indica; si hay formularios sin protección, lo avisa. |

## 7. Criterios de aceptación

- [ ] AC-01 · En una web WordPress aparecen el CMS, el tema y los plugins cuyas rutas se cargan (FR-01).
- [ ] AC-02 · En una web con Google Tag Manager aparece detectado (FR-03).
- [ ] AC-03 · En una página con reCAPTCHA se muestra el tipo (v2 o v3) y su sitekey; en un formulario de contacto sin captcha se avisa de que no está protegido (FR-05).

## 8. Diseño técnico

`extension/tabs/tecnologias/` con `huellas.json`, análisis inyectado y lectura de cabeceras de la captura de red.

## 9. Plan de tareas

- [ ] T-01 · Formato de `huellas.json` y detección por DOM/rutas.
- [ ] T-02 · Detección por cabeceras y variables globales de la página.
- [ ] T-04 · Detección de captcha y antibots (scripts, iframes, `data-sitekey`, `grecaptcha`, `hcaptcha`, `turnstile`) y relación con los formularios.
- [ ] T-03 · Vista.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Falsos positivos | Mostrar la evidencia de cada detección. |

## 11. Preguntas abiertas

- ¿Qué tecnologías son prioritarias para vuestros clientes?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
