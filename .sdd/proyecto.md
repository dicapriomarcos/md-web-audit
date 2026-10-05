# Ficha del proyecto

| Campo | Valor |
|---|---|
| Nombre | MD Web Audit |
| Descripción | Extensión de Chrome (Manifest V3) para auditar páginas web desde un panel lateral con una Tab por tipo de auditoría. La primera es Velocidad. |
| Stack | JavaScript puro (módulos ES), Chrome Extensions MV3, `chrome.sidePanel`, `chrome.debugger`. Sin build ni dependencias. |
| Despliegue | Carga descomprimida en `chrome://extensions` (modo desarrollador). Publicación en Chrome Web Store por definir. |
| Actualizada | 2026-10-03 |

## Onboarding

| Paso | Estado |
|---|---|
| Ficha | ✅ |
| Git | Pendiente |
| Diseño | Pendiente |
| Decisiones existentes | No aplica |

## Comandos

| Para qué | Comando |
|---|---|
| Arrancar en local | Cargar la carpeta `extension/` en `chrome://extensions` → Modo desarrollador → Cargar descomprimida |
| Ejecutar los tests | Por definir |
| Lint / formato | Por definir |
| Compilar | No hay build |

## Estructura

- `extension/`: la extensión (manifest, service worker, panel lateral, `compartido/` y módulos por Tab en `tabs/`).
- `docs/`: specs, decisiones de arquitectura y de diseño.
- `.sdd/`: ficha, estado y decisiones del proyecto.

## Convenciones

- Una Tab = un módulo independiente en `extension/tabs/<nombre>/` (ver ADR-001).
- Todo corre en local: ninguna URL ni dato de la página auditada sale del navegador.

## Notas

- Proyecto de referencia: `C:\Proyectos\md-web-performance\perf-inspector` (extensión «MD Web performance»). De ahí se reutiliza la captura con `chrome.debugger`, las curvas de score de Lighthouse y el cálculo de CLS/TBT.
