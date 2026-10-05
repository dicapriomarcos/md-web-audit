// Definición de la Tab Velocidad: metadatos, vista (panel) y captura (service worker).
import { montar } from './vista.js';
import { crearCaptura } from './captura.js';

export default { id: 'velocidad', titulo: 'Velocidad', montar, crearCaptura };
