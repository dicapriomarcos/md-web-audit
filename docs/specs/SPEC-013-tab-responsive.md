# SPEC-013 · Tab Responsive

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

Tab **Responsive**: comprueba cómo se comporta la página en distintos anchos (móvil, tablet, escritorio) y detecta desbordamientos y fallos de viewport.

## 2. Problema y evidencia

- Es común que una página se desborde horizontalmente o tenga textos ilegibles en móvil y solo se descubra al verla en un teléfono.

## 3. Objetivos

- Detectar problemas de adaptación a móvil sin salir de la extensión.

## 4. Fuera de alcance

- Pruebas en dispositivos reales o en otros navegadores.
- Capturas de pantalla completas de todo el sitio.

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001 (`debugger` para emular el tamaño).

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Comprueba la etiqueta `viewport` y avisa si falta o impide el zoom. |
| FR-02 | Emula anchos predefinidos (360, 768, 1280 px) y detecta desbordamiento horizontal en cada uno. |
| FR-03 | Lista los elementos que provocan el desbordamiento y los resalta en la página. |
| FR-04 | Detecta texto menor de 12 px y objetivos táctiles pequeños en el ancho móvil. |
| FR-05 | Al cerrar la Tab o el panel se restaura el tamaño original. |

## 7. Criterios de aceptación

- [ ] AC-01 · En una página con un elemento más ancho que 360 px, el ancho móvil lo marca como causa de desbordamiento (FR-02, FR-03).
- [ ] AC-02 · Cerrar el panel restaura la emulación (FR-05).

## 8. Diseño técnico

`extension/tabs/responsive/` con `Emulation.setDeviceMetricsOverride` mediante `compartido/depurador.js` y análisis inyectado.

## 9. Plan de tareas

- [ ] T-01 · Emulación de anchos y restauración.
- [ ] T-02 · Detección de desbordamiento y elementos causantes.
- [ ] T-03 · Viewport, texto pequeño y vista.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Interfiere con la emulación del perfil móvil de Velocidad | Gestor único en `depurador.js` con prioridad documentada. |

## 11. Preguntas abiertas

- ¿Qué anchos adicionales queréis?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
