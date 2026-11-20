// node tests/e2e.mjs [шлях до MBTI-source] — проходить повний і швидкий тест, звіряє результат з оригінальним підрахунком
import { createRequire } from 'node:module';
import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || '/opt/npm-tools/node_modules/playwright');
const SRC = process.argv[2] || '../mbti-source';
fs.mkdirSync('test-out', { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const reqs = []; ctx.on('request', r => { if (!r.url().startsWith('file:')) reqs.push(r.url()); });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
p.on('dialog', d => d.accept());
const URL = 'file://' + process.cwd() + '/index.html';
await p.goto(URL); await p.screenshot({ path: 'test-out/1-intro.png' });
let seed = 3; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
async function run(quick) {
  await p.click(`[data-act=start][data-q="${quick ? 1 : 0}"]`);
  let i = 0;
  while (await p.evaluate(() => S.view === 'quiz')) {
    const pos = await p.evaluate(() => S.pos);
    await p.click(`.pt[data-v="${Math.floor(rnd() * 7) - 3}"]`);
    await p.waitForFunction(x => S.pos !== x || S.view !== 'quiz', pos);
    if (++i === 10 && !quick) { await p.screenshot({ path: 'test-out/2-q.png' }); await p.reload(); await p.waitForSelector('.qtext'); }
  }
  await p.click('[data-act=finish]'); await p.waitForSelector('.tname');
  return p.evaluate(() => ({ ans: S.ans, full: RES.t.full, n: S.ans.filter(v => v != null).length }));
}
const F = await run(false);
assert.equal(F.n, 91);
await p.screenshot({ path: 'test-out/3-result.png', fullPage: true });
const c = { }; vm.createContext(c);
const core = fs.readFileSync(SRC + '/src/3-core.js', 'utf8');
const grab = n => { const i = core.indexOf(n); return core.slice(i, core.indexOf('\n}\n', i) + 3); };
const line = s => core.split('\n').find(l => l.startsWith(s));
vm.runInContext(fs.readFileSync(SRC + '/src/2-data.js', 'utf8') + '\nconst SKIP=9;\n' + grab('function score(') + line('const pctOf') + '\n' + line('const isFirst') + '\n' + grab('function typeOf(') + `\nthis.T=typeOf(score(${JSON.stringify(F.ans)})).full;`, c);
assert.equal(F.full, c.T); console.log('✓ повний тест:', F.full, '= оригінальний підрахунок, перезавантаження посередині не зламало прогрес');
assert.ok(await p.locator('text=Усі грані характеру').count() && await p.locator('.facet').count() === 19); console.log('✓ 19 граней, функції, опис');
await p.click('[data-act=reset]'); await p.waitForSelector('[data-q="1"]');
const Q = await run(true); assert.equal(Q.n, 30);
assert.ok(await p.locator('text=орієнтовно').count()); await p.screenshot({ path: 'test-out/4-quick.png', fullPage: true });
console.log('✓ швидкий тест: 30 відповідей,', Q.full);
await p.click('[data-act=full]'); await p.waitForSelector('.qtext');
assert.equal(await p.evaluate(() => S.ans.filter(v => v != null).length), 30); console.log('✓ з швидкого до повного — відповіді збережено');
assert.deepEqual(reqs, []); console.log('✓ жодного мережевого запиту');
assert.deepEqual(errs, []); console.log('✓ без помилок JS');
await b.close();
