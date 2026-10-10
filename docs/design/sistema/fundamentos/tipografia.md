# Tipografía

> [Sistema de diseño](../index.md) · Actualizada 2026-10-10

Fuente del sistema existente en el panel.

## Valores

| Token documental | Valor | Uso |
|---|---|---|
| `--fuente-panel` | `system-ui, "Segoe UI", sans-serif` | Texto general |
| `--texto-panel` | `12.5px` | Cuerpo y controles |
| `--interlineado-panel` | `1.35` | Cuerpo |
| `--texto-seccion` | `11px` | Títulos de tarjetas |

## Reglas

- Mantener la fuente del sistema, sin descargar fuentes externas.
- Los controles heredan la fuente del cuerpo.
- Estos nombres son documentales: aún no existen como variables CSS. Si se extraen al código, conservar los valores actuales.

## En el código

`extension/sidepanel/panel.css`, reglas de `body`, controles y `h2`.

## Decisiones

Fuente actual confirmada por la persona el 2026-10-10. Sin DES asociado.
