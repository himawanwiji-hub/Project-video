// Nomor 1 — Neon Core Assembly | 15 s | 3 scene | 16:9 | Canvas API murni

var NC_C30 = 0.8660254037844386;
var NC_TAU = Math.PI * 2;
var NC_DATA = null;

function ncClamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function ncSmooth(a, b, v) { var x = ncClamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
function ncEaseOut(x) { x = ncClamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
function ncEaseInOut(x) { x = ncClamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function ncHash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function ncFrac(v) { return v - Math.floor(v); }

function ncP(V, x, y, z) {
  return [V.cx + (x - y) * NC_C30 * V.s, V.cy + (x + y) * 0.5 * V.s - z * V.s];
}

function ncQuad(ctx, a, b, c, d) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  ctx.closePath();
}

function ncBox(ctx, V, x, y, z, w, d, h, top, left, right, stroke, lw) {
  var a = ncP(V, x, y, z + h), b = ncP(V, x + w, y, z + h), c = ncP(V, x + w, y + d, z + h), e = ncP(V, x, y + d, z + h);
  var f = ncP(V, x, y + d, z), g = ncP(V, x + w, y + d, z), k = ncP(V, x + w, y, z);
  ctx.fillStyle = left; ncQuad(ctx, e, c, g, f); ctx.fill();
  ctx.fillStyle = right; ncQuad(ctx, c, b, k, g); ctx.fill();
  ctx.fillStyle = top; ncQuad(ctx, a, b, c, e); ctx.fill();
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

function ncRect(ctx, V, x, y, z, w, d) {
  ncQuad(ctx, ncP(V, x, y, z), ncP(V, x + w, y, z), ncP(V, x + w, y + d, z), ncP(V, x, y + d, z));
}

function ncCyl(ctx, V, x, y, z, r, h, top, side, dark, stroke, lw) {
  var b = ncP(V, x, y, z), t = ncP(V, x, y, z + h);
  var rx = r * V.s * 1.2247, ry = r * V.s * 0.7071;
  var g = ctx.createLinearGradient(b[0] - rx, 0, b[0] + rx, 0);
  g.addColorStop(0, side); g.addColorStop(0.56, side); g.addColorStop(0.56, dark); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(b[0] - rx, t[1]); ctx.lineTo(b[0] - rx, b[1]);
  ctx.ellipse(b[0], b[1], rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(b[0] + rx, t[1]); ctx.closePath(); ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.fillStyle = top;
  ctx.beginPath(); ctx.ellipse(t[0], t[1], rx, ry, 0, 0, NC_TAU); ctx.fill();
  if (stroke) ctx.stroke();
  return [t, rx, ry];
}

function ncMeasure(pts) {
  var seg = [], L = 0;
  for (var i = 1; i < pts.length; i++) {
    var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l); L += l;
  }
  return { seg: seg, L: L };
}

function ncAt(tr, f) {
  var d = ncClamp(f, 0, 1) * tr.L, pts = tr.pts;
  for (var i = 0; i < tr.seg.length; i++) {
    if (d <= tr.seg[i] || i === tr.seg.length - 1) {
      var k = tr.seg[i] > 0 ? Math.min(1, d / tr.seg[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= tr.seg[i];
  }
  return pts[pts.length - 1];
}

function ncSubPath(ctx, V, tr, f0, f1, z) {
  if (f1 <= f0) return;
  var d0 = f0 * tr.L, d1 = f1 * tr.L, acc = 0;
  var p = ncAt(tr, f0), s = ncP(V, p[0], p[1], z);
  ctx.moveTo(s[0], s[1]);
  for (var i = 0; i < tr.seg.length; i++) {
    acc += tr.seg[i];
    if (acc > d0 && acc < d1) { s = ncP(V, tr.pts[i + 1][0], tr.pts[i + 1][1], z); ctx.lineTo(s[0], s[1]); }
  }
  p = ncAt(tr, f1); s = ncP(V, p[0], p[1], z); ctx.lineTo(s[0], s[1]);
}

function ncBuild() {
  var traces = [];
  var sides = [[1, 0], [0, -1], [-1, 0], [0, 1]];
  var n = 7, j = 0;
  for (var si = 0; si < 4; si++) {
    var dir = sides[si];
    for (var k = 0; k < n; k++) {
      var o = (k - (n - 1) / 2) * 0.55;
      var lat2 = o * 1.75, diag = Math.abs(lat2 - o);
      var loc = [[2.3, o], [2.8, o], [2.8 + diag, lat2], [4.3, lat2]];
      var pts = [];
      for (var q = 0; q < loc.length; q++) {
        var a = loc[q][0], b = loc[q][1];
        pts.push(dir[0] !== 0 ? [dir[0] * a, b] : [b, dir[1] * a]);
      }
      var m = ncMeasure(pts);
      traces.push({ pts: pts, seg: m.seg, L: m.L, side: si, k: k, j: j, lat: lat2, dir: dir, h: ncHash(j * 3.7 + 1) });
      j++;
    }
  }
  return { traces: traces };
}

function draw(ctx, time, width, height) {
  var t = time;
  var duration = 15;
  var sceneCount = 3;
  var loopT = ((t % duration) + duration) % duration;
  var sceneDuration = duration / sceneCount;
  var currentScene = Math.floor(loopT / sceneDuration);
  var sceneProgress = (loopT % sceneDuration) / sceneDuration;
  if (!NC_DATA) NC_DATA = ncBuild();
  var D = NC_DATA;

  var minSide = Math.min(width, height);
  var u = minSide / 1080;
  var ph = loopT / duration;
  var lw = 1.6 * u;

  var fadeOut = 1 - ncSmooth(12.3, 13.5, loopT);
  var energy = ncSmooth(5, 6.5, loopT) * fadeOut;
  var corePulse = ncSmooth(9.6, 10.6, loopT) * fadeOut;
  var compLit = ncSmooth(7.4, 8.4, loopT) * fadeOut;
  var sceneAccent = currentScene === 0 ? 0.2 + 0.2 * Math.sin(sceneProgress * Math.PI) : currentScene === 1 ? 0.4 + 0.6 * sceneProgress : 1 - 0.6 * ncSmooth(0.5, 1, sceneProgress);

  var s = Math.min(width * 0.8 / 20.8, height * 0.6 / 12);
  var bob = Math.sin(NC_TAU * loopT / 5) * 0.012 * height;
  var V = { cx: width * 0.5, cy: height * 0.54 + bob, s: s };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  var bg = ctx.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.75);
  bg.addColorStop(0, '#15264A');
  bg.addColorStop(0.55, '#0B1530');
  bg.addColorStop(1, '#050913');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  var gridOff = ph * 2;
  ctx.strokeStyle = 'rgba(90,200,255,0.07)';
  ctx.lineWidth = 1 * u;
  ctx.beginPath();
  for (var gi = -30; gi <= 30; gi++) {
    var gx = gi + ncFrac(gridOff);
    var a1 = ncP(V, gx, -30, -0.9), a2 = ncP(V, gx, 30, -0.9);
    ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]);
    var b1 = ncP(V, -30, gi, -0.9), b2 = ncP(V, 30, gi, -0.9);
    ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]);
  }
  ctx.stroke();

  for (var pi = 0; pi < 46; pi++) {
    var spd = 1 + Math.floor(ncHash(pi * 5.1) * 2);
    var py = height * (1.05 - ncFrac(ncHash(pi * 2.3) + ph * spd) * 1.1);
    var px = width * ncHash(pi * 9.7) + Math.sin(NC_TAU * (ph * 2 + ncHash(pi))) * 12 * u;
    var pa = Math.sin(Math.PI * ncFrac(ncHash(pi * 2.3) + ph * spd)) * 0.5;
    var ps = (1.5 + ncHash(pi * 4.4) * 2.5) * u;
    ctx.fillStyle = 'rgba(110,220,255,' + (pa * 0.7).toFixed(3) + ')';
    ctx.beginPath(); ctx.moveTo(px, py - ps); ctx.lineTo(px + ps, py); ctx.lineTo(px, py + ps); ctx.lineTo(px - ps, py); ctx.closePath(); ctx.fill();
  }

  ncBox(ctx, V, -6.4, -6.4, -0.85, 12.8, 12.8, 0.3, '#0A1828', '#081221', '#050C17', 'rgba(60,160,220,0.35)', lw);
  ncBox(ctx, V, -6, -6, -0.55, 12, 12, 0.55, '#0E2540', '#0A1B30', '#071424', 'rgba(80,220,255,0.6)', lw);

  ctx.strokeStyle = 'rgba(120,230,255,0.18)';
  ctx.lineWidth = 1.2 * u;
  ctx.setLineDash([6 * u, 5 * u]);
  ncRect(ctx, V, -5.7, -5.7, 0, 11.4, 11.4); ctx.stroke();
  ctx.setLineDash([]);

  var corners = [[-5.3, -5.3], [5.3, -5.3], [5.3, 5.3], [-5.3, 5.3]];
  for (var ci = 0; ci < 4; ci++) {
    var cp = ncP(V, corners[ci][0], corners[ci][1], 0);
    ctx.fillStyle = '#C9A24A';
    ctx.beginPath(); ctx.ellipse(cp[0], cp[1], 0.32 * s * 1.2247, 0.32 * s * 0.7071, 0, 0, NC_TAU); ctx.fill();
    ctx.fillStyle = '#050A14';
    ctx.beginPath(); ctx.ellipse(cp[0], cp[1], 0.18 * s * 1.2247, 0.18 * s * 0.7071, 0, 0, NC_TAU); ctx.fill();
  }

  var socketGlow = energy * (0.5 + 0.5 * Math.sin(NC_TAU * loopT / 1.5));
  if (socketGlow > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var sg = 0; sg < 3; sg++) {
      var r = 2.35 + sg * 0.18;
      ctx.strokeStyle = 'rgba(63,242,255,' + (0.22 * socketGlow / (sg + 1)).toFixed(3) + ')';
      ctx.lineWidth = (2 + sg * 2) * u;
      ncRect(ctx, V, -r, -r, 0.001, r * 2, r * 2); ctx.stroke();
    }
    ctx.restore();
  }

  var traces = D.traces;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(70,170,215,0.32)';
  ctx.lineWidth = 3.2 * u;
  ctx.beginPath();
  for (var ti = 0; ti < traces.length; ti++) ncSubPath(ctx, V, traces[ti], 0, 1, 0);
  ctx.stroke();

  var growth = [];
  for (ti = 0; ti < traces.length; ti++) growth.push(ncEaseInOut((loopT - 5.4 - ti * 0.05) / 1.5) * fadeOut);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(63,242,255,0.16)';
  ctx.lineWidth = 9 * u;
  ctx.beginPath();
  for (ti = 0; ti < traces.length; ti++) if (growth[ti] > 0.001) ncSubPath(ctx, V, traces[ti], 0, growth[ti], 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,250,255,0.95)';
  ctx.lineWidth = 2.4 * u;
  ctx.beginPath();
  for (ti = 0; ti < traces.length; ti++) if (growth[ti] > 0.001) ncSubPath(ctx, V, traces[ti], 0, growth[ti], 0);
  ctx.stroke();

  for (ti = 0; ti < traces.length; ti++) {
    var tr = traces[ti];
    if (growth[ti] < 0.02) continue;
    for (var dk = 0; dk < 2; dk++) {
      var f = ncFrac(ph * 6 + tr.h + dk * 0.5);
      if (tr.j % 2 === 1) f = 1 - f;
      if (f > growth[ti]) continue;
      var wp = ncAt(tr, f), sp = ncP(V, wp[0], wp[1], 0);
      var da = Math.sin(Math.PI * f) * growth[ti];
      ctx.fillStyle = 'rgba(63,242,255,' + (0.25 * da).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sp[0], sp[1], 7 * u, 0, NC_TAU); ctx.fill();
      ctx.fillStyle = 'rgba(230,255,255,' + (0.95 * da).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(sp[0], sp[1], 2.6 * u, 0, NC_TAU); ctx.fill();
    }
  }
  ctx.restore();

  for (ti = 0; ti < traces.length; ti++) {
    tr = traces[ti];
    var pinOn = ncSmooth(5 + ti * 0.07, 5.25 + ti * 0.07, loopT) * fadeOut;
    var p0 = tr.pts[0], dir = tr.dir;
    var px0 = dir[0] !== 0 ? p0[0] - dir[0] * 0.05 : p0[0] - 0.1;
    var py0 = dir[0] !== 0 ? p0[1] - 0.1 : p0[1] - dir[1] * 0.05;
    var pw = dir[0] !== 0 ? 0.3 : 0.2, pd = dir[0] !== 0 ? 0.2 : 0.3;
    if (dir[0] < 0) px0 = p0[0] - 0.25;
    if (dir[1] < 0) py0 = p0[1] - 0.25;
    ctx.fillStyle = pinOn > 0.05 ? 'rgba(' + Math.round(201 + 54 * pinOn) + ',' + Math.round(162 + 93 * pinOn) + ',' + Math.round(74 + 181 * pinOn) + ',1)' : '#C9A24A';
    ncRect(ctx, V, px0, py0, 0.002, pw, pd); ctx.fill();
    var end = tr.pts[tr.pts.length - 1], ep = ncP(V, end[0], end[1], 0);
    var endLit = growth[ti] > 0.98 ? 1 : 0;
    ctx.fillStyle = '#C9A24A';
    ctx.beginPath(); ctx.ellipse(ep[0], ep[1], 0.17 * s * 1.2247, 0.17 * s * 0.7071, 0, 0, NC_TAU); ctx.fill();
    ctx.fillStyle = endLit ? 'rgba(170,255,255,' + (0.6 + 0.4 * fadeOut).toFixed(3) + ')' : '#08121F';
    ctx.beginPath(); ctx.ellipse(ep[0], ep[1], 0.08 * s * 1.2247, 0.08 * s * 0.7071, 0, 0, NC_TAU); ctx.fill();
  }

  var items = [];

  var capY = [-2.5, -0.85, 0.85, 2.5];
  capY.forEach(function (cy, i) {
    items.push({ key: -5.1 + cy, fn: function () {
      var top = ncCyl(ctx, V, -5.1, cy, 0, 0.42, 0.85, '#C7D2DE', '#34507A', '#223857', '#0A1424', lw);
      ctx.strokeStyle = '#7A8DA3'; ctx.lineWidth = 1.4 * u;
      ctx.beginPath();
      ctx.moveTo(top[0][0] - top[1] * 0.55, top[0][1]); ctx.lineTo(top[0][0] + top[1] * 0.55, top[0][1]);
      ctx.moveTo(top[0][0], top[0][1] - top[2] * 0.55); ctx.lineTo(top[0][0], top[0][1] + top[2] * 0.55);
      ctx.stroke();
      var stripe = ncP(V, -5.1 - 0.3, cy + 0.3, 0.42);
      ctx.fillStyle = 'rgba(160,190,230,0.55)';
      ctx.fillRect(stripe[0] - 1.5 * u, stripe[1] - 0.3 * s, 3 * u, 0.5 * s);
      var led = compLit * (0.6 + 0.4 * Math.sin(NC_TAU * (loopT / 1.25 + i * 0.25)));
      if (led > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(63,242,255,' + (0.7 * led).toFixed(3) + ')'; ctx.lineWidth = 2 * u;
        ctx.beginPath(); ctx.ellipse(top[0][0], top[0][1], top[1] * 1.12, top[2] * 1.12, 0, 0, NC_TAU); ctx.stroke();
        ctx.restore();
      }
    } });
  });

  var ramY = [-3.4, -1.65, 0.1, 1.85];
  ramY.forEach(function (ry, i) {
    items.push({ key: 5 + ry + 0.8, fn: function () {
      for (var pn = 0; pn < 6; pn++) {
        ctx.fillStyle = '#D8B45A';
        ncRect(ctx, V, 4.42, ry + 0.12 + pn * 0.25, 0.003, 0.14, 0.12); ctx.fill();
      }
      ncBox(ctx, V, 4.55, ry, 0, 1.2, 1.55, 0.36, '#1E2E4C', '#152239', '#0F182A', '#4FD8FF', lw);
      ctx.fillStyle = '#2B4170';
      ncRect(ctx, V, 4.72, ry + 0.18, 0.361, 0.86, 1.19); ctx.fill();
      ctx.strokeStyle = 'rgba(140,200,255,0.35)'; ctx.lineWidth = 1 * u;
      ctx.beginPath();
      for (var ln = 0; ln < 3; ln++) {
        var l1 = ncP(V, 4.85 + ln * 0.22, ry + 0.32, 0.362), l2 = ncP(V, 4.85 + ln * 0.22, ry + 1.2, 0.362);
        ctx.moveTo(l1[0], l1[1]); ctx.lineTo(l2[0], l2[1]);
      }
      ctx.stroke();
      var on = compLit * (0.55 + 0.45 * Math.sin(NC_TAU * (loopT * 0.8 + i * 0.3)));
      ctx.fillStyle = on > 0.02 ? 'rgba(90,255,200,' + (0.35 + 0.65 * on).toFixed(3) + ')' : '#13324A';
      ncRect(ctx, V, 5.5, ry + 1.25, 0.362, 0.14, 0.14); ctx.fill();
    } });
  });

  traces.forEach(function (tr2) {
    if (tr2.side !== 3) return;
    var x = tr2.lat;
    items.push({ key: x + 5.1, fn: function () {
      ncBox(ctx, V, x - 0.17, 4.5, 0, 0.34, 0.85, 0.24, '#E2D0A8', '#BFA97C', '#9C875F', '#2A2216', lw * 0.8);
      var cols = ['#C0392B', '#7A4BD6', '#2B2B2B'];
      for (var bi = 0; bi < 3; bi++) {
        ctx.fillStyle = cols[(bi + tr2.k) % 3];
        ncRect(ctx, V, x - 0.17, 4.66 + bi * 0.18, 0.241, 0.34, 0.08); ctx.fill();
      }
    } });
  });

  [[-3.3, -5.75, 2.9], [0.4, -5.75, 2.9]].forEach(function (ic, i) {
    items.push({ key: ic[0] + 1.45 + ic[1] + 0.6, fn: function () {
      for (var pn = 0; pn < 9; pn++) {
        ctx.fillStyle = '#D8B45A';
        ncRect(ctx, V, ic[0] + 0.18 + pn * 0.3, ic[1] + 1.2, 0.003, 0.12, 0.16); ctx.fill();
        ncRect(ctx, V, ic[0] + 0.18 + pn * 0.3, ic[1] - 0.16, 0.003, 0.12, 0.16); ctx.fill();
      }
      ncBox(ctx, V, ic[0], ic[1], 0, ic[2], 1.2, 0.3, '#18202E', '#11171F', '#0B1017', '#4FD8FF', lw);
      ctx.fillStyle = '#C9A24A';
      var dot = ncP(V, ic[0] + 0.3, ic[1] + 0.3, 0.301);
      ctx.beginPath(); ctx.ellipse(dot[0], dot[1], 0.08 * s * 1.22, 0.08 * s * 0.7, 0, 0, NC_TAU); ctx.fill();
      var bar = compLit * (0.5 + 0.5 * Math.sin(NC_TAU * (loopT / 2.5 + i * 0.5)));
      ctx.fillStyle = 'rgba(63,242,255,' + (0.15 + 0.6 * bar).toFixed(3) + ')';
      ncRect(ctx, V, ic[0] + 0.7, ic[1] + 0.48, 0.301, (ic[2] - 1.0) * (0.3 + 0.7 * bar), 0.22); ctx.fill();
    } });
  });

  var H = [1.3, 2.6, 3.9];
  var dropStart = [0.25, 0.85, 1.45], dropDur = 1.7;
  var riseStart = [13.2, 12.9, 12.6], riseDur = 1.8;
  var lift = [], landFlash = [];
  for (var li = 0; li < 3; li++) {
    var lv;
    if (loopT < riseStart[li]) lv = H[li] * (1 - ncEaseOut((loopT - dropStart[li]) / dropDur));
    else lv = H[li] * ncEaseInOut((loopT - riseStart[li]) / riseDur);
    var lifted = lv / H[li];
    lv += 0.1 * Math.sin(NC_TAU * loopT / 2.5 + li * 1.3) * lifted;
    lift.push(lv);
    var landT = dropStart[li] + dropDur * 0.62;
    landFlash.push(loopT > landT && loopT < riseStart[li] ? 1 - ncSmooth(0, 1.0, loopT - landT) : 0);
  }
  var exploded = Math.max(lift[0] / H[0], lift[1] / H[1], lift[2] / H[2]);

  items.push({ key: 0, fn: function () {
    ncBox(ctx, V, -2.2, -2.2, 0, 4.4, 4.4, 0.12, '#14243A', '#0E1A2B', '#0A1320', 'rgba(80,220,255,0.7)', lw);

    if (exploded > 0.02) {
      ctx.save();
      ctx.strokeStyle = 'rgba(120,230,255,' + (0.35 * ncClamp(exploded, 0, 1)).toFixed(3) + ')';
      ctx.lineWidth = 1 * u;
      ctx.setLineDash([4 * u, 4 * u]);
      ctx.lineDashOffset = -loopT * 30 * u;
      ctx.beginPath();
      [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]].forEach(function (c) {
        var a = ncP(V, c[0], c[1], 0.12), b = ncP(V, c[0], c[1], 0.52 + lift[2]);
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      });
      ctx.stroke();
      ctx.restore();
    }

    var z0 = 0.12 + lift[0];
    ncBox(ctx, V, -1.9, -1.9, z0, 3.8, 3.8, 0.22, '#1F7366', '#16574C', '#104038', '#5CFFE0', lw);
    ctx.fillStyle = 'rgba(15,40,36,0.85)';
    ncRect(ctx, V, -1.25, -1.25, z0 + 0.221, 2.5, 2.5); ctx.fill();
    for (var sm = 0; sm < 8; sm++) {
      var ang = sm / 8 * NC_TAU + 0.39;
      var sx = Math.cos(ang) * 1.55, sy = Math.sin(ang) * 1.55;
      ncBox(ctx, V, sx - 0.09, sy - 0.06, z0 + 0.22, 0.18, 0.12, 0.07, '#D9C49A', '#A88F62', '#8A744C', null, 0);
    }
    if (landFlash[0] > 0) ncFlash(ctx, V, 1.9, 0.12, landFlash[0], u);

    var z1 = 0.34 + lift[1];
    ncBox(ctx, V, -1.1, -1.1, z1, 2.2, 2.2, 0.18, '#4B3BAA', '#36298A', '#271E66', '#B49CFF', lw);
    var coreA = 0.25 + 0.75 * energy;
    for (var cx = 0; cx < 4; cx++) {
      for (var cy = 0; cy < 4; cy++) {
        var pulse = 0.5 + 0.5 * Math.sin(NC_TAU * (loopT / 1.5) - (cx + cy) * 0.7);
        var a = coreA * (0.35 + 0.65 * pulse * energy);
        ctx.fillStyle = 'rgba(' + Math.round(120 + 100 * a) + ',' + Math.round(110 + 120 * a) + ',255,' + (0.35 + 0.6 * a).toFixed(3) + ')';
        ncRect(ctx, V, -0.95 + cx * 0.49, -0.95 + cy * 0.49, z1 + 0.181, 0.4, 0.4); ctx.fill();
      }
    }
    if (landFlash[1] > 0) ncFlash(ctx, V, 1.1, 0.34, landFlash[1], u);

    var z2 = 0.52 + lift[2];
    ncBox(ctx, V, -1.6, -1.6, z2, 3.2, 3.2, 0.3, '#D3DEE9', '#9DB0C3', '#7488A0', '#0B1A2A', lw);
    ctx.strokeStyle = 'rgba(80,100,125,0.6)'; ctx.lineWidth = 1.2 * u;
    ncRect(ctx, V, -1.35, -1.35, z2 + 0.301, 2.7, 2.7); ctx.stroke();
    ctx.fillStyle = '#B7C5D4';
    ncRect(ctx, V, -0.75, -0.75, z2 + 0.301, 1.5, 1.5); ctx.fill();
    ctx.strokeStyle = '#7488A0'; ctx.lineWidth = 1 * u;
    ncRect(ctx, V, -0.75, -0.75, z2 + 0.301, 1.5, 1.5); ctx.stroke();

    var glowA = Math.max(energy * 0.45, corePulse);
    if (glowA > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(63,242,255,' + (0.35 * glowA * (0.7 + 0.3 * Math.sin(NC_TAU * loopT / 1.25))).toFixed(3) + ')';
      ncRect(ctx, V, -0.75, -0.75, z2 + 0.302, 1.5, 1.5); ctx.fill();
      for (var rg = 0; rg < 3; rg++) {
        var rf = ncFrac(loopT * 0.8 + rg / 3);
        var rr = 0.75 + rf * 1.6;
        ctx.strokeStyle = 'rgba(63,242,255,' + (corePulse * (1 - rf) * 0.9).toFixed(3) + ')';
        ctx.lineWidth = (2.5 - rf * 1.5) * u;
        ncRect(ctx, V, -rr, -rr, z2 + 0.303, rr * 2, rr * 2); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(63,242,255,' + (0.8 * glowA).toFixed(3) + ')';
      ctx.lineWidth = 2 * u;
      ncRect(ctx, V, -1.6, -1.6, z2 + 0.301, 3.2, 3.2); ctx.stroke();
      ctx.restore();
    }
    if (landFlash[2] > 0) ncFlash(ctx, V, 1.6, 0.52, landFlash[2], u);
  } });

  items.sort(function (a, b) { return a.key - b.key; });
  for (var it = 0; it < items.length; it++) items[it].fn();

  var vg = ctx.createRadialGradient(width * 0.5, height * 0.5, minSide * 0.45, width * 0.5, height * 0.5, Math.max(width, height) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(2,5,12,' + (0.55 - 0.1 * sceneAccent).toFixed(3) + ')');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

function ncFlash(ctx, V, half, z, a, u) {
  var r = half + (1 - a) * 1.4;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(63,242,255,' + (0.9 * a).toFixed(3) + ')';
  ctx.lineWidth = (1 + 3 * a) * u;
  ncRect(ctx, V, -r, -r, z, r * 2, r * 2); ctx.stroke();
  ctx.restore();
}
