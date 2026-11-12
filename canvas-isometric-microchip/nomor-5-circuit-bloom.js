// Nomor 5 — Circuit Bloom | 15 s | 3 scene | 16:9 | Canvas API murni

var CB_C30 = 0.8660254037844386;
var CB_TAU = Math.PI * 2;
var CB_DATA = null;

function cbClamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function cbSmooth(a, b, v) { var x = cbClamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
function cbEaseInOut(x) { x = cbClamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function cbEaseOutBack(x) { x = cbClamp(x, 0, 1); var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
function cbEaseIn(x) { x = cbClamp(x, 0, 1); return x * x * x; }
function cbHash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function cbFrac(v) { return v - Math.floor(v); }

function cbP(V, x, y, z) {
  return [V.cx + (x - y) * CB_C30 * V.s, V.cy + (x + y) * 0.5 * V.s - z * V.s];
}

function cbQuad(ctx, a, b, c, d) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  ctx.closePath();
}

function cbRect(ctx, V, x, y, z, w, d) {
  cbQuad(ctx, cbP(V, x, y, z), cbP(V, x + w, y, z), cbP(V, x + w, y + d, z), cbP(V, x, y + d, z));
}

function cbBox(ctx, V, x, y, z, w, d, h, top, left, right, stroke, lw) {
  var a = cbP(V, x, y, z + h), b = cbP(V, x + w, y, z + h), c = cbP(V, x + w, y + d, z + h), e = cbP(V, x, y + d, z + h);
  var f = cbP(V, x, y + d, z), g = cbP(V, x + w, y + d, z), k = cbP(V, x + w, y, z);
  ctx.fillStyle = left; cbQuad(ctx, e, c, g, f); ctx.fill();
  ctx.fillStyle = right; cbQuad(ctx, c, b, k, g); ctx.fill();
  ctx.fillStyle = top; cbQuad(ctx, a, b, c, e); ctx.fill();
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

function cbCyl(ctx, V, x, y, z, r, h, top, side, dark, stroke, lw) {
  var b = cbP(V, x, y, z), t = cbP(V, x, y, z + h);
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
  ctx.beginPath(); ctx.ellipse(t[0], t[1], rx, ry, 0, 0, CB_TAU); ctx.fill();
  if (stroke) ctx.stroke();
  return [t, rx, ry];
}

function cbEll(ctx, V, x, y, z, r) {
  var c = cbP(V, x, y, z);
  ctx.beginPath(); ctx.ellipse(c[0], c[1], r * V.s * 1.2247, r * V.s * 0.7071, 0, 0, CB_TAU);
}

function cbAt(tr, f) {
  var d = cbClamp(f, 0, 1) * tr.L, pts = tr.pts;
  for (var i = 0; i < tr.seg.length; i++) {
    if (d <= tr.seg[i] || i === tr.seg.length - 1) {
      var k = tr.seg[i] > 0 ? Math.min(1, d / tr.seg[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= tr.seg[i];
  }
  return pts[pts.length - 1];
}

function cbSubPath(ctx, V, tr, f0, f1, z) {
  if (f1 <= f0) return;
  var d0 = f0 * tr.L, d1 = f1 * tr.L, acc = 0;
  var p = cbAt(tr, f0), s = cbP(V, p[0], p[1], z);
  ctx.moveTo(s[0], s[1]);
  for (var i = 0; i < tr.seg.length; i++) {
    acc += tr.seg[i];
    if (acc > d0 && acc < d1) { s = cbP(V, tr.pts[i + 1][0], tr.pts[i + 1][1], z); ctx.lineTo(s[0], s[1]); }
  }
  p = cbAt(tr, f1); s = cbP(V, p[0], p[1], z); ctx.lineTo(s[0], s[1]);
}

function cbBuild() {
  var traces = [];
  var sides = [[1, 0], [0, -1], [-1, 0], [0, 1]];
  var n = 6, j = 0;
  for (var si = 0; si < 4; si++) {
    var dir = sides[si];
    for (var k = 0; k < n; k++) {
      var o = (k - (n - 1) / 2) * 0.55;
      var lat2 = o * 2.2, diag = Math.abs(lat2 - o);
      var end = 4.7 + cbHash(j * 4.3 + 2) * 1.6;
      var loc = [[2.3, o], [2.75, o], [2.75 + diag, lat2], [end, lat2]];
      var pts = [];
      for (var q = 0; q < loc.length; q++) {
        var a = loc[q][0], b = loc[q][1];
        pts.push(dir[0] !== 0 ? [dir[0] * a, b] : [b, dir[1] * a]);
      }
      var seg = [], L = 0;
      for (var i = 1; i < pts.length; i++) { var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
      var ep = pts[pts.length - 1];
      traces.push({
        pts: pts, seg: seg, L: L, dir: dir, j: j, k: k, side: si,
        end: ep, comp: [ep[0] + dir[0] * 0.62, ep[1] + dir[1] * 0.62],
        type: Math.floor(cbHash(j * 7.7 + 1) * 4), power: k === 0 || k === n - 1,
        h: cbHash(j * 2.1 + 5)
      });
      j++;
    }
  }
  var order = traces.map(function (tr, i) { return { i: i, r: cbHash(i * 9.3 + 0.7) }; });
  order.sort(function (a, b) { return a.r - b.r; });
  for (var oi = 0; oi < order.length; oi++) traces[order[oi].i].order = oi;
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
  if (!CB_DATA) CB_DATA = cbBuild();
  var D = CB_DATA;

  var minSide = Math.min(width, height);
  var u = minSide / 1080;
  var lw = 1.5 * u;
  var ph = loopT / duration;

  var current = cbSmooth(4.6, 6.0, loopT) * (1 - cbSmooth(11.6, 12.6, loopT));
  var bloom = cbSmooth(9.7, 10.5, loopT) * (1 - cbSmooth(11.8, 12.8, loopT));
  var sceneGlow = currentScene === 0 ? 0.35 * sceneProgress : currentScene === 1 ? 0.35 + 0.4 * sceneProgress : 0.75 * (1 - sceneProgress);

  var s = Math.min(width * 0.84 / 26, height * 0.8 / 15.6);
  var V = { cx: width * 0.5, cy: height * 0.52 + Math.sin(CB_TAU * ph * 3) * 0.006 * height, s: s };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  var bg = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
  bg.addColorStop(0, '#16442F');
  bg.addColorStop(0.55, '#0A2419');
  bg.addColorStop(1, '#04100B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (var sp = 0; sp < 34; sp++) {
    var sf = cbFrac(cbHash(sp * 3.9) + ph * (1 + (sp % 2)));
    var sx = width * cbHash(sp * 6.1) + Math.sin(CB_TAU * (ph * 2 + cbHash(sp))) * 10 * u;
    var sy = height * (1.03 - sf * 1.06);
    var sa = Math.sin(Math.PI * sf) * 0.28;
    ctx.fillStyle = 'rgba(255,205,120,' + sa.toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(sx, sy, (1.2 + cbHash(sp * 2) * 1.8) * u, 0, CB_TAU); ctx.fill();
  }
  ctx.restore();

  cbBox(ctx, V, -7.9, -7.9, -0.95, 15.8, 15.8, 0.35, '#0B2A1E', '#082017', '#061710', 'rgba(110,210,150,0.25)', lw);
  cbBox(ctx, V, -7.5, -7.5, -0.6, 15, 15, 0.6, '#0F3627', '#0B291D', '#081E15', '#3FAE7A', lw);

  ctx.fillStyle = '#D9A548';
  for (var fg = 0; fg < 16; fg++) {
    var fx = -6.2 + fg * 0.8;
    var f1 = cbP(V, fx, 7.5, -0.5), f2 = cbP(V, fx + 0.48, 7.5, -0.5), f3 = cbP(V, fx + 0.48, 7.5, -0.1), f4 = cbP(V, fx, 7.5, -0.1);
    cbQuad(ctx, f1, f2, f3, f4); ctx.fill();
  }

  ctx.strokeStyle = 'rgba(120,220,160,0.06)';
  ctx.lineWidth = 1 * u;
  ctx.beginPath();
  for (var gl = -7; gl <= 7; gl += 0.5) {
    var g1 = cbP(V, gl, -7.3, 0), g2 = cbP(V, gl, 7.3, 0), g3 = cbP(V, -7.3, gl, 0), g4 = cbP(V, 7.3, gl, 0);
    ctx.moveTo(g1[0], g1[1]); ctx.lineTo(g2[0], g2[1]);
    ctx.moveTo(g3[0], g3[1]); ctx.lineTo(g4[0], g4[1]);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(230,240,220,0.35)';
  ctx.lineWidth = 1.3 * u;
  ctx.beginPath();
  var corner = [[-7.1, -6.4, -7.1, -7.1, -6.4, -7.1], [6.4, -7.1, 7.1, -7.1, 7.1, -6.4], [7.1, 6.4, 7.1, 7.1, 6.4, 7.1], [-6.4, 7.1, -7.1, 7.1, -7.1, 6.4]];
  for (var cc = 0; cc < 4; cc++) {
    var c0 = corner[cc];
    var q1 = cbP(V, c0[0], c0[1], 0.001), q2 = cbP(V, c0[2], c0[3], 0.001), q3 = cbP(V, c0[4], c0[5], 0.001);
    ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.lineTo(q3[0], q3[1]);
  }
  ctx.stroke();

  var holes = [[-6.5, -6.5], [6.5, -6.5], [6.5, 6.5], [-6.5, 6.5]];
  for (var hi = 0; hi < 4; hi++) {
    ctx.fillStyle = '#D9A548'; cbEll(ctx, V, holes[hi][0], holes[hi][1], 0.001, 0.36); ctx.fill();
    ctx.fillStyle = '#04100B'; cbEll(ctx, V, holes[hi][0], holes[hi][1], 0.002, 0.2); ctx.fill();
  }

  var traces = D.traces;
  var grow = [], viaS = [], compS = [];
  for (var ti = 0; ti < traces.length; ti++) {
    var tr = traces[ti], o = tr.order;
    var gStart = 0.3 + o * 0.075, gDur = 1.8;
    var rStart = 12.1 + o * 0.05, rDur = 1.55;
    var g = loopT < rStart ? cbEaseInOut((loopT - gStart) / gDur) : 1 - cbEaseInOut((loopT - rStart) / rDur);
    grow.push(g);
    var vIn = cbEaseOutBack((loopT - (gStart + gDur * 0.92)) / 0.45);
    var vOut = cbEaseIn((loopT - (rStart - 0.35)) / 0.35);
    viaS.push(Math.max(0, vIn * (1 - vOut)));
    var cIn = cbEaseOutBack((loopT - (5.0 + o * 0.1)) / 0.55);
    var cOut = cbEaseIn((loopT - (10.9 + o * 0.045)) / 0.45);
    compS.push(Math.max(0, cIn * (1 - cOut)));
  }

  ctx.save();
  ctx.setLineDash([4 * u, 6 * u]);
  ctx.strokeStyle = 'rgba(217,165,72,0.16)';
  ctx.lineWidth = 1.4 * u;
  ctx.beginPath();
  for (ti = 0; ti < traces.length; ti++) cbSubPath(ctx, V, traces[ti], 0, 1, 0.003);
  ctx.stroke();
  ctx.restore();

  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  var widths = [[6.4, 4.6, 1.6], [4.6, 3.0, 1.1]];
  var strokes = ['#4A2E0E', '#D18E3A', '#FFD98C'];
  for (var pass = 0; pass < 3; pass++) {
    for (var wt = 0; wt < 2; wt++) {
      ctx.strokeStyle = strokes[pass];
      ctx.lineWidth = widths[wt][pass] * u;
      ctx.beginPath();
      for (ti = 0; ti < traces.length; ti++) {
        if ((traces[ti].power ? 0 : 1) !== wt || grow[ti] < 0.002) continue;
        cbSubPath(ctx, V, traces[ti], 0, grow[ti], 0.004);
      }
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (ti = 0; ti < traces.length; ti++) {
    tr = traces[ti];
    g = grow[ti];
    var growing = (loopT < 5 && g > 0.001 && g < 0.999);
    if (growing) {
      var hp = cbAt(tr, g), hs = cbP(V, hp[0], hp[1], 0.004);
      ctx.fillStyle = 'rgba(255,200,110,0.25)';
      ctx.beginPath(); ctx.arc(hs[0], hs[1], 10 * u, 0, CB_TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,245,210,0.95)';
      ctx.beginPath(); ctx.arc(hs[0], hs[1], 3.2 * u, 0, CB_TAU); ctx.fill();
    }
    if (current > 0.01 && g > 0.05) {
      for (var dk = 0; dk < 2; dk++) {
        var f = cbFrac(ph * 5 + tr.h + dk * 0.5);
        if (f > g) continue;
        var wp = cbAt(tr, f), spt = cbP(V, wp[0], wp[1], 0.005);
        var da = current * Math.sin(Math.PI * f);
        ctx.fillStyle = 'rgba(255,190,90,' + (0.3 * da).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(spt[0], spt[1], 8 * u, 0, CB_TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,250,225,' + (0.95 * da).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(spt[0], spt[1], 2.6 * u, 0, CB_TAU); ctx.fill();
      }
    }
  }
  ctx.restore();

  for (ti = 0; ti < traces.length; ti++) {
    var vs = viaS[ti];
    if (vs < 0.01) continue;
    var en = traces[ti].end;
    ctx.fillStyle = '#E2AE55'; cbEll(ctx, V, en[0], en[1], 0.006, 0.24 * vs); ctx.fill();
    ctx.strokeStyle = '#4A2E0E'; ctx.lineWidth = 1.2 * u; ctx.stroke();
    ctx.fillStyle = '#06140E'; cbEll(ctx, V, en[0], en[1], 0.007, 0.1 * vs); ctx.fill();
  }

  if (bloom > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var rg = 0; rg < 3; rg++) {
      var rf = cbFrac(loopT * 0.6 + rg / 3);
      var rr = 2.3 + rf * 4.6;
      ctx.strokeStyle = 'rgba(255,200,110,' + (bloom * (1 - rf) * 0.55).toFixed(3) + ')';
      ctx.lineWidth = (3 - 2 * rf) * u;
      cbRect(ctx, V, -rr, -rr, 0.008, rr * 2, rr * 2); ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.setLineDash([10 * u, 8 * u]);
  ctx.lineDashOffset = -ph * 18 * u * 12;
  ctx.strokeStyle = 'rgba(140,240,180,' + (0.25 + 0.3 * sceneGlow).toFixed(3) + ')';
  ctx.lineWidth = 1.4 * u;
  cbEll(ctx, V, 0, 0, 0.003, 3.25); ctx.stroke();
  ctx.restore();

  var items = [];
  traces.forEach(function (tr2, idx) {
    items.push({ key: tr2.comp[0] + tr2.comp[1], fn: function () {
      var sc = compS[idx];
      if (sc < 0.01) return;
      var cx = tr2.comp[0], cy = tr2.comp[1], dir = tr2.dir;
      var along = dir[0] !== 0;
      var lit = current * (0.55 + 0.45 * Math.sin(CB_TAU * (ph * 6) + idx));
      if (tr2.type === 0) {
        var L = 0.8 * sc, W = 0.38 * sc, H = 0.24 * sc;
        var bx = along ? cx - L / 2 : cx - W / 2, by = along ? cy - W / 2 : cy - L / 2;
        var bw = along ? L : W, bd = along ? W : L;
        cbBox(ctx, V, bx, by, 0, bw, bd, H, '#1C1F22', '#141618', '#0E1011', '#0A0A0A', lw * 0.8);
        ctx.fillStyle = '#C9CED3';
        if (along) { cbRect(ctx, V, bx, by, H + 0.001, bw * 0.18, bd); ctx.fill(); cbRect(ctx, V, bx + bw * 0.82, by, H + 0.001, bw * 0.18, bd); ctx.fill(); }
        else { cbRect(ctx, V, bx, by, H + 0.001, bw, bd * 0.18); ctx.fill(); cbRect(ctx, V, bx, by + bd * 0.82, H + 0.001, bw, bd * 0.18); ctx.fill(); }
      } else if (tr2.type === 1) {
        var top = cbCyl(ctx, V, cx, cy, 0, 0.3 * sc, 0.72 * sc, '#D7DEE5', '#2E6FB0', '#1F4E80', '#0B1A2A', lw * 0.8);
        ctx.strokeStyle = '#8796A6'; ctx.lineWidth = 1.2 * u;
        ctx.beginPath();
        ctx.moveTo(top[0][0] - top[1] * 0.5, top[0][1]); ctx.lineTo(top[0][0] + top[1] * 0.5, top[0][1]);
        ctx.moveTo(top[0][0], top[0][1] - top[2] * 0.5); ctx.lineTo(top[0][0], top[0][1] + top[2] * 0.5);
        ctx.stroke();
      } else if (tr2.type === 2) {
        var r = 0.26 * sc;
        cbBox(ctx, V, cx - r, cy - r, 0, r * 2, r * 2, 0.16 * sc, '#E8E3D6', '#BDB6A4', '#9B9584', '#2A2418', lw * 0.8);
        var on = 0.25 + 0.75 * lit;
        var dome = cbCyl(ctx, V, cx, cy, 0.16 * sc, r * 0.7, 0.18 * sc,
          'rgba(' + Math.round(120 + 135 * on) + ',' + Math.round(200 + 55 * on) + ',' + Math.round(150 + 60 * on) + ',1)',
          'rgba(60,170,110,1)', 'rgba(40,130,85,1)', null, 0);
        if (on > 0.3) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(120,255,170,' + (0.28 * on).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(dome[0][0], dome[0][1], (10 + 10 * on) * u * sc, 0, CB_TAU); ctx.fill();
          ctx.restore();
        }
      } else {
        var q = 0.36 * sc;
        ctx.fillStyle = '#D9A548';
        for (var pn = 0; pn < 3; pn++) {
          var po = -q + (pn + 0.5) * (q * 2 / 3) - 0.05 * sc;
          cbRect(ctx, V, cx + po, cy + q, 0.004, 0.1 * sc, 0.14 * sc); ctx.fill();
          cbRect(ctx, V, cx + q, cy + po, 0.004, 0.14 * sc, 0.1 * sc); ctx.fill();
          cbRect(ctx, V, cx + po, cy - q - 0.14 * sc, 0.004, 0.1 * sc, 0.14 * sc); ctx.fill();
          cbRect(ctx, V, cx - q - 0.14 * sc, cy + po, 0.004, 0.14 * sc, 0.1 * sc); ctx.fill();
        }
        cbBox(ctx, V, cx - q, cy - q, 0, q * 2, q * 2, 0.22 * sc, '#262C33', '#1B2025', '#13171B', '#0A0C0E', lw * 0.8);
        ctx.fillStyle = 'rgba(255,200,110,' + (0.15 + 0.7 * lit).toFixed(3) + ')';
        cbEll(ctx, V, cx - q * 0.55, cy - q * 0.55, 0.221 * sc, 0.06 * sc); ctx.fill();
      }
    } });
  });

  items.push({ key: 0, fn: function () {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    cbRect(ctx, V, -2.05, -2.05, 0.004, 4.45, 4.45); ctx.fill();
    for (var tq = 0; tq < traces.length; tq++) {
      var p0 = traces[tq].pts[0], dr = traces[tq].dir;
      var px = dr[0] !== 0 ? (dr[0] > 0 ? 1.9 : -2.3) : p0[0] - 0.09;
      var py = dr[0] !== 0 ? p0[1] - 0.09 : (dr[1] > 0 ? 1.9 : -2.3);
      var pw = dr[0] !== 0 ? 0.4 : 0.18, pd = dr[0] !== 0 ? 0.18 : 0.4;
      cbBox(ctx, V, px, py, 0.004, pw, pd, 0.06, '#E8B75E', '#B98633', '#946A26', null, 0);
    }
    cbBox(ctx, V, -1.95, -1.95, 0, 3.9, 3.9, 0.12, '#14361F', '#0F2A18', '#0B2012', '#3FAE7A', lw);
    cbBox(ctx, V, -1.75, -1.75, 0.12, 3.5, 3.5, 0.42, '#23292F', '#1A1F24', '#121619', '#05070A', lw * 1.1);

    var zt = 0.541;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1 * u;
    cbRect(ctx, V, -1.5, -1.5, zt, 3.0, 3.0); ctx.stroke();
    ctx.fillStyle = 'rgba(230,235,240,0.5)';
    cbEll(ctx, V, -1.25, -1.25, zt, 0.1); ctx.fill();

    var energy = Math.max(sceneGlow, bloom);
    ctx.fillStyle = '#5A3A14';
    cbRect(ctx, V, -0.95, -0.95, zt, 1.9, 1.9); ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var ring = 0; ring < 4; ring++) {
      var rfr = cbFrac(ph * 6 - ring / 4);
      var rs = 0.15 + rfr * 0.8;
      ctx.strokeStyle = 'rgba(255,190,90,' + ((1 - rfr) * (0.35 + 0.6 * energy)).toFixed(3) + ')';
      ctx.lineWidth = 1.6 * u;
      cbRect(ctx, V, -rs, -rs, zt + 0.001, rs * 2, rs * 2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,215,140,' + (0.25 + 0.6 * energy * (0.6 + 0.4 * Math.sin(CB_TAU * ph * 10))).toFixed(3) + ')';
    cbRect(ctx, V, -0.22, -0.22, zt + 0.002, 0.44, 0.44); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#D18E3A'; ctx.lineWidth = 1.4 * u;
    cbRect(ctx, V, -0.95, -0.95, zt + 0.002, 1.9, 1.9); ctx.stroke();

    if (bloom > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var top0 = cbP(V, 0, 0, zt), bh = minSide * 0.22 * bloom;
      var lg = ctx.createLinearGradient(0, top0[1], 0, top0[1] - bh);
      lg.addColorStop(0, 'rgba(255,200,110,' + (0.35 * bloom).toFixed(3) + ')');
      lg.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = lg;
      var bw2 = 0.95 * s * CB_C30 * 2;
      ctx.beginPath();
      ctx.moveTo(top0[0] - bw2, top0[1]); ctx.lineTo(top0[0] + bw2, top0[1]);
      ctx.lineTo(top0[0] + bw2 * 0.4, top0[1] - bh); ctx.lineTo(top0[0] - bw2 * 0.4, top0[1] - bh);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  } });

  items.sort(function (a, b) { return a.key - b.key; });
  for (var it = 0; it < items.length; it++) items[it].fn();

  var vg = ctx.createRadialGradient(width * 0.5, height * 0.5, minSide * 0.45, width * 0.5, height * 0.5, Math.max(width, height) * 0.76);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(2,8,5,0.6)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
