// Registro de Tabs (ADR-001): añadir una Tab nueva = su carpeta en tabs/ + una línea aquí.
// Cada Tab exporta { id, titulo, montar(contenedor, ctx), crearCaptura?(ctx), indicador?(estado) }.
// `indicador` devuelve { texto, tipo, titulo } (o null) y se pinta como insignia en la pestaña del panel.
import velocidad from './velocidad/index.js';
import seo from './seo/index.js';
import consola from './consola/index.js';
import contenido from './contenido/index.js';
import accesibilidad from './accesibilidad/index.js';

export const TABS = [velocidad, seo, consola, contenido, accesibilidad];
