# Pruebas de accesibilidad

Requieren Node.js, Playwright y su navegador Chromium. Son herramientas de desarrollo; la extensión no las utiliza ni requiere build.

Ejecutar desde la raíz con Playwright disponible para Node: `node tests/accesibilidad/verificar.cjs`. Si hace falta el navegador, `npx playwright install chromium`.

El servidor usa únicamente loopback y un puerto libre. Se carga la extensión real en un perfil temporal independiente. Se comprueban el motor local, los nombres válidos, contraste, recomendaciones, excepciones de tamaño, límite de elementos, filtros, teclado, temas y comandos mediante `chrome.scripting`. También se abre el panel completo y se comprueba la retirada de resaltados al cerrar su puerto.

`casos.html` contiene errores intencionados. El caso incompleto de contraste se prueba mediante un resultado simulado del motor para comprobar que el normalizador no inventa ratios. `resultado.json` recoge solo comprobaciones que han pasado; las capturas se guardan en `.impeccable/review/screenshots/final/`.

Para verificar solo concurrencia y errores, sin navegador ni dependencias: `node tests/accesibilidad/captura.cjs`.

Para Chrome instalado que no admite carga por flags, definir `MD_AUDIT_BROWSER` con la ruta de su ejecutable y `MD_AUDIT_LOAD_CDP=1`. La prueba activa modo desarrollador y usa `Extensions.loadUnpacked` exclusivamente en su perfil temporal; no cambia el perfil habitual. Playwright debe estar disponible mediante su instalación local o `NODE_PATH`. La última verificación completa pasó en Google Chrome 155.0.8059.39; también pasó en Edge Chromium antes de la comprobación final en Chrome.
