// Definición de la Tab Consola: metadatos, vista (panel), captura (service worker) e indicador de errores.
import { montar, indicador } from './vista.js';
import { crearCaptura } from './captura.js';

export default { id: 'consola', titulo: 'Consola', montar, crearCaptura, indicador };
