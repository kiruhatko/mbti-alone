/* ═════════════ ТЕСТ ДЛЯ ОДНОГО ═════════════
   Людина проходить сама й отримує повний результат «Дзеркала MBTI».
   Усе рахується в браузері; відповіді лежать лише в localStorage цього пристрою й нікуди не надсилаються. */
const ST_KEY = 'mbti-alone.v1';
const app = document.getElementById('app');
const blank = () => ({ quick: false, pos: 0, ans: Array(NQ).fill(null), view: 'intro', done: null });
let S = (() => {
  try {
    const x = JSON.parse(lsGet(ST_KEY));
    if (x && x.qh === QH && Array.isArray(x.ans) && x.ans.length === NQ) return x;
  } catch (e) { /* пошкоджений стан */ }
  return null;
})() || blank();
S.qh = QH;
const save = () => lsSet(ST_KEY, JSON.stringify(S));
const list = () => S.quick ? ORDER.filter(qi => QUICK_SET.has(qi)) : ORDER;
const total = () => list().length;
const answered = () => list().filter(qi => S.ans[qi] != null).length;
const firstGap = () => { const i = list().findIndex(qi => S.ans[qi] == null); return i < 0 ? null : i; };
const borderLim = () => S.quick ? 0.25 : 0.12;      // як у MBTI-source/src/5-result.js
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; };

function render() {
  window.scrollTo(0, 0);
  ({ intro, quiz, confirm: confirmView, result })[S.view]();
}

function intro() {
  const n = answered(), started = S.ans.some(v => v != null) && !S.done;
  app.innerHTML = `<section class="card glass center">
    <div class="orb"></div>
    <h1>Дзеркало MBTI</h1>
    <p class="lead">Тест на тип особистості. Проходиш сам, результат повний і безкоштовний: тип, 5 шкал, 19 граней характеру, когнітивні функції й опис типу.</p>
    <ul class="facts">
      <li>Оцінюй твердження від <b>−3</b> («зовсім не про мене») до <b>+3</b> («точно про мене»)</li>
      <li>Відповідай так, як є зазвичай, а не як «правильно»</li>
      <li>Прогрес зберігається: можна закрити й продовжити</li>
      <li>Відповіді лишаються лише на твоєму пристрої й нікуди не надсилаються</li>
    </ul>
    ${started ? `<button class="btn primary big" data-act="resume">Продовжити (${n} з ${total()})</button>
      <button class="btn ghost" data-act="reset">Почати спочатку</button>`
    : `<button class="btn primary big" data-act="start" data-q="0">Повний тест · ${NQ} тверджень<small>12–15 хв · точніше</small></button>
      <button class="btn big" data-act="start" data-q="1">Швидкий · ${QUICK.length} тверджень<small>5 хв · орієнтовно</small></button>`}
  </section>`;
}

function quiz() {
  const L = list(), qi = L[S.pos], q = QUESTIONS[qi], cur = S.ans[qi], n = answered(), T = L.length;
  app.innerHTML = `<section class="quiz">
    <div class="prog"><i style="width:${n / T * 100}%"></i></div>
    <div class="card glass qcard">
      <div class="qmeta"><span>${S.pos + 1} з ${T}${S.quick ? ' · швидкий' : ''}</span><span>${Math.round(n / T * 100)}%</span></div>
      <div class="qtext">${esc(q.self)}</div>
      ${S.pos === 0 && n === 0 ? '<p class="fine">−3 — зовсім не про мене, 0 — нейтрально, +3 — точно про мене.</p>' : ''}
      <div class="scale" role="radiogroup" aria-label="Оцінка від −3 до +3">
        ${SCALE.map(v => `<button class="pt ${v < 0 ? 'neg' : v > 0 ? 'pos' : 'zero'} ${cur === v ? 'sel' : ''}" data-act="ans" data-v="${v}" role="radio" aria-checked="${cur === v}" aria-label="${SCALE_LABEL[v]}">${sgn(v)}</button>`).join('')}
      </div>
      <div class="scale-cap"><span>Зовсім ні</span><span>Нейтрально</span><span>Цілком так</span></div>
    </div>
    <div class="row spread"><button class="btn ghost" data-act="prev" ${S.pos === 0 ? 'disabled' : ''}>← Назад</button>
      ${cur != null && S.pos < T - 1 ? '<button class="btn ghost" data-act="next">Далі →</button>' : '<button class="btn ghost" data-act="home">Пауза</button>'}</div>
  </section>`;
}

function confirmView() {
  app.innerHTML = `<section class="card glass center">
    <div class="orb"></div>
    <h1>Готово!</h1>
    <p class="lead">Усі ${total()} відповідей є. Можна ще раз переглянути або одразу дивитися результат.</p>
    <button class="btn primary big" data-act="finish">Показати результат</button>
    <button class="btn ghost" data-act="back-to-quiz">← До питань</button>
  </section>`;
}

/* ───── результат: ті самі блоки й тексти, що в «Дзеркалі MBTI» (самооцінка, без друзів) ───── */
function result() {
  const sc = score(S.quick ? S.ans.map((v, i) => QUICK_SET.has(i) ? v : null) : S.ans);
  const t = typeOf(sc), info = TYPES[t.code], g = GROUPS[groupOf(t.code)];
  const alts = altTypes(sc, borderLim());
  const tiles = AXES.slice(0, 4).map(ax => { const po = pole(ax, sc.ax[ax.id]);
    return `<div class="tile" style="--c1:${ax.c1};--c2:${ax.c2}"><div class="l">${po.p.k}</div><small>${po.p.name}</small><em>${po.pct}%</em></div>`; }).join('');
  const at = pole(AXES[4], sc.ax.AT);
  const axes = AXES.map(ax => {
    const p = pctOf(sc.ax[ax.id]), domA = p > 50, dp = domA ? p : 100 - p, dom = domA ? ax.a : ax.b;
    const strength = dp < 55 ? 'майже порівну' : dp < 65 ? 'помірно' : dp < 78 ? 'виразно' : 'яскраво виражено';
    return `<div class="card glass axcard">
      <div class="axhead"><span class="axt">${ax.title}</span><span class="fine">${ax.hint}</span></div>
      <div class="axhead big"><span class="${domA ? 'win' : ''}"><b>${ax.a.k}</b> ${ax.a.name} ${p}%</span><span class="${domA ? '' : 'win'}">${100 - p}% ${ax.b.name} <b>${ax.b.k}</b></span></div>
      <div class="track"><i style="left:0;width:${p}%;background:linear-gradient(90deg,${ax.c1},${ax.c2})"></i></div>
      <p class="fine"><b style="color:var(--ink)">${dom.name}</b> — ${strength} (${dp}%).${sc.n[ax.id] < 3 ? ' <i>Мало даних для цієї шкали.</i>' : ''}</p>
    </div>`;
  }).join('');
  const border = AXES.slice(0, 4).filter(ax => Math.abs(sc.ax[ax.id]) < borderLim())
    .map(ax => `<li>${ax.a.name} / ${ax.b.name} (${pctOf(sc.ax[ax.id])}% / ${100 - pctOf(sc.ax[ax.id])}%)</li>`);
  const facets = S.quick
    ? `<p class="fine">Грані доступні в повному тесті (${NQ} тверджень): у швидкому на кожну грань припадає лише 1–2 питання, тож показувати їх було б ненадійно.</p>`
    : AXES.map(ax => `<div class="fgroup"><h4 style="--c1:${ax.c1};--c2:${ax.c2}"><i></i>${ax.title} · ${ax.a.k}/${ax.b.k}</h4>` +
        FACETS.filter(f => f.axis === ax.id).map(f => { const p = pctOf(sc.fc[f.id]);
          return `<div class="facet"><div class="axhead"><span class="${p > 50 ? 'win' : ''}">${f.a}</span><span class="axt">${f.name}</span><span class="${p < 50 ? 'win' : ''}">${f.b}</span></div>
            <div class="track thin"><i style="left:0;width:${p}%;background:linear-gradient(90deg,${ax.c1},${ax.c2})"></i></div><div class="fine center-t">${p}% / ${100 - p}%</div></div>`; }).join('') + '</div>').join('');
  const fns = STACK[t.code].split(' ').map((f, i) => `<div class="fn"><small>${STACK_ROLES[i][0]}</small><div class="code" style="color:${g.c}">${f}</div><b>${FN[f].n}</b><p class="fine">${FN[f].d}</p></div>`).join('');

  app.innerHTML = `<section class="card glass center hero" style="--ac:${g.c}">
      <div class="eyebrow">Результат${S.quick ? ' · швидкий тест' : ''}</div>
      <div class="tiles">${tiles}<div class="tile sfx" style="--c1:${AXES[4].c1};--c2:${AXES[4].c2}"><div class="l">-${at.p.k}</div><small>${at.p.name}</small><em>${at.pct}%</em></div></div>
      <h1 class="tname">${info.n}</h1>
      <p class="lead">${info.tag}</p>
      <div class="chips"><span class="chip"><i class="dot" style="background:${g.c}"></i>${g.n}</span><span class="chip">${t.full}</span>
        ${S.quick ? '<span class="chip warn">⚡ орієнтовно</span>' : ''}
        ${alts.length ? `<span class="chip">Може бути також: ${alts.join(' · ')}</span>` : ''}</div>
    </section>
    ${axes}
    ${border.length ? `<section class="card glass"><h2>Де тип може змінитись</h2><p class="fine">Тип тут може «гойдатися» залежно від ситуації або від настрою на момент тесту.</p><ul class="facts">${border.join('')}</ul></section>` : ''}
    <section class="card glass"><h2>Усі грані характеру</h2><p class="fine">Дрібніші шкали всередині кожної осі.</p>${facets}</section>
    <section class="card glass"><h2>Когнітивні функції</h2><p class="fine">За теорією MBTI типовий «стек» для ${t.code}: від найсильнішої функції до найслабшої. Це модель, а не вимір.</p><div class="fns">${fns}</div></section>
    <section class="card glass"><h2>${t.code} · ${info.n}</h2><p class="lead">${info.d}</p>
      <div class="two"><div><h3>Сильні сторони</h3><ul class="facts">${info.pro.map(x => `<li>${x}</li>`).join('')}</ul></div>
        <div><h3>На що звернути увагу</h3><ul class="facts">${info.con.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
      <h3>Як цей тип поводиться в дружбі</h3><p class="lead">${info.fr}</p></section>
    <section class="card glass stack">
      ${navigator.share ? '<button class="btn primary" data-act="share">Поділитися результатом</button>' : ''}
      <button class="btn" data-act="copy">Скопіювати результат</button>
      ${S.quick ? '<button class="btn" data-act="full">Пройти повний тест (відповіді збережуться)</button>' : ''}
      <button class="btn ghost" data-act="reset">Пройти заново</button>
      <p class="fine center-t" id="msg">Відповіді збережено лише на цьому пристрої.</p>
    </section>`;
  RES = { t, info, sc };
}
let RES = null;
function shareText() {
  const { t, info, sc } = RES;
  return `Мій тип за «Дзеркалом MBTI»: ${t.full} — ${info.n}\n${info.tag}\n` +
    AXES.map(ax => { const po = pole(ax, sc.ax[ax.id]); return `${ax.title}: ${po.p.name} ${po.pct}%`; }).join('\n') + '\n\n' + location.origin + location.pathname;
}

/* ───── дії ───── */
let advT = null;
function answer(v) {
  const qi = list()[S.pos];
  S.ans[qi] = v; save();
  document.querySelectorAll('.pt').forEach(b => { const on = +b.dataset.v === v; b.classList.toggle('sel', on); b.setAttribute('aria-checked', on); });
  clearTimeout(advT); advT = setTimeout(advance, 260);
}
function advance() {
  if (S.pos < total() - 1) S.pos++;
  else { const g = firstGap(); if (g == null) S.view = 'confirm'; else S.pos = g; }
  save(); render();
}
const ACT = {
  start(el) { Object.assign(S, blank(), { qh: QH, quick: el.dataset.q === '1', view: 'quiz' }); save(); render(); },
  resume() { const g = firstGap(); S.view = g == null ? 'confirm' : 'quiz'; if (g != null) S.pos = g; save(); render(); },
  reset() { if (!confirm('Почати тест спочатку? Поточні відповіді буде стерто.')) return; S = blank(); S.qh = QH; save(); render(); },
  ans(el) { answer(+el.dataset.v); },
  prev() { clearTimeout(advT); if (S.pos > 0) S.pos--; save(); render(); },
  next() { clearTimeout(advT); advance(); },
  home() { clearTimeout(advT); S.view = 'intro'; save(); render(); },
  'back-to-quiz'() { S.view = 'quiz'; S.pos = total() - 1; save(); render(); },
  finish() { S.done = Date.now(); S.view = 'result'; save(); render(); },
  full() { S.quick = false; S.done = null; const g = firstGap(); S.pos = g || 0; S.view = 'quiz'; save(); render(); },
  async share() { try { await navigator.share({ title: 'Мій тип MBTI', text: shareText() }); } catch (e) { /* скасовано */ } },
  async copy() {
    const m = document.getElementById('msg');
    try { await navigator.clipboard.writeText(shareText()); m.textContent = 'Скопійовано ✓'; }
    catch (e) { m.innerHTML = '<textarea readonly class="code">' + esc(shareText()) + '</textarea>'; }
  },
};
app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.act]; if (f) f(el);
});
document.addEventListener('keydown', e => {
  if (S.view !== 'quiz' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key >= '1' && e.key <= '7') answer(+e.key - 4);
  else if (e.key === 'ArrowLeft' && S.pos > 0) ACT.prev();
});
render();
