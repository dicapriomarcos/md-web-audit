# Bordes

> [Sistema de diseño](../index.md) · Actualizada 2026-10-10

Radios existentes de controles y tarjetas.

## Valores

| Token o referencia | Valor | Uso |
|---|---|---|
| `--radio-control` | `6px` | Botones, campos y selectores |
| `--radio-tarjeta` | `8px` | Tarjetas |
| `--borde-panel` | `1px solid var(--bd)` | Controles y tarjetas |

## Reglas

- Conservar radios actuales.
- Navegación con pestañas sin radio y con subrayado del elemento activo.
- `--radio-control` y `--radio-tarjeta` son variables CSS en `:root`; `--borde-panel` sigue siendo una referencia documental.

## En el código

`extension/sidepanel/panel.css`, controles, `.tarjeta` y `nav button`.

## Decisiones

Radios confirmados por la persona el 2026-10-10. Sin DES asociado.
