# Controles y tarjetas

> [Sistema de diseño](../index.md) · Actualizada 2026-10-10

Componentes actuales que reutilizan las pestañas de auditoría.

## Valores

| Variante | Tokens o referencias |
|---|---|
| Botón, campo, selector | `--bg`, `--fg`, `--bd`; `--radio-control` de [Bordes](../fundamentos/bordes.md) |
| Tarjeta | `--card`, `--bd`; `--radio-tarjeta` de [Bordes](../fundamentos/bordes.md) |
| Pestaña activa | `--fg`, `--bar` |
| Pestaña inactiva | `--mut` |
| Estado vacío | `--mut` |

Fuente y tamaños en [Tipografía](../fundamentos/tipografia.md); paleta en [Colores](../fundamentos/colores.md).

## Reglas

- Reutilizar `.ctl`, `.tarjeta`, `.vacio` y los controles nativos del panel.
- Mostrar la pestaña activa mediante `aria-selected` y el subrayado existente.
- Mantener controles con etiqueta accesible y foco visible; las acciones nuevas deben ser utilizables con teclado.
- Seguir los temas claro y oscuro usando los tokens compartidos.

## En el código

`extension/sidepanel/panel.css` y `extension/sidepanel/panel.js`.

## Decisiones

Base actual confirmada en el onboarding del 2026-10-10. Sin DES asociado.
