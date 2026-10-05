// Archivos del sitio (T-12): robots.txt, sitemap y llms.txt. Devuelve para cada uno su URL y si se encontró.
// Un 200 que responde HTML se trata como «no encontrado»: muchos sitios devuelven su página 404 con código 200.

import { pedir } from './indexabilidad.js';

const SITEMAPS_HABITUALES = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml'];

// Comprueba si la URL existe y no es una página HTML. Devuelve true, false o null (no se pudo comprobar).
async function existe(url) {
  try {
    let r = await pedir(url, { method: 'HEAD' });
    if (r.status === 405 || r.status === 501) r = await pedir(url, { method: 'GET' });
    if (!r.ok) return false;
    return !/text\/html/i.test(r.headers.get('content-type') || '');
  } catch { return null; }
}

export async function comprobarArchivos(urlPagina) {
  let origen;
  try { origen = new URL(urlPagina).origin; } catch { return []; }

  const robotsUrl = origen + '/robots.txt';
  const llmsUrl = origen + '/llms.txt';
  const [robots, llms] = await Promise.all([existe(robotsUrl), existe(llmsUrl)]);

  // Sitemaps declarados en robots.txt (puede haber varios); si no hay, las rutas habituales
  let declarados = [];
  if (robots) {
    try { declarados = [...(await (await pedir(robotsUrl)).text()).matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map(m => m[1]); } catch { /* sin robots legible */ }
  }
  const candidatos = declarados.length ? declarados : SITEMAPS_HABITUALES.map(r => origen + r);
  let sitemap = { url: candidatos[0], existe: false };
  let sinComprobar = false;
  for (const url of candidatos) {
    const ok = await existe(url);
    if (ok) { sitemap = { url, existe: true, declarado: declarados.length > 0 }; break; }
    if (ok === null) sinComprobar = true;
  }
  if (!sitemap.existe && sinComprobar) sitemap.existe = null;

  return [
    { id: 'robots', etiqueta: 'robots.txt', url: robotsUrl, existe: robots },
    { id: 'sitemap', etiqueta: 'Sitemap', url: sitemap.url, existe: sitemap.existe, nota: sitemap.declarado ? 'declarado en robots.txt' : sitemap.existe ? 'ruta habitual' : '' },
    { id: 'llms', etiqueta: 'llms.txt', url: llmsUrl, existe: llms }
  ];
}
