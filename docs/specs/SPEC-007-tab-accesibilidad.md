# SPEC-007 · Tab Accesibilidad

| Campo | Valor |
|---|---|
| Estado | `awaiting-review` |
| Autor | Claude Code |
| Propietario | Marcos |
| Creada | 2026-10-03 |
| Actualizada | 2026-10-10 |
| Objetivo de release | Por definir |
| Dependencias | SPEC-001, ADR-001, ADR-002 |

## 1. Resumen

Tab **Accesibilidad**: analiza la página activa con axe-core empaquetado localmente, tomando como referencia WCAG 2.2 A/AA. Separa problemas, recomendaciones y comprobaciones que necesitan revisión manual, con explicación y localización de elementos. No envía datos a servidores.

## 2. Problema y evidencia

El registro actual incluye Velocidad, SEO, Consola y Contenido, pero no accesibilidad. Se necesita detectar problemas frecuentes sin salir del panel ni depender de servicios externos.

## 3. Objetivos

- Detectar fallos automáticos frecuentes y localizar sus elementos.
- Separar resultados concluyentes, recomendaciones y revisión manual.
- Mantener todo el análisis dentro del navegador.

## 4. Fuera de alcance

- Sustituir revisión con teclado y lectores de pantalla, certificar conformidad o dar una puntuación de conformidad.
- Reimplementar un motor completo, corregir automáticamente la web o exportar PDF.
- Auditar iframes, Shadow DOM cerrado y contenido todavía no renderizado. La vista informa esta limitación.

## 5. Usuarios y permisos

Misma persona y permisos que SPEC-001. Se utiliza `chrome.scripting` sobre HTTP/HTTPS; no se añaden permisos. Las páginas restringidas muestran una explicación.

## 6. Requisitos

| ID | Requisito |
|---|---|
| FR-01 | Detecta campos, botones y enlaces sin nombre accesible e imágenes sin alternativa textual. Respeta `label`, `aria-label`, `aria-labelledby` e imágenes decorativas. |
| FR-02 | Detecta idioma ausente o inválido en `<html>`. Reporta saltos de encabezados como recomendaciones, sin afirmar incumplimiento automático WCAG. |
| FR-03 | Detecta contraste insuficiente según las reglas AA del motor: 4.5:1 en texto normal y 3:1 en texto grande. Muestra ratio y umbral cuando estén disponibles; los casos no determinables requieren revisión manual. |
| FR-04 | Evalúa objetivos de interacción con las excepciones de tamaño y espaciado del motor; no marca automáticamente todo control menor de 24×24 px. Presenta `tabindex` positivos como recomendaciones. |
| FR-05 | Lista hallazgos por gravedad con regla, criterio WCAG cuando corresponda, explicación en español y elementos afectados; permite localizar y resaltar sin modificar sus estilos originales. |
| FR-06 | Ofrece contadores y filtros por gravedad y categoría: problemas, revisión manual y recomendaciones. Distingue reglas de elementos. |
| FR-07 | Analiza al seguir una página y permite reanalizar bajo demanda. Descarta resultados de documentos anteriores y evita ejecuciones simultáneas en un mismo documento. |
| FR-08 | Muestra estados de carga, error, página restringida y ausencia de problemas detectados, recordando los límites del análisis automático. |
| FR-09 | Retira resaltados al cambiar de página o cerrar el panel. Si un elemento desaparece, solicita repetir el análisis. |
| NFR-01 | Incluye el motor con versión fijada, procedencia y licencia; no descarga código durante la auditoría ni envía datos fuera del navegador. |
| NFR-02 | Mantiene JavaScript sin build, módulos por pestaña y el sistema de diseño. Textos del panel en español y fragmentos HTML mostrados como texto. |
| NFR-03 | Limita el detalle enviado al panel a 100 elementos por regla, conservando total real y aviso de truncamiento. Vista utilizable con teclado y foco visible. |

## 7. Criterios de aceptación

- [x] AC-01 · Un `<input>` sin label aparece como hallazgo y se localiza (FR-01, FR-05).
- [x] AC-02 · Un texto gris claro sobre blanco aparece con su ratio de contraste (FR-03).
- [x] AC-03 · Un salto de h2 a h4 se reporta como recomendación (FR-02).
- [x] AC-04 · Un campo con `aria-labelledby`, un botón con `aria-label` y una imagen decorativa no generan falsos errores de nombre o alternativa (FR-01).
- [x] AC-05 · Idioma ausente aparece como problema y `tabindex` positivo como recomendación (FR-02, FR-04).
- [x] AC-06 · Un contraste no determinable aparece en revisión manual, sin inventar ratios (FR-03).
- [x] AC-07 · Un control pequeño que cumple una excepción de espaciado no se marca como error de tamaño (FR-04).
- [x] AC-08 · Filtros y contadores separan categorías y distinguen reglas de elementos (FR-06).
- [x] AC-09 · Navegar durante un análisis no muestra resultados de la página anterior; reanalizar actualiza la vista (FR-07).
- [x] AC-10 · Cerrar el panel o cambiar de página elimina resaltados y conserva estilos; localizar un elemento desaparecido informa de ello (FR-05, FR-09).
- [x] AC-11 · Página restringida, error y ausencia de problemas muestran estados explicativos sin certificar conformidad (FR-08).
- [x] AC-12 · La auditoría no descarga el motor ni envía peticiones externas; versión, procedencia y licencia están documentadas (NFR-01).
- [x] AC-13 · Más de 100 elementos de una regla conservan el total e indican truncamiento; teclado y foco funcionan en temas claro y oscuro (NFR-02, NFR-03).

## 8. Diseño técnico

Motor descrito en ADR-002 e implementado dentro del alcance aprobado de esta spec. `extension/tabs/accesibilidad/` contiene `index.js`, `captura.js`, `analisis.js`, `vista.js` y `resaltado.js`; se registra en `extension/tabs/registro.js`. Sigue el contrato `crearCaptura(ctx)` existente y utiliza `chrome.scripting` en el mundo aislado, sin otra conexión de depurador.

La copia del motor vive en `extension/vendor/axe-core/`, con versión y licencia. `axe.run` analiza el documento principal excluyendo iframes, con reglas WCAG A/AA disponibles hasta 2.2 y buenas prácticas pertinentes. `violations` e `incomplete` se normalizan por separado; encabezados y `tabindex` se categorizan como recomendaciones. Se conservan regla, gravedad, referencias, explicación, total de nodos y detalles limitados.

El resaltado utiliza una capa propia que no intercepte eventos, excluida del análisis y retirada antes de reanalizar o detener. Localizar valida que el elemento exista. Un identificador de ejecución/documento invalida análisis pendientes tras navegar.

La vista reutiliza tarjetas, controles y tokens del panel. El onboarding de diseño documenta esa base antes de implementar la interfaz. Los enlaces de ayuda se abren solo por acción de la persona.

Referencias: [API de axe-core](https://www.deque.com/axe/core-documentation/api-documentation/), [resultados incompletos](https://github.com/dequelabs/axe-core), [excepciones de tamaño de objetivos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).

## 9. Plan de tareas

- [x] T-01 · Decidir axe-core frente a reglas propias (ADR); motor local implementado dentro del alcance aprobado de SPEC-007 y descrito en ADR-002, cuyo estado formal sigue proposed.
- [x] T-02 · Análisis y vista de hallazgos.
- [x] T-03 · Resaltado y localización.
- [x] T-04 · Incorporar versión fijada del motor con licencia y configuración WCAG A/AA y buenas prácticas.
- [x] T-05 · Registrar el módulo y la captura con invalidación de resultados, análisis secuencial y estados de error.
- [x] T-06 · Normalizar resultados y mensajes en español; separar categorías, conservar totales y limitar detalles.
- [x] T-07 · Añadir contadores, filtros, reanálisis y estados vacíos siguiendo el sistema de diseño.
- [x] T-08 · Crear páginas de prueba y verificar nombres accesibles, contraste, tamaño, recomendaciones y límites.
- [x] T-09 · Verificar integración en Chrome: navegación, páginas restringidas, localización, limpieza y ausencia de envío de datos.
- [x] T-10 · Revisar teclado, foco y temas; documentar uso y límites en `extension/README.md`.
- [x] T-11 · Invalidar la captura de accesibilidad al inicio de una recarga, incluso si mantiene la misma URL; comprobarlo sin cambiar el comportamiento de las demás capturas.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Fondos complejos y contraste no determinable | Mostrar revisión manual, sin inventar valores. |
| Confundir recomendaciones con infracciones | Separar categorías y referencias WCAG cuando correspondan. |
| Confundir análisis automático con conformidad | Nota visible, sin certificado ni puntuación. |
| Análisis costoso en páginas grandes | Evitar ejecuciones simultáneas y limitar detalles. |
| Contenido dinámico o inaccesible | Informar límites y permitir repetir tras abrir menús o diálogos. |

## 11. Preguntas abiertas

SPEC-007 aprobada por la persona e implementada. ADR-002 conserva su estado formal `proposed`; el uso del motor local forma parte del alcance aprobado de esta spec. No quedan preguntas de implementación abiertas.

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-03 | `backlog` | Creación de la spec |
| 2026-10-10 | `awaiting-approval` | Completados alcance, criterios y tareas a petición de la persona; propuesta de motor local en ADR-002. No se inicia implementación sin aprobación. |
| 2026-10-10 | `in-progress` | Cambio de estado desde MD SDD Hub (awaiting-approval → in-progress) |
| 2026-10-10 | `in-progress` | Revisados cambios de la persona: aprobación de SPEC-007 desde MD SDD Hub; se implementa el motor local definido en el alcance aprobado. ADR-002 conserva su estado proposed hasta su aceptación formal. |
| 2026-10-10 | `awaiting-review` | Implementadas T-02 a T-11 y verificados AC-01 a AC-13. Chrome 155.0.8059.39 real: motor empaquetado, nombres, contraste, recomendaciones, excepción de espaciado, límite 100, filtros, teclado/foco, temas 320/420 px, cambio de pestaña, recarga, localización y cierre de puerto. AC-06 mediante contrato incompleto simulado, sin inventar ratios. Captura: 7 comprobaciones de concurrencia/documentId/errores. Sintaxis y diff sin errores; revisión visual independiente puntúa ambos ajustes resueltos (ship). Evidencia: tests/accesibilidad/resultado.json y capturas finales. La traducción usa datos locales sin compilar plantillas, compatible con CSP MV3. No se marca done. |
