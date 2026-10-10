# Features creadas solo con descripción

> Parte de la skill `sdd` — índice en [`SKILL.md`](SKILL.md).

MD SDD Hub permite guardar solo el problema: ID reservado, título «Sin título», nombre provisional
`SPEC-NNN-sin-titulo.md`, estado `backlog`, metadatos, descripción original e historial. No hay tareas ficticias.
La marca técnica `<!-- sdd-hub:needs-planning -->` identifica estas capturas; no depende del título ni de los avisos.
En specs de carpeta, la marca está en `spec.md` o `requirements.md` y el nombre provisional es el de la carpeta.

## Al empezar cada conversación

Lee `.sdd.json` si existe y busca la marca en las carpetas de features configuradas (`dirs.feature` o `specsDir`).
Si no las hay, revisa `docs/specs`, `specs`, `.specify/specs`, `.kiro/specs` y `openspec/changes` y las features
detectables en `docs/`. Excluye plantillas, registros y documentos cerrados o dentro de `archive`, `archivo`,
`hecho` o `done`. Hazlo aunque no exista `.sdd/review/` o los avisos estén desactivados.

Si hay capturas pendientes, avisa brevemente y prepara su planificación sin esperar a que la persona te dé
sus IDs. Si te pide otra cosa urgente o aplazarlas, atiende esa petición y anota las pendientes en el estado
de sesión; no pierdas la petición actual. Si hay información imprescindible que no puedes deducir del código,
pregunta solo lo necesario y deja documentado el bloqueo, sin inventar requisitos.

## Convertir la descripción en una spec

1. Lee la descripción, las decisiones vigentes y solo las reglas SDD que correspondan: formato, estados,
   registro y la plantilla del proyecto (`000-TEMPLATE.md`) o de la skill.
2. Conserva el ID y la descripción original, sin sustituirla por tu interpretación. Asigna un título claro
   y un slug en español, sin tildes ni eñes. Renombra el archivo o la carpeta conservando su estructura;
   comprueba antes que el destino no existe. No crees otra spec ni reutilices el ID.
3. Actualiza los enlaces al archivo o carpeta renombrados, el registro y las rutas de los avisos de revisión
   pendientes que lo referencien, para que no queden enlaces rotos. Conserva historial, fechas y autor.
4. Pasa a `planning` si el proyecto lo usa. Completa resumen, problema, objetivos, alcance, requisitos
   `FR-NN`, criterios `AC-NN`, diseño técnico, tareas pequeñas `T-NN`, riesgos y preguntas siguiendo la plantilla.
   Las casillas nuevas quedan sin marcar. No programes durante esta preparación.
5. Cuando título, slug y planificación estén completos, retira la marca, pasa a `awaiting-approval` y pide
   aprobación. Actualiza fecha, historial y registro. Si hay un bloqueo, conserva la marca y `planning`
   (o `backlog` si se omite `planning`) para retomarlo en la próxima conversación.

Respeta `skipStatuses` de `.sdd.json`. Si se omite `awaiting-approval`, solicita aprobación manteniendo el
último estado permitido anterior al desarrollo; omitir estados nunca equivale a aprobación.
Solo con aprobación expresa puedes pasar a `in-progress` e implementar. Registra el resultado en el estado de sesión.
