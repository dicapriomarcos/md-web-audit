# SPEC-015 · Tab Caché

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

Tab **Caché**: indica si la página y sus recursos están cacheados y cómo. Revisa la caché del navegador (cabeceras `Cache-Control`, `ETag`…), la caché de CDN o servidor (cabeceras como `cf-cache-status` o `x-cache`) y la caché de página de plugins de WordPress, además de la compresión.

## 2. Problema y evidencia

- Una web sin caché o mal cacheada es lenta y cara de servir, y no se ve a simple vista.
- Hoy se comprueba mirando cabeceras a mano en DevTools o con herramientas externas.

## 3. Objetivos

- Responder rápido a «¿tiene caché activa?» para el documento y para cada recurso.
- Señalar los recursos que deberían cachearse y no lo hacen.

## 4. Fuera de alcance

- Configurar o vaciar cachés del servidor, del CDN o de WordPress.
- Garantizar la caché del servidor cuando no deja rastro en las cabeceras: se indica «no detectada», no «inexistente».

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001. Reutiliza la captura de red (`compartido/depurador.js`).

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Para el documento HTML muestra `Cache-Control`, `Expires`, `ETag`, `Last-Modified`, `Age` y `Vary`, con una lectura en lenguaje claro («cacheable 1 h», «no se cachea»). |
| FR-02 | Detecta caché de CDN/servidor por cabeceras (`cf-cache-status`, `x-cache`, `x-served-by`, `x-varnish`, `x-litespeed-cache`, `x-proxy-cache`, `server-timing`…) y muestra HIT, MISS o la información disponible, con el proveedor identificado. |
| FR-03 | Detecta caché de página de WordPress por cabeceras y por comentarios del HTML (WP Rocket, LiteSpeed Cache, W3 Total Cache, WP Super Cache, WP Fastest Cache, SG Optimizer…). |
| FR-04 | Para cada recurso estático (JS, CSS, imágenes, fuentes) indica si se sirvió desde caché, su duración (`max-age`) y avisa de los que no tienen caché o tienen una duración menor a 1 semana. |
| FR-05 | Indica la compresión del documento y de los recursos de texto (gzip, brotli o ninguna) y el protocolo HTTP (HTTP/1.1, h2, h3). |
| FR-06 | Botón «Segunda carga»: recarga la página con caché normal y compara peso y tiempo con la primera, para ver el efecto real de la caché. |
| FR-07 | Resumen con un veredicto (Bien cacheada / Mejorable / Sin caché) y la lista de hallazgos. |

## 7. Criterios de aceptación

- [ ] AC-01 · En una página con `Cache-Control: max-age=3600` se muestra «cacheable 1 h»; con `no-store` se muestra «no se cachea» (FR-01).
- [ ] AC-02 · Una respuesta con `cf-cache-status: HIT` se muestra como HIT de Cloudflare (FR-02).
- [ ] AC-03 · En una web con WP Rocket aparece detectado como caché de página (FR-03).
- [ ] AC-04 · Un script sin `Cache-Control` aparece como recurso sin caché (FR-04).
- [ ] AC-05 · La compresión y el protocolo coinciden con los de la pestaña Red de DevTools (FR-05).
- [ ] AC-06 · «Segunda carga» muestra la comparación y el peso transferido baja si los recursos están cacheados (FR-06).

## 8. Diseño técnico

`extension/tabs/cache/` con `analisis.js` (cabeceras de `Network.responseReceived` y comentarios del HTML), `huellas.json` con las cabeceras y firmas por proveedor, y `vista.js`. La opción «sin caché» de Velocidad se deshabilita durante «Segunda carga» y se restaura después.

## 9. Plan de tareas

- [ ] T-01 · Lectura de cabeceras de caché del documento y recursos.
- [ ] T-02 · Detección de CDN/servidor y de plugins de caché de WordPress.
- [ ] T-03 · Compresión y protocolo HTTP.
- [ ] T-04 · Vista con veredicto y lista de recursos sin caché.
- [ ] T-05 · «Segunda carga» y comparación.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Algunas cachés no dejan rastro en cabeceras | Mostrar «no detectada» y no afirmar que no existe. |
| La caché de Chrome falsea el resultado de recursos | Se leen las cabeceras originales y se marca `fromDiskCache`. |

## 11. Preguntas abiertas

- ¿Esta Tab se queda aparte o se integra como sección de Velocidad?
- ¿Qué proveedores de caché y CDN son prioritarios?

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
