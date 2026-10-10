// Módulo de accesibilidad: la captura vive en el service worker y la vista en el panel.
import { crearCaptura } from './captura.js';
import { montar, indicador } from './vista.js';
export default { id: 'accesibilidad', titulo: 'Accesibilidad', crearCaptura, montar, indicador };
