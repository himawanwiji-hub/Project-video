#!/usr/bin/env node
// Renders video/scene.html frame by frame in headless Chromium and encodes it to MP4 with ffmpeg.
//
//   node video/render.js                              -> output/fisika-3d-soal-2-dan-4.mp4
//   node video/render.js --start 0 --end 10 --out x.mp4
//   node video/render.js --stills 3,12,40             -> PNG stills in output/stills/
//   node video/render.js --page video/fasa.html --out output/arus-1-fasa-vs-3-fasa.mp4
//   node video/render.js --page video-03-ac-short/scene.html --width 1080 --height 1920 --out x.mp4   (9:16)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const arg = (name, def) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : def; };
const FPS = parseFloat(arg('fps', '30'));
const OUT = path.resolve(ROOT, arg('out', 'output/fisika-3d-soal-2-dan-4.mp4'));
const STILLS = arg('stills', null);
const PAGE = arg('page', 'video/scene.html');
const VW = parseInt(arg('width', '1920')), VH = parseInt(arg('height', '1080'));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[pageerror]', e));
  await page.goto(`http://127.0.0.1:${port}/${PAGE}?render=1`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  const duration = await page.evaluate(() => window.DURATION);

  if (STILLS) {
    const dir = path.join(ROOT, 'output', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of STILLS.split(',').map(Number)) {
      await page.evaluate((t) => window.renderAt(t), t);
      const file = path.join(dir, `${path.basename(PAGE, '.html')}_${String(t).replace('.', '_')}.png`);
      await page.screenshot({ path: file });
      console.log('still', file);
    }
    await browser.close(); srv.close(); return;
  }

  const start = parseFloat(arg('start', '0'));
  const end = Math.min(parseFloat(arg('end', String(duration))), duration);
  const f0 = Math.round(start * FPS), f1 = Math.round(end * FPS);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', OUT],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));

  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate((t) => window.renderAt(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 60 === 0) {
      const el = (Date.now() - t0) / 1000, k = (f - f0 + 1) / (f1 - f0);
      console.log(`frame ${f - f0 + 1}/${f1 - f0}  ${(el / (f - f0 + 1)).toFixed(2)} s/frame  eta ${Math.round(el / k - el)} s`);
    }
  }
  ff.stdin.end();
  await done;
  await browser.close(); srv.close();
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
