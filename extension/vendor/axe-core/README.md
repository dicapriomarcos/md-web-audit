# Motor de accesibilidad empaquetado

- Paquete: axe-core 4.14.0, licencia MPL-2.0 (archivo `LICENSE`).
- Fuente: https://registry.npmjs.org/axe-core/-/axe-core-4.14.0.tgz
- Proyecto: https://github.com/dequelabs/axe-core
- SHA-256 de `axe.min.js`: `20c09fe157a8a34a30e241aaa1fcdade657734f08ab379ecfbeb7d45cc46e878`.
- `locale-es.js` envuelve sin modificar `locales/es.json` en una asignación al mundo aislado. Se genera al actualizar la copia local.
- La extensión no usa npm ni necesita compilación. Los archivos se cargan desde su paquete local.
- Configuración: WCAG A/AA hasta 2.2 y buenas prácticas, sin iframes ni precarga de recursos externos.

Los textos se traducen en el normalizador con `locales/es.json`, sustituyendo campos de datos sin evaluar código. No se configura la traducción con `axe.configure({locale})`, porque el motor compila plantillas y CSP de Manifest V3 lo bloquea.
