// Definición de la Tab Contenido (SPEC-004): metadatos, vista (panel) y captura (service worker).
import { montar, indicador } from './vista.js';
import { crearCaptura } from './captura.js';

export default { id: 'contenido', titulo: 'Contenido', montar, crearCaptura, indicador };
