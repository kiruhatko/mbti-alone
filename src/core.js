/* ═════════════ ПІДРАХУНОК ═════════════
   Скопійовано без змін з MBTI-source/src/3-core.js (score, pctOf, isFirst, typeOf, pole, altTypes):
   результат рахується рівно так, як у «Дзеркалі MBTI». */
const SKIP = 9;
function score(ans) {
  const ax = {}, fc = {};
  AXES.forEach(a => ax[a.id] = { sum: 0, n: 0 });
  FACETS.forEach(f => fc[f.id] = { sum: 0, n: 0 });
  QUESTIONS.forEach((q, i) => {
    const v = ans[i]; if (v == null || v === SKIP) return;
    ax[q.axis].sum += v * q.key; ax[q.axis].n++;
    fc[q.facet].sum += v * q.key; fc[q.facet].n++;
  });
  const out = { ax: {}, fc: {}, n: {} };
  for (const k in ax) { out.ax[k] = ax[k].n ? ax[k].sum / (3 * ax[k].n) : 0; out.n[k] = ax[k].n; }
  for (const k in fc) { out.fc[k] = fc[k].n ? fc[k].sum / (3 * fc[k].n) : 0; out.n[k] = fc[k].n; }
  return out;
}
const pctOf = s => Math.max(0, Math.min(100, 50 + Math.sign(s) * Math.round(50 * Math.abs(s))));
const isFirst = s => pctOf(s) > 50;
function typeOf(sc) {
  let code = '';
  for (const ax of AXES.slice(0, 4)) code += isFirst(sc.ax[ax.id]) ? ax.a.k : ax.b.k;
  const id = isFirst(sc.ax.AT) ? 'A' : 'T';
  return { code, id, full: code + '-' + id };
}
function pole(ax, s) {
  const first = isFirst(s), p = pctOf(s);
  return { p: ax[first ? 'a' : 'b'], pct: first ? p : 100 - p, first };
}
function altTypes(sc, lim) {
  const base = typeOf(sc).code.split('');
  return AXES.slice(0, 4).map((ax, i) => ({ i, ax, d: Math.abs(sc.ax[ax.id]) }))
    .filter(o => o.d < (lim || 0.2)).sort((x, y) => x.d - y.d).slice(0, 2)
    .map(o => { const c = base.slice(); c[o.i] = isFirst(sc.ax[o.ax.id]) ? o.ax.b.k : o.ax.a.k; return c.join(''); });
}

/* ═════════════ СПІЛЬНЕ: кодування, шифрування, звіт ═════════════ */
const SCALE = [-3, -2, -1, 0, 1, 2, 3];
const SCALE_LABEL = { '-3': 'Зовсім ні', '-2': 'Ні', '-1': 'Скоріше ні', '0': 'Нейтрально', '1': 'Скоріше так', '2': 'Так', '3': 'Цілком так' };
const sgn = v => v > 0 ? '+' + v : v < 0 ? '−' + (-v) : '0';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const encA = a => a.map(v => v == null ? '-' : String(v + 3)).join('');
const decA = s => String(s).split('').map(c => c === '-' ? null : +c - 3);
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* приватний режим */ } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { /* приватний режим */ } };

