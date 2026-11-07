// Captures every slide as a PNG into the folder given as the first argument.
// Then run: python3 tools/thumbs.py <that folder> assets/img/thumbs
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await p.route('**/stack.js*', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await p.goto('file://' + require('path').resolve(__dirname, '..', 'index.html'));
  await p.addStyleTag({ content: '.stack .slide{position:relative!important;transform:none!important;visibility:visible!important;border-radius:0!important} .stack-dim{display:none} .dots,.progress{display:none!important} *{transition:none!important}' });
  await p.evaluate(() => {
    document.querySelectorAll('[data-reveal],[data-stagger],.display,.mrow,.stages,.timeline,.chart,.devices,[data-tiles],.num').forEach(e => e.classList.add('in'));
    document.querySelectorAll('[data-tiles] span').forEach(t => t.classList.add('on'));
    const d = document.querySelector('.devices'); if (d) d.classList.add('ready');
  });
  for (const s of await p.$$('.slide')) { await s.scrollIntoViewIfNeeded(); await p.waitForTimeout(150); }
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelectorAll('.num').forEach(n => { n.textContent = (+n.dataset.count).toLocaleString('en-US') + (n.dataset.suffix || ''); }));
  const ids = await p.$$eval('.slide', a => a.map(s => s.id));
  for (const id of ids) {
    const el = await p.$('#' + id);
    await el.screenshot({ path: `${out}/th-${id}.png` });
  }
  console.log(ids.join(','));
  await b.close();
})();
