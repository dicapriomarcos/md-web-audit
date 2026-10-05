// Análisis del DOM de la página (T-01). `analizarPagina` se inyecta con chrome.scripting.executeScript,
// así que debe ser autocontenida: no puede usar nada de fuera de la función.

export function analizarPagina() {
  const limpiar = s => (s || '').replace(/\s+/g, ' ').trim();
  const contenido = sel => limpiar(document.querySelector(sel)?.getAttribute('content')) || null;
  const absoluta = u => { try { return new URL(u, document.baseURI).href; } catch { return u; } };

  const og = contenido('meta[property="og:image" i], meta[property="og:image:url" i], meta[name="og:image" i]');
  const tw = contenido('meta[name="twitter:image" i], meta[property="twitter:image" i], meta[name="twitter:image:src" i]');
  const canonical = document.querySelector('link[rel~="canonical" i]');

  return {
    url: location.href,
    title: limpiar(document.title),
    description: contenido('meta[name="description" i]') || '',
    // Todas las metas que afectan a Googlebot: robots (genérica) y googlebot (específica)
    robots: [...document.querySelectorAll('meta[name="robots" i], meta[name="googlebot" i]')]
      .map(m => ({ nombre: m.getAttribute('name').toLowerCase(), contenido: limpiar(m.getAttribute('content')) })),
    canonical: canonical ? (canonical.href || null) : null,
    ogImage: og ? absoluta(og) : null,
    twitterImage: tw ? absoluta(tw) : null,
    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({
      nivel: Number(h.tagName[1]),
      texto: limpiar(h.innerText || h.textContent).slice(0, 200)
    })),
    articles: document.querySelectorAll('article').length
  };
}
