# ADR-002 · Motor local de accesibilidad

| Campo | Valor |
|---|---|
| Estado | `proposed` |
| Autor | Codex |
| Propietario | Marcos |
| Creada | 2026-10-10 |
| Actualizada | 2026-10-10 |
| Relacionadas | SPEC-007, ADR-001 |

## 1. Contexto

Nombres accesibles, contraste y tamaño de objetivos requieren reglas con excepciones. El proyecto usa JavaScript sin build ni dependencias y procesa los datos localmente; incorporar un motor exige documentar una excepción a la base de dependencias.

## 2. Decisión

Se propone incluir axe-core con versión fijada, procedencia y licencia en `extension/vendor/axe-core/`, ejecutado mediante `chrome.scripting` en el mundo aislado del documento principal. Se mantiene JavaScript sin build y sin código remoto. La excepción afecta exclusivamente al motor de accesibilidad.

Se usan las reglas WCAG A/AA disponibles hasta 2.2 y buenas prácticas pertinentes. Los resultados incompletos requieren revisión manual; saltos de encabezados y `tabindex` positivos son recomendaciones. No se calcula una puntuación de conformidad.

## 3. Alternativas consideradas

| Alternativa | Por qué se descarta |
|---|---|
| Reglas propias para todo | Mayor mantenimiento y riesgo de falsos positivos. |
| Motor desde CDN | Añade código remoto y dependencia de red. |
| Servicio externo | Rompe el procesamiento local. |

## 4. Consecuencias

- Motor especializado con resultados incompletos explícitos.
- Mayor tamaño de paquete y mantenimiento de versión y licencia.
- Sin proceso de compilación ni cambios en las demás pestañas.
- Cobertura inicial limitada al documento principal; se informa en el panel.

## 5. Reglas para el código

- Fijar versión y documentar fuente y licencia; no usar CDN.
- No enviar DOM, URL ni resultados a servidores.
- Separar problemas, revisión manual y recomendaciones.
- No etiquetar buenas prácticas como infracciones WCAG sin una regla que lo justifique.
- Excluir la capa de resaltado del análisis y retirarla al detener la captura.
- Verificar clasificación, privacidad y limpieza con los criterios de SPEC-007.

Fuentes: [axe-core](https://github.com/dequelabs/axe-core), [API](https://www.deque.com/axe/core-documentation/api-documentation/).

## Historial

| Fecha | Estado | Nota |
|---|---|---|
| 2026-10-10 | `proposed` | Propuesta para SPEC-007; pendiente de aceptación. |
| 2026-10-10 | `proposed` | La persona aprobó implementar SPEC-007, cuyo alcance incluye este motor local. La implementación sigue ese alcance; no se cambia el estado formal del ADR por cuenta del agente. |
