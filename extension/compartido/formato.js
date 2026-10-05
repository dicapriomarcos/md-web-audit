// Utilidades de formato comunes a todas las Tabs.

export const bytes = n => n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : n >= 1024 ? (n / 1024).toFixed(1) + ' KB' : Math.round(n) + ' B';
export const ms = n => n >= 1000 ? (n / 1000).toFixed(2) + ' s' : Math.round(n) + ' ms';
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Color por nota 0..1 (umbrales de Lighthouse)
export const colorNota = s => s >= 0.9 ? '#0cce6b' : s >= 0.5 ? '#ffa400' : '#ff4e42';

export function dominio(u) {
  try { return new URL(u).host; } catch { return ''; }
}

export function nombre(u) {
  if (u.startsWith('data:')) return 'data: URI';
  try {
    const x = new URL(u);
    const f = decodeURIComponent(x.pathname.split('/').filter(Boolean).pop() || x.host);
    return f + (x.search ? '?…' : '');
  } catch { return u; }
}
