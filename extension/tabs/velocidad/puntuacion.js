// Score aproximado con las curvas de Lighthouse (p10, mediana). Sin Speed Index: pesos renormalizados.

const CURVAS = {
  mobile:  { fcp: [1800, 3000], lcp: [2500, 4000], tbt: [200, 600], cls: [0.1, 0.25] },
  desktop: { fcp: [934, 1600],  lcp: [1200, 2400], tbt: [150, 350], cls: [0.1, 0.25] }
};
const PESOS = { fcp: 10, lcp: 25, tbt: 30, cls: 25 };

function erf(x) {
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
}

function puntuarLog(v, p10, mediana) {
  if (v <= 0) return 1;
  const xl = Math.log(v / mediana), pl = -Math.log(p10 / mediana);
  return Math.min(1, Math.max(0, (1 - erf(xl * 0.9061938024368232 / pl)) / 2));
}

// m = { fcp, lcp, tbt, cls }; perfil = 'mobile' | 'desktop'. Devuelve null si aún no hay FCP.
export function puntuar(m, perfil) {
  if (!m.fcp) return null;
  const c = CURVAS[perfil];
  const partes = Object.fromEntries(Object.keys(PESOS).map(k => [k, puntuarLog(m[k], ...c[k])]));
  const total = Object.keys(PESOS).reduce((s, k) => s + partes[k] * PESOS[k], 0) / 90;
  return { total, ...partes };
}

// CLS: ventanas de sesión (hueco 1 s, máximo 5 s). shifts = [[inicio, valor], ...]
export function cls(shifts) {
  let mejor = 0, c = 0, inicio = 0, ultimo = 0;
  for (const [t, v] of shifts) {
    if (c && (t - ultimo > 1000 || t - inicio > 5000)) { mejor = Math.max(mejor, c); c = 0; }
    if (!c) inicio = t;
    c += v; ultimo = t;
  }
  return Math.max(mejor, c);
}

// TBT: tiempo de las tareas largas que pasa de 50 ms, desde el FCP. tareas = [[inicio, duración], ...]
export function tbt(tareas, fcp) {
  return tareas.reduce((s, [st, du]) => (st + du > fcp ? s + Math.max(0, du - 50) : s), 0);
}
