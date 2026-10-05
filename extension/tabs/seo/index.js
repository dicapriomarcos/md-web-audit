// Definición de la Tab SEO: metadatos, vista (panel) y seguimiento de pestaña + resaltado (service worker).
import { montar } from './vista.js';
import { crearCaptura } from './captura.js';

export default { id: 'seo', titulo: 'SEO', montar, crearCaptura };
