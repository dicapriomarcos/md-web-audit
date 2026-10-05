# SPEC-009 · Tab Redes sociales

| Campo | Valor |
|---|---|
| Estado | `backlog` |
| Autor | Claude Code |
| Propietario | Marcos |
| Creada | 2026-10-03 |
| Actualizada | 2026-10-03 |
| Objetivo de release | Por definir |
| Dependencias | SPEC-002, ADR-001 |

## 1. Resumen

Tab **Redes sociales**: muestra cómo se verá la página al compartirla (Open Graph y Twitter Card) y valida sus metas.

## 2. Problema y evidencia

- Un enlace compartido sin imagen o con título cortado resta clics y casi nunca se revisa antes de publicar.

## 3. Objetivos

- Ver la vista previa y los metas que faltan o están mal.

## 4. Fuera de alcance

- Publicar o probar en las redes reales; limpiar cachés de Facebook o LinkedIn.

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Lee `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name` y `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`. |
| FR-02 | Muestra una vista previa aproximada para Facebook/LinkedIn y para X (Twitter). |
| FR-03 | Avisa de metas ausentes, imagen demasiado pequeña (menos de 1200×630 recomendado) o con relación de aspecto inadecuada. |
| FR-04 | Muestra qué meta se usa de respaldo (title o description normales) cuando falta el de Open Graph. |

## 7. Criterios de aceptación

- [ ] AC-01 · Con `og:image` la vista previa muestra la imagen; sin ella lo avisa (FR-02, FR-03).
- [ ] AC-02 · Una imagen de 400×200 genera el aviso de tamaño (FR-03).

## 8. Diseño técnico

`extension/tabs/redes/` con análisis inyectado y carga de la imagen para medir sus dimensiones.

## 9. Plan de tareas

- [ ] T-01 · Lectura de metas sociales.
- [ ] T-02 · Vista previa y avisos.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Las redes cambian el aspecto de la tarjeta | Se rotula como «vista previa aproximada». |

## 11. Preguntas abiertas

- ¿Fusionar con la Tab SEO en lugar de tener una aparte?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
