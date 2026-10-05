# ADR-001 · Panel lateral y módulos por Tab

| Campo | Valor |
|---|---|
| Estado | `proposed` |
| Autor | Claude Code |
| Propietario | Marcos |
| Creada | 2026-10-03 |
| Actualizada | 2026-10-03 |
| Relacionadas | SPEC-001 a SPEC-014 |

## 1. Contexto

La extensión tendrá varias auditorías (Velocidad primero; después otras) y cada una necesita su propia vista. El proyecto de referencia (md-web-performance) usa un panel flotante inyectado en la página con Shadow DOM: funciona, pero tapa parte de la página auditada, hay que inyectarlo en cada pestaña y no escala bien a varias vistas.

## 2. Decisión

- La interfaz es el **Side Panel de Chrome** (`chrome.sidePanel`), que se abre al pulsar el icono de la extensión.
- El panel tiene un **shell** con barra de Tabs. Cada Tab es un **módulo independiente** en `extension/tabs/<nombre>/` que se registra en `extension/tabs/registro.js` con `{ id, titulo, montar(contenedor, ctx) }` y, si necesita captura, un archivo de captura que corre en el service worker.
- JavaScript puro con módulos ES, **sin build ni dependencias**, como en md-web-performance.
- El service worker se declara `"type": "module"`. La captura de datos vive en el service worker y se comunica con el panel por `chrome.runtime.connect` (puerto): mientras el panel está abierto, se mide; al cerrarlo, se desengancha el depurador.

## 3. Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| Panel flotante en Shadow DOM (como performance) | Tapa la página, se inyecta en cada pestaña y mezcla lógica de varias Tabs en un solo content script. |
| Ventana o pestaña propia de la extensión | Saca al usuario de la página que está auditando. |
| Vite + TypeScript | Añade compilación y dependencias que ahora no aportan; se puede migrar después porque los módulos ya están separados. |

## 4. Consecuencias

- Positivas: no tapa la página, persiste al cambiar de pestaña, espacio para Tabs, cada auditoría se añade sin tocar las demás.
- Costes: hay que reescribir la UI del panel flotante como página del side panel; el ancho del panel lo controla Chrome.
- Aviso de depuración de Chrome mientras se mide (inherente a `chrome.debugger`).

## 5. Reglas para el código

- Una Tab nueva = una carpeta en `extension/tabs/` + una línea en `registro.js`. No se edita el shell para añadirla.
- Una Tab no importa código de otra; lo común va en `extension/compartido/`.
- Solo `extension/compartido/depurador.js` llama a `chrome.debugger.attach`/`detach`: las Tabs que necesitan CDP (Velocidad, Consola) se suscriben a él y comparten una única conexión por pestaña.
- Todo el procesamiento es local: ninguna petición a servidores externos con datos de la página.
- Se comprueba en revisión: añadir una Tab de prueba vacía no requiere cambios fuera de su carpeta y del registro.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `proposed` | Creación de la decisión |
