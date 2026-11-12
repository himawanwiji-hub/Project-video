// Nomor 1 — Harbor Flow: Ship to Shore | 15 s | 3 scene | 16:9 | Canvas API murni

var HF_C30 = 0.8660254037844386;
var HF_TAU = Math.PI * 2;
var HF_FONT = '"Inter","Montserrat","Segoe UI","Helvetica Neue",Arial,sans-serif';
var HF_DATA = null;

function hfClamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function hfSmooth(a, b, v) { var x = hfClamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
function hfEaseOut(x) { x = hfClamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
function hfEaseIn(x) { x = hfClamp(x, 0, 1); return x * x * x; }
function hfEaseInOut(x) { x = hfClamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function hfHash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function hfFrac(v) { return v - Math.floor(v); }
function hfLerp(a, b, k) { return a + (b - a) * k; }

function hfShade(hex, f) {
  var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
}
function hfTriad(hex) { return [hfShade(hex, 0.18), hex, hfShade(hex, -0.22)]; }

function hfP(V, x, y, z) {
  return [V.cx + (x - y) * HF_C30 * V.s, V.cy + (x + y) * 0.5 * V.s - z * V.s];
}

function hfPoly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function hfRect(ctx, V, x, y, z, w, d) {
  hfPoly(ctx, [hfP(V, x, y, z), hfP(V, x + w, y, z), hfP(V, x + w, y + d, z), hfP(V, x, y + d, z)]);
}

function hfBox(ctx, V, x, y, z, w, d, h, tri, stroke, lw) {
  var a = hfP(V, x, y, z + h), b = hfP(V, x + w, y, z + h), c = hfP(V, x + w, y + d, z + h), e = hfP(V, x, y + d, z + h);
  var f = hfP(V, x, y + d, z), g = hfP(V, x + w, y + d, z), k = hfP(V, x + w, y, z);
  ctx.fillStyle = tri[1]; hfPoly(ctx, [e, c, g, f]); ctx.fill();
  ctx.fillStyle = tri[2]; hfPoly(ctx, [c, b, k, g]); ctx.fill();
  ctx.fillStyle = tri[0]; hfPoly(ctx, [a, b, c, e]); ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(k[0], k[1]); ctx.lineTo(g[0], g[1]);
    ctx.lineTo(f[0], f[1]); ctx.lineTo(e[0], e[1]); ctx.closePath();
    ctx.moveTo(e[0], e[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(b[0], b[1]);
    ctx.moveTo(c[0], c[1]); ctx.lineTo(g[0], g[1]);
    ctx.stroke();
  }
}

function hfPrism(ctx, V, poly, z0, z1, tri, mid, stroke, lw, skipTop) {
  var n = poly.length, area = 0, i;
  for (i = 0; i < n; i++) { var p = poly[i], q = poly[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
  var sgn = area > 0 ? 1 : -1;
  for (i = 0; i < n; i++) {
    var a = poly[i], b = poly[(i + 1) % n];
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var nx = sgn * dy, ny = -sgn * dx;
    if (nx + ny <= 0.0001) continue;
    var col = nx > ny * 1.6 ? tri[2] : ny > nx * 1.6 ? tri[1] : mid;
    ctx.fillStyle = col;
    hfPoly(ctx, [hfP(V, a[0], a[1], z0), hfP(V, b[0], b[1], z0), hfP(V, b[0], b[1], z1), hfP(V, a[0], a[1], z1)]);
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  if (!skipTop) {
    var top = [];
    for (i = 0; i < n; i++) top.push(hfP(V, poly[i][0], poly[i][1], z1));
    ctx.fillStyle = tri[0]; hfPoly(ctx, top); ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
}

function hfCyl(ctx, V, x, y, z, r, h, top, side, stroke, lw) {
  var b = hfP(V, x, y, z), t = hfP(V, x, y, z + h);
  var rx = r * V.s * 1.2247, ry = r * V.s * 0.7071;
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(b[0] - rx, t[1]); ctx.lineTo(b[0] - rx, b[1]);
  ctx.ellipse(b[0], b[1], rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(b[0] + rx, t[1]); ctx.closePath(); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.fillStyle = top;
  ctx.beginPath(); ctx.ellipse(t[0], t[1], rx, ry, 0, 0, HF_TAU); ctx.fill();
  if (stroke) ctx.stroke();
}

function hfRR(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

function hfBuild() {
  var pal = ['#2BB3A3', '#F2B430', '#F07A3A', '#E9573F', '#3E7CB1', '#EFE6D6', '#2F333B'];
  var tris = pal.map(hfTriad);
  var ship = [];
  for (var b = 0; b < 7; b++) {
    for (var r = 0; r < 5; r++) {
      var n = 1 + Math.floor(hfHash(b * 11 + r * 3 + 1) * 3);
      if ((b === 1 || b === 5) && n < 2) n = 2;
      for (var k = 0; k < n; k++) ship.push({ b: b, r: r, k: k, top: k === n - 1, c: Math.floor(hfHash(b * 7 + r * 13 + k * 5) * 6) });
    }
  }
  var yard = [];
  for (var yb = 0; yb < 15; yb++) {
    for (var yr = 0; yr < 9; yr++) {
      if (yr === 4) continue;
      var x0 = -8.4 + yr * 0.58, y0 = -9.0 + yb * 1.1;
      if (y0 > 3.2) continue;
      var nn = 1 + Math.floor(hfHash(yb * 17 + yr * 5 + 3) * 4);
      for (var kk = 0; kk < nn; kk++) yard.push({ x: x0, y: y0, k: kk, c: Math.floor(hfHash(yb * 3 + yr * 19 + kk * 7) * 7) });
    }
  }
  yard.sort(function (a, b2) { return (a.x + a.y) - (b2.x + b2.y) || a.k - b2.k; });
  var clouds = [];
  for (var c = 0; c < 5; c++) clouds.push({ y: 0.08 + hfHash(c * 3.1) * 0.3, off: hfHash(c * 7.7), sc: 0.7 + hfHash(c * 1.9) * 0.6 });
  return { tris: tris, ship: ship, yard: yard, clouds: clouds };
}

function draw(ctx, time, width, height) {
  var t = time;
  var duration = 15;
  var sceneCount = 3;
  var loopT = ((t % duration) + duration) % duration;
  var sceneDuration = duration / sceneCount;
  var currentScene = Math.floor(loopT / sceneDuration);
  var sceneProgress = (loopT % sceneDuration) / sceneDuration;
  if (!HF_DATA) HF_DATA = hfBuild();
  var D = HF_DATA;

  var minSide = Math.min(width, height);
  var u = minSide / 1080;
  var lw = 1.3 * u;
  var ph = loopT / duration;
  var INK = '#1F2228';

  var s = Math.min(width / 33, height / 18.5);
  var V = { cx: width * 0.54, cy: height * 0.56, s: s };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.lineCap = 'round';

  ctx.fillStyle = '#F6EFE3';
  ctx.fillRect(0, 0, width, height);
  var glow = ctx.createRadialGradient(width * 0.62, height * 0.35, 0, width * 0.62, height * 0.35, Math.max(width, height) * 0.7);
  glow.addColorStop(0, 'rgba(255,214,170,0.45)');
  glow.addColorStop(1, 'rgba(255,214,170,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (var ci = 0; ci < D.clouds.length; ci++) {
    var cl = D.clouds[ci];
    var cx = (hfFrac(cl.off + ph) * 1.4 - 0.2) * width, cy = cl.y * height, cs = minSide * 0.05 * cl.sc;
    hfRR(ctx, cx - cs * 2, cy, cs * 4, cs * 0.9, cs * 0.45); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - cs * 0.6, cy + cs * 0.1, cs * 0.75, 0, HF_TAU); ctx.arc(cx + cs * 0.5, cy + cs * 0.2, cs * 0.6, 0, HF_TAU); ctx.fill();
  }

  var ys;
  if (loopT < 12.6) ys = 32 * (1 - hfEaseOut(loopT / 4.2));
  else ys = -32 * hfEaseIn((loopT - 12.6) / 2.4);
  var shipSpeed = loopT < 4.2 ? 1 - loopT / 4.2 : loopT > 12.6 ? (loopT - 12.6) / 2.4 : 0;
  var bob = Math.sin(HF_TAU * loopT / 3) * 0.04;

  hfBox(ctx, V, -9.4, -9.9, -1.5, 9.4, 19.8, 0.9, ['#2A2D33', '#1C1E23', '#15171B'], null, 0);

  ctx.fillStyle = '#8FD8CF';
  hfRect(ctx, V, 0, -80, -0.6, 80, 160); ctx.fill();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2 * u; ctx.globalAlpha = 0.7;
  ctx.beginPath(); var e1 = hfP(V, 0.02, -80, -0.6), e2 = hfP(V, 0.02, 80, -0.6); ctx.moveTo(e1[0], e1[1]); ctx.lineTo(e2[0], e2[1]); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.lineWidth = 2.2 * u;
  for (var wv = 0; wv < 46; wv++) {
    var wx = 0.6 + hfHash(wv * 3.3) * 16;
    var wy = -26 + hfFrac(hfHash(wv * 5.1) + ph * (1 + (wv % 2))) * 52;
    var wa = Math.sin(Math.PI * hfFrac(hfHash(wv * 5.1) + ph * (1 + (wv % 2))));
    if (wx > 0.4 && wx < 3.8 && Math.abs(wy - ys) < 6.4) continue;
    ctx.strokeStyle = wv % 3 === 0 ? 'rgba(255,255,255,' + (0.75 * wa).toFixed(3) + ')' : 'rgba(78,182,170,' + (0.8 * wa).toFixed(3) + ')';
    var w1 = hfP(V, wx, wy, -0.6), w2 = hfP(V, wx, wy + 0.7, -0.6);
    ctx.beginPath(); ctx.moveTo(w1[0], w1[1]); ctx.lineTo(w2[0], w2[1]); ctx.stroke();
  }

  if (shipSpeed > 0.02) {
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 * shipSpeed).toFixed(3) + ')';
    ctx.lineWidth = 2.4 * u;
    for (var wk = 0; wk < 5; wk++) {
      var wo = wk * 1.1 + hfFrac(loopT * 2) * 1.1;
      var a1 = hfP(V, 0.3 - wo * 0.15, ys + 6 + wo, -0.6), a2 = hfP(V, 0.3 - wo * 0.15, ys + 6.6 + wo, -0.6);
      var b1 = hfP(V, 3.9 + wo * 0.15, ys + 6 + wo, -0.6), b2 = hfP(V, 3.9 + wo * 0.15, ys + 6.6 + wo, -0.6);
      ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
    }
  }

  hfBox(ctx, V, -9, -9.5, -0.6, 9, 19, 0.6, ['#30343B', '#25282E', '#1C1F24'], INK, lw);

  ctx.fillStyle = '#F2C230';
  hfRect(ctx, V, -0.2, -9.5, 0.002, 0.2, 19); ctx.fill();
  ctx.fillStyle = '#3B3F47';
  hfRect(ctx, V, -3.0, -9.5, 0.002, 0.95, 19); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.6 * u;
  ctx.setLineDash([10 * u, 9 * u]);
  ctx.beginPath(); var m1 = hfP(V, -2.52, -9.4, 0.003), m2 = hfP(V, -2.52, 9.4, 0.003); ctx.moveTo(m1[0], m1[1]); ctx.lineTo(m2[0], m2[1]); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#F2C230'; ctx.lineWidth = 2 * u;
  ctx.beginPath();
  [-0.3, -1.9].forEach(function (rx) { var r1 = hfP(V, rx, -9.4, 0.003), r2 = hfP(V, rx, 9.4, 0.003); ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]); });
  ctx.stroke();
  for (var fd = 0; fd < 9; fd++) {
    var fy = -8.5 + fd * 2.1;
    var f1 = hfP(V, 0, fy, -0.5), f2 = hfP(V, 0, fy + 0.5, -0.5), f3 = hfP(V, 0, fy + 0.5, -0.08), f4 = hfP(V, 0, fy, -0.08);
    ctx.fillStyle = '#111317'; hfPoly(ctx, [f1, f2, f3, f4]); ctx.fill();
    hfCyl(ctx, V, -0.45, fy + 0.25, 0, 0.1, 0.16, '#F2C230', '#C99A16', INK, lw * 0.8);
  }

  var tris = D.tris;
  var yard = D.yard;
  for (var yi = 0; yi < yard.length; yi++) {
    var yc = yard[yi];
    hfBox(ctx, V, yc.x, yc.y, yc.k * 0.47, 0.5, 1.0, 0.46, tris[yc.c], INK, lw * 0.8);
  }

  var wh = ['#F4EFE6', '#E2DACB', '#C9BFAE'];
  hfBox(ctx, V, -8.4, 4.4, 0, 4.0, 4.6, 1.5, wh, INK, lw);
  for (var rf = 0; rf < 4; rf++) {
    var ry0 = 4.4 + rf * 1.15;
    hfPrism(ctx, V, [[-8.4, ry0], [-4.4, ry0], [-4.4, ry0 + 1.15], [-8.4, ry0 + 1.15]], 1.5, 1.5, ['#2BB3A3', '#2BB3A3', '#2BB3A3'], '#2BB3A3', null, 0, false);
    var rA = hfP(V, -8.4, ry0, 1.5), rB = hfP(V, -4.4, ry0, 1.5), rC = hfP(V, -4.4, ry0 + 0.15, 2.05), rD = hfP(V, -8.4, ry0 + 0.15, 2.05);
    var rE = hfP(V, -4.4, ry0 + 1.15, 1.5), rF = hfP(V, -8.4, ry0 + 1.15, 1.5);
    ctx.fillStyle = '#E8F7F4'; hfPoly(ctx, [rA, rB, rC, rD]); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke();
    ctx.fillStyle = '#2BB3A3'; hfPoly(ctx, [rD, rC, rE, rF]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1E8E81'; hfPoly(ctx, [rB, rC, rE]); ctx.fill(); ctx.stroke();
  }
  for (var dr = 0; dr < 3; dr++) {
    var dx0 = -4.4, dy0 = 4.75 + dr * 1.45;
    var d1 = hfP(V, dx0, dy0, 0.05), d2 = hfP(V, dx0, dy0 + 0.9, 0.05), d3 = hfP(V, dx0, dy0 + 0.9, 1.0), d4 = hfP(V, dx0, dy0, 1.0);
    ctx.fillStyle = '#F07A3A'; hfPoly(ctx, [d1, d2, d3, d4]); ctx.fill();
    ctx.strokeStyle = 'rgba(31,34,40,0.35)'; ctx.lineWidth = 1 * u;
    ctx.beginPath();
    for (var sl = 1; sl < 5; sl++) { var s1 = hfP(V, dx0, dy0, 0.05 + sl * 0.19), s2 = hfP(V, dx0, dy0 + 0.9, 0.05 + sl * 0.19); ctx.moveTo(s1[0], s1[1]); ctx.lineTo(s2[0], s2[1]); }
    ctx.stroke();
  }

  for (var tr = 0; tr < 4; tr++) {
    var ty = -12 + hfFrac(ph * 2 + tr / 4) * 24;
    var ta = 1 - hfSmooth(8.7, 9.3, Math.abs(ty));
    if (ta > 0.01) hfTruck(ctx, V, -2.75, ty, -1, tr % 2 === 0, tris[(tr * 2 + 1) % 6], tr === 1 ? '#F07A3A' : '#2BB3A3', ta, lw, INK);
  }

  var Yc = [-2.05, 2.15], lanes = [-0.75, -1.45], bayIdx = [1, 5], rows = [[1, 3], [2, 0]];
  var Tc = 3.4;
  var cranes = [];
  for (var cr = 0; cr < 2; cr++) {
    var st = { tx: lanes[cr], hz: 4.2, carry: null };
    for (var cy2 = 0; cy2 < 2; cy2++) {
      var cs0 = 4.6 + cr * 0.8 + cy2 * 3.6;
      var c = (loopT - cs0) / Tc;
      if (c < 0 || c > 1) continue;
      var row = rows[cr][cy2];
      var rowX = 0.85 + row * 0.54 + 0.25;
      var topK = 0;
      for (var si = 0; si < D.ship.length; si++) { var sc = D.ship[si]; if (sc.b === bayIdx[cr] && sc.r === row && sc.top) topK = sc.k; }
      var pickZ = 0.9 + (topK + 1) * 0.47 + bob;
      var dropZ = 0.45 + 0.47;
      var col = 0;
      for (si = 0; si < D.ship.length; si++) { sc = D.ship[si]; if (sc.b === bayIdx[cr] && sc.r === row && sc.k === topK) col = sc.c; }
      if (c < 0.15) { st.tx = hfLerp(lanes[cr], rowX, hfEaseInOut(c / 0.15)); st.hz = 4.2; }
      else if (c < 0.3) { st.tx = rowX; st.hz = hfLerp(4.2, pickZ, hfEaseInOut((c - 0.15) / 0.15)); }
      else if (c < 0.35) { st.tx = rowX; st.hz = pickZ; }
      else if (c < 0.5) { st.tx = rowX; st.hz = hfLerp(pickZ, 4.2, hfEaseInOut((c - 0.35) / 0.15)); }
      else if (c < 0.65) { st.tx = hfLerp(rowX, lanes[cr], hfEaseInOut((c - 0.5) / 0.15)); st.hz = 4.2; }
      else if (c < 0.8) { st.tx = lanes[cr]; st.hz = hfLerp(4.2, dropZ, hfEaseInOut((c - 0.65) / 0.15)); }
      else if (c < 0.85) { st.tx = lanes[cr]; st.hz = dropZ; }
      else { st.tx = lanes[cr]; st.hz = hfLerp(dropZ, 4.2, hfEaseInOut((c - 0.85) / 0.15)); }
      if (c >= 0.3 && c < 0.8) st.carry = col;
    }
    cranes.push(st);
  }

  for (cr = 0; cr < 2; cr++) {
    [Yc[cr] - 0.95, Yc[cr] + 0.95].forEach(function (ly) { hfCraneLeg(ctx, V, -1.9, ly, lw, INK); });
  }

  for (cr = 0; cr < 2; cr++) {
    for (cy2 = 0; cy2 < 2; cy2++) {
      cs0 = 4.6 + cr * 0.8 + cy2 * 3.6;
      var arrS = cs0 - 0.9, arrE = cs0 + 0.6 * Tc, depS = cs0 + 0.88 * Tc;
      if (loopT < arrS || loopT > depS + 2.4) continue;
      var tyy = loopT < depS ? hfLerp(12, Yc[cr], hfEaseOut((loopT - arrS) / (arrE - arrS))) : hfLerp(Yc[cr], -12, hfEaseIn((loopT - depS) / 2.2));
      var alpha = 1 - hfSmooth(8.7, 9.3, Math.abs(tyy));
      var loaded = loopT >= cs0 + 0.8 * Tc;
      var row2 = rows[cr][cy2], tk = 0, cc = 0;
      for (si = 0; si < D.ship.length; si++) { sc = D.ship[si]; if (sc.b === bayIdx[cr] && sc.r === row2 && sc.top) { tk = sc.k; cc = sc.c; } }
      if (alpha > 0.01) hfTruck(ctx, V, lanes[cr], tyy, -1, loaded, tris[cc], cr === 0 ? '#F07A3A' : '#2BB3A3', alpha, lw, INK);
    }
  }

  for (cr = 0; cr < 2; cr++) {
    [Yc[cr] - 0.95, Yc[cr] + 0.95].forEach(function (ly) { hfCraneLeg(ctx, V, -0.3, ly, lw, INK); });
  }

  var shipItems = [];
  var removed = {};
  for (cr = 0; cr < 2; cr++) {
    for (cy2 = 0; cy2 < 2; cy2++) {
      cs0 = 4.6 + cr * 0.8 + cy2 * 3.6;
      if (loopT >= cs0 + 0.3 * Tc) removed[bayIdx[cr] + '_' + rows[cr][cy2]] = true;
    }
  }
  var sz = bob;
  var hull = [[0.6, ys - 4.5], [2.1, ys - 6.2], [3.6, ys - 4.5], [3.6, ys + 6], [0.6, ys + 6]];
  hfPrism(ctx, V, hull, -0.6 + sz, -0.15 + sz, ['#E9573F', '#E9573F', '#B83E2A'], '#CF4A33', INK, lw, true);
  hfPrism(ctx, V, hull, -0.15 + sz, 0.9 + sz, ['#EFE6D6', '#2F333B', '#1E2127'], '#262A30', INK, lw, false);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.4 * u;
  ctx.beginPath(); var h1 = hfP(V, 3.6, ys - 4.4, 0.75 + sz), h2 = hfP(V, 3.6, ys + 5.9, 0.75 + sz); ctx.moveTo(h1[0], h1[1]); ctx.lineTo(h2[0], h2[1]); ctx.stroke();

  for (si = 0; si < D.ship.length; si++) {
    sc = D.ship[si];
    var bayY = ys - 3.6 + sc.b * 1.05;
    if (sc.top && removed[sc.b + '_' + sc.r]) continue;
    (function (sc, bayY) {
      var x0 = 0.85 + sc.r * 0.54;
      shipItems.push({ key: x0 + bayY + sc.k * 0.001, fn: function () {
        hfBox(ctx, V, x0, bayY, 0.9 + sz + sc.k * 0.47, 0.5, 1.0, 0.46, tris[sc.c], INK, lw * 0.8);
      } });
    })(sc, bayY);
  }
  shipItems.push({ key: 1.0 + ys + 4.4 + 50, fn: function () {
    var bz = 0.9 + sz;
    hfBox(ctx, V, 0.9, ys + 4.4, bz, 2.4, 1.2, 2.2, ['#FFFFFF', '#EDE7DC', '#CFC6B6'], INK, lw);
    ctx.fillStyle = '#2F6F8F';
    for (var wl = 0; wl < 3; wl++) { hfPoly(ctx, [hfP(V, 3.3, ys + 4.55, bz + 0.45 + wl * 0.55), hfP(V, 3.3, ys + 5.45, bz + 0.45 + wl * 0.55), hfP(V, 3.3, ys + 5.45, bz + 0.7 + wl * 0.55), hfP(V, 3.3, ys + 4.55, bz + 0.7 + wl * 0.55)]); ctx.fill(); }
    hfBox(ctx, V, 0.7, ys + 4.3, bz + 2.2, 2.8, 1.4, 0.18, ['#FFFFFF', '#EDE7DC', '#CFC6B6'], INK, lw);
    hfBox(ctx, V, 1.5, ys + 5.65, bz + 1.0, 0.9, 0.45, 2.0, ['#F07A3A', '#E06A2C', '#B9531E'], INK, lw);
    hfBox(ctx, V, 1.5, ys + 5.65, bz + 2.75, 0.9, 0.45, 0.25, ['#2F333B', '#262A30', '#1E2127'], null, 0);
  } });
  shipItems.sort(function (a, b) { return a.key - b.key; });
  for (si = 0; si < shipItems.length; si++) shipItems[si].fn();

  for (cr = 0; cr < 2; cr++) hfCraneTop(ctx, V, Yc[cr], cranes[cr], tris, lw, INK, u, loopT);

  var occ = 1 - hfClamp(Math.abs(ys) / 14, 0, 1);
  hfUI(ctx, width, height, minSide, u, loopT, currentScene, sceneProgress, occ, ph);

  ctx.restore();
}

function hfCraneLeg(ctx, V, x, y, lw, INK) {
  var Y = ['#FFD25A', '#F5B82E', '#D39516'];
  hfBox(ctx, V, x - 0.2, y - 0.3, 0, 0.4, 0.6, 0.25, ['#3B3F47', '#2F333B', '#23262C'], INK, lw);
  hfBox(ctx, V, x - 0.12, y - 0.12, 0.25, 0.24, 0.24, 4.6, Y, INK, lw);
}

function hfCraneTop(ctx, V, Yc, st, tris, lw, INK, u, loopT) {
  var Y = ['#FFD25A', '#F5B82E', '#D39516'];
  hfBox(ctx, V, -1.9, Yc - 1.07, 4.85, 1.6, 0.24, 0.3, Y, INK, lw);
  hfBox(ctx, V, -1.9, Yc + 0.83, 4.85, 1.6, 0.24, 0.3, Y, INK, lw);
  ctx.strokeStyle = '#D39516'; ctx.lineWidth = 2.4 * u;
  ctx.beginPath();
  [[-1.9, Yc - 0.95], [-0.3, Yc - 0.95], [-1.9, Yc + 0.95], [-0.3, Yc + 0.95]].forEach(function (p, i) {
    if (i % 2 === 1) return;
    var a = hfP(V, p[0], p[1], 0.6), b = hfP(V, p[0] + 1.6, p[1], 4.5), c = hfP(V, p[0] + 1.6, p[1], 0.6), d = hfP(V, p[0], p[1], 4.5);
    ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  });
  ctx.stroke();
  hfBox(ctx, V, -1.9, Yc - 1.07, 5.15, 0.24, 2.14, 0.3, Y, INK, lw);
  hfBox(ctx, V, -0.54, Yc - 1.07, 5.15, 0.24, 2.14, 0.3, Y, INK, lw);
  hfBox(ctx, V, -3.4, Yc - 0.6, 5.65, 1.3, 1.2, 0.75, ['#FFFFFF', '#EDE7DC', '#CFC6B6'], INK, lw);
  hfBox(ctx, V, -3.4, Yc - 0.6, 6.4, 1.3, 1.2, 0.08, ['#F07A3A', '#E06A2C', '#B9531E'], null, 0);

  var apex = hfP(V, -1.1, Yc, 8.0);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8 * u;
  ctx.beginPath();
  var tip = hfP(V, 4.9, Yc, 5.65), back = hfP(V, -3.6, Yc, 5.65), mid = hfP(V, 1.8, Yc, 5.65);
  ctx.moveTo(apex[0], apex[1]); ctx.lineTo(tip[0], tip[1]);
  ctx.moveTo(apex[0], apex[1]); ctx.lineTo(mid[0], mid[1]);
  ctx.moveTo(apex[0], apex[1]); ctx.lineTo(back[0], back[1]);
  ctx.stroke();
  hfBox(ctx, V, -1.3, Yc - 0.12, 5.45, 0.4, 0.24, 2.55, Y, INK, lw);

  hfBox(ctx, V, -3.6, Yc - 0.3, 5.45, 8.5, 0.6, 0.22, Y, INK, lw);
  ctx.strokeStyle = 'rgba(31,34,40,0.55)'; ctx.lineWidth = 1 * u;
  ctx.beginPath();
  for (var tb = 0; tb < 14; tb++) {
    var bx = -3.4 + tb * 0.6;
    var a1 = hfP(V, bx, Yc + 0.3, 5.47), a2 = hfP(V, bx + 0.3, Yc + 0.3, 5.65), a3 = hfP(V, bx + 0.6, Yc + 0.3, 5.47);
    ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.lineTo(a3[0], a3[1]);
  }
  ctx.stroke();
  hfBox(ctx, V, st.tx + 0.15, Yc + 0.32, 4.75, 0.45, 0.4, 0.4, ['#E9F6F4', '#2BB3A3', '#1E8E81'], INK, lw);

  hfBox(ctx, V, st.tx - 0.28, Yc - 0.32, 5.22, 0.56, 0.64, 0.22, ['#3B3F47', '#2F333B', '#23262C'], INK, lw);
  var top1 = hfP(V, st.tx - 0.12, Yc, 5.22), top2 = hfP(V, st.tx + 0.12, Yc, 5.22);
  var bot1 = hfP(V, st.tx - 0.12, Yc, st.hz + 0.08), bot2 = hfP(V, st.tx + 0.12, Yc, st.hz + 0.08);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4 * u;
  ctx.beginPath(); ctx.moveTo(top1[0], top1[1]); ctx.lineTo(bot1[0], bot1[1]); ctx.moveTo(top2[0], top2[1]); ctx.lineTo(bot2[0], bot2[1]); ctx.stroke();
  if (st.carry !== null) hfBox(ctx, V, st.tx - 0.25, Yc - 0.5, st.hz - 0.46, 0.5, 1.0, 0.46, tris[st.carry], INK, lw * 0.8);
  hfBox(ctx, V, st.tx - 0.28, Yc - 0.52, st.hz, 0.56, 1.04, 0.08, ['#F7C85A', '#F07A3A', '#C55A22'], INK, lw);
  var lamp = 0.5 + 0.5 * Math.sin(HF_TAU * loopT * 1.5);
  var lp = hfP(V, st.tx, Yc + 0.52, st.hz + 0.08);
  ctx.fillStyle = 'rgba(240,122,58,' + (0.35 + 0.65 * lamp).toFixed(3) + ')';
  ctx.beginPath(); ctx.arc(lp[0], lp[1], 3 * u, 0, HF_TAU); ctx.fill();
}

function hfTruck(ctx, V, x, y, dir, loaded, ctri, cabCol, alpha, lw, INK) {
  ctx.save();
  ctx.globalAlpha = alpha;
  var cabT = hfTriad(cabCol);
  var dark = ['#3B3F47', '#2F333B', '#23262C'];
  var w = 0.56;
  hfBox(ctx, V, x - 0.24, y - 0.4, 0.08, 0.06, 0.2, 0.2, dark, null, 0);
  hfBox(ctx, V, x + 0.18, y + 0.35, 0.0, 0.1, 0.3, 0.22, dark, null, 0);
  hfBox(ctx, V, x - w / 2, y - 0.5, 0.22, w, 1.25, 0.14, dark, INK, lw);
  hfBox(ctx, V, x + 0.2, y + 0.4, 0.0, 0.1, 0.3, 0.22, dark, INK, lw * 0.7);
  hfBox(ctx, V, x + 0.2, y - 0.35, 0.0, 0.1, 0.3, 0.22, dark, INK, lw * 0.7);
  hfBox(ctx, V, x - w / 2 - 0.02, y - 1.08, 0.12, w + 0.04, 0.56, 0.62, cabT, INK, lw);
  var g1 = hfP(V, x + w / 2 + 0.02, y - 1.0, 0.5), g2 = hfP(V, x + w / 2 + 0.02, y - 0.6, 0.5), g3 = hfP(V, x + w / 2 + 0.02, y - 0.6, 0.68), g4 = hfP(V, x + w / 2 + 0.02, y - 1.0, 0.68);
  ctx.fillStyle = '#BFE8F0'; hfPoly(ctx, [g1, g2, g3, g4]); ctx.fill();
  if (loaded) hfBox(ctx, V, x - 0.25, y - 0.45, 0.45, 0.5, 1.0, 0.46, ctri, INK, lw * 0.8);
  ctx.restore();
}

function hfUI(ctx, width, height, minSide, u, loopT, scene, sp, occ, ph) {
  var pad = minSide * 0.075;
  var INK = '#1F2228';
  var labels = ['01  VESSEL ARRIVAL', '02  SHIP-TO-SHORE UNLOADING', '03  INLAND DISPATCH'];
  var la = hfSmooth(0, 0.07, sp) * (1 - hfSmooth(0.93, 1, sp));
  var lfs = minSide * 0.02;
  ctx.font = '700 ' + lfs + 'px ' + HF_FONT;
  ctx.textBaseline = 'middle';
  var lt = labels[scene];
  var lwid = ctx.measureText(lt).width + lfs * 1.8;
  ctx.save();
  ctx.globalAlpha = la;
  ctx.fillStyle = '#2BB3A3';
  hfRR(ctx, pad, pad, lwid, lfs * 2.1, lfs * 1.05); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(lt, pad + lfs * 0.9 + (1 - la) * 10 * u, pad + lfs * 1.08);
  ctx.restore();

  var tfs = minSide * 0.072;
  ctx.font = '800 ' + tfs + 'px ' + HF_FONT;
  var maxW = width * 0.36;
  var tw = ctx.measureText('PORT LOGISTICS').width;
  if (tw > maxW) { tfs *= maxW / tw; ctx.font = '800 ' + tfs + 'px ' + HF_FONT; tw = maxW; }
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  var ty = pad + lfs * 2.1 + tfs * 1.1;
  ctx.fillText('PORT LOGISTICS', pad, ty);
  var bar = 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(HF_TAU * ph));
  ctx.fillStyle = '#F07A3A';
  hfRR(ctx, pad, ty + tfs * 0.22, tw * bar, tfs * 0.12, tfs * 0.06); ctx.fill();
  ctx.fillStyle = '#F2B430';
  hfRR(ctx, pad + tw * bar + tfs * 0.12, ty + tfs * 0.22, tfs * 0.12, tfs * 0.12, tfs * 0.06); ctx.fill();
  var sfs = minSide * 0.024;
  ctx.font = '500 ' + sfs + 'px ' + HF_FONT;
  ctx.fillStyle = '#5B5F66';
  ctx.fillText('Ship-to-shore container handling', pad, ty + tfs * 0.42 + sfs * 1.3);

  var cw = minSide * 0.43, ch = minSide * 0.19;
  var cx = width - pad - cw, cy = height - pad - ch;
  ctx.fillStyle = 'rgba(31,34,40,0.14)';
  hfRR(ctx, cx + 8 * u, cy + 8 * u, cw, ch, 18 * u); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  hfRR(ctx, cx, cy, cw, ch, 18 * u); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * u; ctx.stroke();

  var rr = ch * 0.3, rcx = cx + ch * 0.5, rcy = cy + ch * 0.5;
  ctx.lineWidth = ch * 0.09; ctx.lineCap = 'round';
  ctx.strokeStyle = '#EFE6D6';
  ctx.beginPath(); ctx.arc(rcx, rcy, rr, 0, HF_TAU); ctx.stroke();
  if (occ > 0.005) {
    ctx.strokeStyle = '#2BB3A3';
    ctx.beginPath(); ctx.arc(rcx, rcy, rr, -Math.PI / 2, -Math.PI / 2 + HF_TAU * occ); ctx.stroke();
  }
  ctx.fillStyle = INK;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 ' + (ch * 0.17) + 'px ' + HF_FONT;
  ctx.fillText(Math.round(occ * 100) + '%', rcx, rcy);
  ctx.textAlign = 'left';

  var tx = cx + ch * 0.98;
  ctx.font = '800 ' + (ch * 0.12) + 'px ' + HF_FONT;
  ctx.fillText('BERTH OCCUPANCY', tx, cy + ch * 0.25);
  ctx.font = '500 ' + (ch * 0.085) + 'px ' + HF_FONT;
  ctx.fillStyle = '#5B5F66';
  ctx.fillText('Live terminal status', tx, cy + ch * 0.42);

  var steps = ['ARRIVE', 'UNLOAD', 'DISPATCH'];
  var pos;
  if (loopT < 4.6) pos = 0;
  else if (loopT < 5.4) pos = hfEaseInOut((loopT - 4.6) / 0.8);
  else if (loopT < 9.6) pos = 1;
  else if (loopT < 10.4) pos = 1 + hfEaseInOut((loopT - 9.6) / 0.8);
  else if (loopT < 14.2) pos = 2;
  else pos = 2 - 2 * hfEaseInOut((loopT - 14.2) / 0.8);
  var sx0 = tx, sw = (cx + cw - ch * 0.12 - tx) / 3, sy = cy + ch * 0.62, sh = ch * 0.22;
  ctx.fillStyle = '#F6EFE3';
  hfRR(ctx, sx0, sy, sw * 3, sh, sh / 2); ctx.fill();
  ctx.fillStyle = '#F2B430';
  hfRR(ctx, sx0 + pos * sw, sy, sw, sh, sh / 2); ctx.fill();
  ctx.font = '700 ' + (ch * 0.075) + 'px ' + HF_FONT;
  ctx.textAlign = 'center';
  for (var i = 0; i < 3; i++) {
    var act = 1 - hfClamp(Math.abs(pos - i), 0, 1);
    ctx.fillStyle = act > 0.5 ? INK : '#8A8E95';
    ctx.fillText(steps[i], sx0 + sw * (i + 0.5), sy + sh * 0.53);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
