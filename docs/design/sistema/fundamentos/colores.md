# Colores

> [Sistema de diseño](../index.md) · Actualizada 2026-10-10

Paleta existente del panel, conservada como base para las nuevas pestañas.

## Valores

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#ffffff` | `#1f2023` | Fondo |
| `--card` | `#f6f7f9` | `#2a2b2f` | Tarjetas |
| `--fg` | `#1a1a1a` | `#eeeeee` | Texto |
| `--mut` | `#6b7280` | `#9ca3af` | Texto secundario |
| `--bd` | `#e2e4e8` | `#3a3c42` | Bordes |
| `--bar` | `#3b82f6` | `#3b82f6` | Azul principal |
| `--suave` | `#3b82f624` | `#3b82f624` | Fondo destacado |
| `--mal` | `#ff4e42` | `#ff4e42` | Error |

## Reglas

- Seguir el tema del sistema mediante `prefers-color-scheme`.
- Reutilizar las variables existentes en nuevas vistas.
- Acompañar estados de error con texto; no depender exclusivamente del color.

## En el código

`extension/sidepanel/panel.css`, `:root` y media query de tema oscuro.

## Decisiones

Base actual confirmada por la persona el 2026-10-10. Sin DES asociado.
