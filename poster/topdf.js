// usage: node topdf.js <html> <pdf> <preview.png>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [htmlPath, pdfPath, pngPath] = process.argv.slice(2);
  const b = await chromium.launch();
  const W = 5964, H = 4220;
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.goto('file://' + path.resolve(htmlPath));
  await p.evaluate(() => document.fonts.ready);
  console.log('fonts ok:', await p.evaluate(() => [document.fonts.check('700 20px Carlito'), document.fonts.check('400 20px Carlito'), document.fonts.check('800 20px Inter')]));
  await p.waitForFunction(() => document.querySelector('img').complete);
  if (pngPath) await p.screenshot({ path: pngPath });
  // A1 landscape: 841 mm wide; height keeps the poster's proportions (= 595 mm)
  const wmm = 841, hmm = wmm * H / W;
  await p.pdf({ path: pdfPath, width: `${wmm}mm`, height: `${hmm.toFixed(2)}mm`, printBackground: true,
                margin: { top: 0, right: 0, bottom: 0, left: 0 }, scale: (wmm / 25.4 * 96) / W, pageRanges: '1' });
  await b.close();
})();
