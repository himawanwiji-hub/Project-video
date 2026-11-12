// Nomor 2 — Container Yard Grid | 15 s | 3 scene | 16:9 | Canvas API murni

var CY_C30 = 0.8660254037844386;
var CY_TAU = Math.PI * 2;
var CY_FONT = '"Inter","Montserrat","Segoe UI","Helvetica Neue",Arial,sans-serif';
var CY_DATA = null;

function cyClamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function cySmooth(a, b, v) { var x = cyClamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
function cyEaseOut(x) { x = cyClamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); }
function cyEaseInOut(x) { x = cyClamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function cyHash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function cyFrac(v) { return v - Math.floor(v); }
function cyLerp(a, b, k) { return a + (b - a) * k; }

function cyShade(hex, f) {
  var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
}
function cyTriad(hex) { return [cyShade(hex, 0.18), hex, cyShade(hex, -0.22)]; }

function cyP(V, x, y, z) {
  return [V.cx + (x - y) * CY_C30 * V.s, V.cy + (x + y) * 0.5 * V.s - z * V.s];
}

function cyPoly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function cyRect(ctx, V, x, y, z, w, d) {
  cyPoly(ctx, [cyP(V, x, y, z), cyP(V, x + w, y, z), cyP(V, x + w, y + d, z), cyP(V, x, y + d, z)]);
}

function cyBox(ctx, V, x, y, z, w, d, h, tri, stroke, lw) {
  var a = cyP(V, x, y, z + h), b = cyP(V, x + w, y, z + h), c = cyP(V, x + w, y + d, z + h), e = cyP(V, x, y + d, z + h);
  var f = cyP(V, x, y + d, z), g = cyP(V, x + w, y + d, z), k = cyP(V, x + w, y, z);
  ctx.fillStyle = tri[1]; cyPoly(ctx, [e, c, g, f]); ctx.fill();
  ctx.fillStyle = tri[2]; cyPoly(ctx, [c, b, k, g]); ctx.fill();
  ctx.fillStyle = tri[0]; cyPoly(ctx, [a, b, c, e]); ctx.fill();
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

function cyRR(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

var CY_L = 1.0, CY_W = 0.44, CY_H = 0.46, CY_TZ = 0.47;

function cyBuild() {
  var pal = ['#2BB3A3', '#F2B430', '#F07A3A', '#E9573F', '#3E7CB1', '#EFE6D6', '#2F333B'];
  var tris = pal.map(cyTriad);
  var yb = [-4, 0, 4];
  var jobs = [
    { a: [2, 1], b: [8, 3], park: -5.2, code: 'A-07' },
    { a: [9, 4], b: [3, 1], park: 0.9, code: 'B-12' },
    { a: [4, 2], b: [10, 0], park: 5.1, code: 'C-03' }
  ];
  var blocks = [];
  for (var j = 0; j < 3; j++) {
    var stacks = [];
    for (var b = 0; b < 12; b++) {
      for (var r = 0; r < 5; r++) {
        var n = 1 + Math.floor(cyHash(j * 101 + b * 13 + r * 7 + 1) * 4);
        if (b === jobs[j].a[0] && r === jobs[j].a[1]) n = Math.max(2, Math.min(n, 3));
        if (b === jobs[j].b[0] && r === jobs[j].b[1]) n = Math.min(n, 2);
        var cols = [];
        for (var k = 0; k < n; k++) cols.push(Math.floor(cyHash(j * 31 + b * 17 + r * 5 + k * 3) * 7));
        stacks.push({ b: b, r: r, x: -6.44 + b * 1.08, y: yb[j] - 1.22 + r * 0.5, n: n, cols: cols });
      }
    }
    stacks.sort(function (p, q) { return (p.x + p.y) - (q.x + q.y); });
    blocks.push({ yb: yb[j], stacks: stacks });
  }
  return { tris: tris, blocks: blocks, jobs: jobs };
}

function cyJobState(j, job, blk, loopT) {
  var s0 = 5.0 + j * 0.25, F = 4.2, s1 = 10.0 + j * 0.25, R = 3.2, pe = s1 + R + 0.05, pf = 14.6;
  var xA = -6.44 + job.a[0] * 1.08 + CY_L / 2, yA = blk.yb - 1.22 + job.a[1] * 0.5 + CY_W / 2;
  var xB = -6.44 + job.b[0] * 1.08 + CY_L / 2, yB = blk.yb - 1.22 + job.b[1] * 0.5 + CY_W / 2;
  var stA = null, stB = null;
  for (var i = 0; i < blk.stacks.length; i++) {
    var st = blk.stacks[i];
    if (st.b === job.a[0] && st.r === job.a[1]) stA = st;
    if (st.b === job.b[0] && st.r === job.b[1]) stB = st;
  }
  var zt = 2.3;
  var zA = stA.n * CY_TZ, zB = (stB.n + 1) * CY_TZ;
  var o = { X: job.park, ty: blk.yb, hz: zt, carry: false, aTop: true, bExtra: false, active: false, color: stA.cols[stA.n - 1], stA: stA, stB: stB };
  function run(c, x0, y0, z0, x1, y1, z1) {
    if (c < 0.2) { var k = cyEaseInOut(c / 0.2); return [cyLerp(o.X0, x0, k), cyLerp(o.Y0, y0, k), zt]; }
    if (c < 0.32) return [x0, y0, cyLerp(zt, z0, cyEaseInOut((c - 0.2) / 0.12))];
    if (c < 0.36) return [x0, y0, z0];
    if (c < 0.48) return [x0, y0, cyLerp(z0, zt, cyEaseInOut((c - 0.36) / 0.12))];
    if (c < 0.68) { var k2 = cyEaseInOut((c - 0.48) / 0.2); return [cyLerp(x0, x1, k2), cyLerp(y0, y1, k2), zt]; }
    if (c < 0.8) return [x1, y1, cyLerp(zt, z1, cyEaseInOut((c - 0.68) / 0.12))];
    if (c < 0.84) return [x1, y1, z1];
    return [x1, y1, cyLerp(z1, zt, cyEaseInOut((c - 0.84) / 0.16))];
  }
  var res;
  if (loopT >= s0 && loopT < s0 + F) {
    o.X0 = job.park; o.Y0 = blk.yb;
    var c = (loopT - s0) / F;
    res = run(c, xA, yA, zA, xB, yB, zB);
    o.active = true;
    o.carry = c >= 0.32 && c < 0.8;
    o.aTop = c < 0.32;
    o.bExtra = c >= 0.8;
  } else if (loopT >= s0 + F && loopT < s1) {
    res = [xB, yB, zt]; o.aTop = false; o.bExtra = true;
  } else if (loopT >= s1 && loopT < s1 + R) {
    o.X0 = xB; o.Y0 = yB;
    var c2 = (loopT - s1) / R;
    res = run(c2, xB, yB, zB, xA, yA, zA);
    o.active = true;
    o.carry = c2 >= 0.32 && c2 < 0.8;
    o.aTop = c2 >= 0.8;
    o.bExtra = c2 < 0.32;
  } else if (loopT >= s1 + R && loopT < pf) {
    var k3 = cyEaseInOut((loopT - pe) / (pf - pe));
    res = [cyLerp(xA, job.park, k3), cyLerp(yA, blk.yb, k3), zt];
  } else {
    res = [job.park, blk.yb, zt];
  }
  o.X = res[0]; o.ty = res[1]; o.hz = res[2];
  return o;
}

function cyTruck(ctx, V, x, y, dir, loaded, ctri, cabCol, lw, INK) {
  var cabT = cyTriad(cabCol);
  var dark = ['#3B3F47', '#2F333B', '#23262C'];
  var w = 0.5;
  var cx0 = dir > 0 ? x + 0.5 : x - 1.04;
  cyBox(ctx, V, x - 0.62, y - w / 2, 0.2, 1.1, w, 0.12, dark, INK, lw);
  cyBox(ctx, V, x - 0.5, y + w / 2 - 0.02, 0, 0.3, 0.06, 0.2, dark, null, 0);
  cyBox(ctx, V, x + 0.12, y + w / 2 - 0.02, 0, 0.3, 0.06, 0.2, dark, null, 0);
  if (loaded) cyBox(ctx, V, x - 0.58, y - CY_W / 2, 0.32, CY_L, CY_W, CY_H, ctri, INK, lw * 0.8);
  cyBox(ctx, V, cx0, y - w / 2 - 0.02, 0.1, 0.54, w + 0.04, 0.56, cabT, INK, lw);
  var gx = dir > 0 ? cx0 + 0.54 : cx0;
  if (dir > 0) {
    ctx.fillStyle = '#BFE8F0';
    cyPoly(ctx, [cyP(V, gx, y - 0.2, 0.42), cyP(V, gx, y + 0.2, 0.42), cyP(V, gx, y + 0.2, 0.6), cyP(V, gx, y - 0.2, 0.6)]); ctx.fill();
  } else {
    ctx.fillStyle = '#BFE8F0';
    cyPoly(ctx, [cyP(V, cx0 + 0.08, y + w / 2 + 0.02, 0.42), cyP(V, cx0 + 0.3, y + w / 2 + 0.02, 0.42), cyP(V, cx0 + 0.3, y + w / 2 + 0.02, 0.6), cyP(V, cx0 + 0.08, y + w / 2 + 0.02, 0.6)]); ctx.fill();
  }
}

function draw(ctx, time, width, height) {
  var t = time;
  var duration = 15;
  var sceneCount = 3;
  var loopT = ((t % duration) + duration) % duration;
  var sceneDuration = duration / sceneCount;
  var currentScene = Math.floor(loopT / sceneDuration);
  var sceneProgress = (loopT % sceneDuration) / sceneDuration;
  if (!CY_DATA) CY_DATA = cyBuild();
  var D = CY_DATA;

  var minSide = Math.min(width, height);
  var u = minSide / 1080;
  var lw = 1.2 * u;
  var ph = loopT / duration;
  var INK = '#1F2228';
  var tris = D.tris;

  var s = Math.min(width * 0.74 / 25.1, height * 0.8 / 17.5);
  var V = { cx: width * 0.56, cy: height * 0.57 + Math.sin(CY_TAU * ph) * 0.006 * height, s: s };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.lineCap = 'round';

  ctx.fillStyle = '#DDF3EC';
  ctx.fillRect(0, 0, width, height);
  var glow = ctx.createRadialGradient(width * 0.58, height * 0.5, 0, width * 0.58, height * 0.5, Math.max(width, height) * 0.65);
  glow.addColorStop(0, 'rgba(255,255,255,0.6)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(43,179,163,0.12)';
  ctx.lineWidth = 1 * u;
  ctx.beginPath();
  var go = cyFrac(ph * 2) * 2;
  for (var gi = -30; gi <= 30; gi += 2) {
    var a1 = cyP(V, gi + go, -30, -1.4), a2 = cyP(V, gi + go, 30, -1.4);
    var b1 = cyP(V, -30, gi + go, -1.4), b2 = cyP(V, 30, gi + go, -1.4);
    ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]);
    ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]);
  }
  ctx.stroke();

  cyBox(ctx, V, -8.5, -7.0, -1.1, 17, 14, 0.55, ['#2BB3A3', '#24A090', '#1C8174'], INK, lw);
  cyBox(ctx, V, -8, -6.5, -0.55, 16, 13, 0.55, ['#353840', '#2A2D33', '#202227'], INK, lw);

  ctx.fillStyle = '#F2C230';
  var curb = [[-8, -6.5, 16, 0.12], [-8, 6.38, 16, 0.12], [-8, -6.5, 0.12, 13], [7.88, -6.5, 0.12, 13]];
  for (var cb = 0; cb < 4; cb++) { cyRect(ctx, V, curb[cb][0], curb[cb][1], 0.002, curb[cb][2], curb[cb][3]); ctx.fill(); }

  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.5 * u;
  ctx.setLineDash([9 * u, 9 * u]);
  ctx.lineDashOffset = -ph * 18 * u * 10;
  ctx.beginPath();
  [-2.0, 2.0].forEach(function (ly) { var p1 = cyP(V, -7.8, ly, 0.003), p2 = cyP(V, 7.8, ly, 0.003); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); });
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.2 * u;
  ctx.beginPath();
  for (var bl = 0; bl < 3; bl++) {
    var yb0 = D.blocks[bl].yb;
    for (var rl = 0; rl < 2; rl++) {
      var ly = yb0 + (rl === 0 ? -1.55 : 1.55);
      var q1 = cyP(V, -7.6, ly, 0.003), q2 = cyP(V, 7.6, ly, 0.003);
      ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]);
    }
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (bl = 0; bl < 3; bl++) {
    for (var bb = 0; bb < 12; bb++) {
      cyRect(ctx, V, -6.44 + bb * 1.08 - 0.02, D.blocks[bl].yb - 1.26, 0.002, CY_L + 0.04, 2.48); ctx.fill();
    }
  }

  var scanX = loopT < 10.4 ? -9 : cyLerp(-7.6, 7.6, cyEaseInOut((loopT - 10.4) / 2.8));
  var scanFade = cySmooth(10.2, 10.6, loopT) * (1 - cySmooth(13.3, 14.0, loopT));

  var present = 0, total = 0;
  var jobsState = [];
  for (var j = 0; j < 3; j++) jobsState.push(cyJobState(j, D.jobs[j], D.blocks[j], loopT));

  var tags = [];
  var lanes = [{ y: -2.0, dir: 1 }, { y: 2.0, dir: -1 }];

  for (j = 0; j < 3; j++) {
    var blk = D.blocks[j], js = jobsState[j];
    var X = js.X, yb = blk.yb;

    cyRtgSide(ctx, V, X, yb - 1.55, lw, INK);

    var items = [];
    for (var si = 0; si < blk.stacks.length; si++) {
      var st = blk.stacks[si];
      var n = st.n;
      var hasTop = !(st === js.stA && !js.aTop);
      var cnt = hasTop ? n : n - 1;
      var zAcc = 0;
      var stackItems = [];
      for (var k = 0; k < cnt; k++) {
        total += 1;
        var hScale = 1, dz = 0, vis = true;
        if (k >= 1) {
          var d0 = 0.3 + (st.x + 6.5) / 13 * 2.0 + (yb + 4) / 8 * 0.4 + k * 0.22;
          var pd = (loopT - d0) / 0.7;
          if (pd <= 0) vis = false;
          dz = 3.2 * (1 - cyEaseOut(pd));
          var sh0 = 13.35 + (st.x + 6.5) / 13 * 0.7 + (3 - k) * 0.1;
          hScale = 1 - cyEaseInOut((loopT - sh0) / 0.45);
          if (hScale <= 0.01) vis = false;
        }
        if (!vis) continue;
        present += hScale * (dz > 0.01 ? 0.5 : 1);
        stackItems.push({ z: zAcc + dz, h: CY_H * hScale, c: st.cols[k] });
        zAcc += CY_TZ * hScale;
      }
      if (st === js.stB && js.bExtra) {
        stackItems.push({ z: zAcc, h: CY_H, c: js.color });
      }
      (function (st, stackItems) {
        items.push({ key: st.x + st.y, fn: function () {
          var xc = st.x + CY_L / 2;
          var hl = cySmooth(xc - 0.4, xc + 0.4, scanX) * scanFade;
          for (var q = 0; q < stackItems.length; q++) {
            var it = stackItems[q];
            cyBox(ctx, V, st.x, st.y, it.z, CY_L, CY_W, it.h, tris[it.c], INK, lw * 0.75);
            if (it.h > 0.2) {
              ctx.strokeStyle = 'rgba(31,34,40,0.22)'; ctx.lineWidth = 0.9 * u;
              ctx.beginPath();
              for (var rb = 1; rb < 4; rb++) {
                var r1 = cyP(V, st.x + rb * 0.25, st.y + CY_W, it.z + 0.05), r2 = cyP(V, st.x + rb * 0.25, st.y + CY_W, it.z + it.h - 0.05);
                ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]);
              }
              ctx.stroke();
            }
          }
          if (hl > 0.01 && stackItems.length) {
            var topIt = stackItems[stackItems.length - 1];
            ctx.fillStyle = 'rgba(43,230,205,' + (0.55 * hl).toFixed(3) + ')';
            cyRect(ctx, V, st.x, st.y, topIt.z + topIt.h + 0.002, CY_L, CY_W); ctx.fill();
          }
        } });
      })(st, stackItems);
    }

    {
      (function (js) {
        var cy0 = js.ty;
        items.push({ key: js.X + cy0 + 0.6, fn: function () {
          var t1 = cyP(V, js.X - 0.1, cy0, 2.55), t2 = cyP(V, js.X + 0.1, cy0, 2.55);
          var b1 = cyP(V, js.X - 0.1, cy0, js.hz + 0.06), b2 = cyP(V, js.X + 0.1, cy0, js.hz + 0.06);
          ctx.strokeStyle = INK; ctx.lineWidth = 1.3 * u;
          ctx.beginPath(); ctx.moveTo(t1[0], t1[1]); ctx.lineTo(b1[0], b1[1]); ctx.moveTo(t2[0], t2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
          if (js.carry) cyBox(ctx, V, js.X - CY_L / 2, cy0 - CY_W / 2, js.hz - CY_H, CY_L, CY_W, CY_H, tris[js.color], INK, lw * 0.8);
          cyBox(ctx, V, js.X - 0.54, cy0 - 0.25, js.hz, 1.08, 0.5, 0.07, ['#F7C85A', '#F07A3A', '#C55A22'], INK, lw);
        } });
      })(js);
    }

    items.sort(function (a, b) { return a.key - b.key; });
    for (var ii = 0; ii < items.length; ii++) items[ii].fn();

    cyRtgSide(ctx, V, X, yb + 1.55, lw, INK);
    cyRtgTop(ctx, V, X, yb, js, lw, INK, u, loopT);

    if (js.carry) {
      var tp = cyP(V, js.X, js.ty, js.hz + 0.4);
      tags.push({ x: tp[0], y: tp[1], text: D.jobs[j].code, col: '#1F2228' });
    }

    if (j < 2) {
      var ln = lanes[j];
      for (var tk = 0; tk < 2; tk++) {
        var f = cyFrac(tk * 0.5 + cyHash(j * 9 + tk) * 0.2 + ph * ln.dir);
        var tx = -9.6 + f * 19.2;
        var ta = 1 - cySmooth(7.3, 7.9, Math.abs(tx));
        if (ta < 0.02) continue;
        ctx.save(); ctx.globalAlpha = ta;
        cyTruck(ctx, V, tx, ln.y, ln.dir, (tk + j) % 2 === 0, tris[(j * 2 + tk * 3 + 1) % 6], tk === 0 ? '#F07A3A' : '#2BB3A3', lw, INK);
        ctx.restore();
      }
    }
  }

  if (scanFade > 0.01) {
    ctx.save();
    var s1 = cyP(V, scanX, -6.4, 0.01), s2 = cyP(V, scanX, 6.4, 0.01), s3 = cyP(V, scanX, 6.4, 2.4), s4 = cyP(V, scanX, -6.4, 2.4);
    ctx.fillStyle = 'rgba(43,230,205,' + (0.16 * scanFade).toFixed(3) + ')';
    cyPoly(ctx, [s1, s2, s3, s4]); ctx.fill();
    ctx.strokeStyle = 'rgba(30,200,180,' + (0.9 * scanFade).toFixed(3) + ')';
    ctx.lineWidth = 2.4 * u;
    ctx.beginPath(); ctx.moveTo(s1[0], s1[1]); ctx.lineTo(s2[0], s2[1]); ctx.moveTo(s4[0], s4[1]); ctx.lineTo(s3[0], s3[1]); ctx.stroke();
    var sp1 = cyP(V, scanX, 6.6, 2.4);
    ctx.fillStyle = '#1F2228';
    cyRR(ctx, sp1[0] - minSide * 0.045, sp1[1] - minSide * 0.05, minSide * 0.09, minSide * 0.032, minSide * 0.016); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 ' + (minSide * 0.016) + 'px ' + CY_FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SCANNING', sp1[0], sp1[1] - minSide * 0.034);
    ctx.restore();
  }

  for (var tg = 0; tg < tags.length; tg++) {
    var tgi = tags[tg];
    var fs = minSide * 0.017;
    ctx.font = '800 ' + fs + 'px ' + CY_FONT;
    var tw = ctx.measureText(tgi.text).width + fs * 1.4;
    var bx = tgi.x - tw / 2, by = tgi.y - fs * 3.2;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4 * u;
    ctx.beginPath(); ctx.moveTo(tgi.x, by + fs * 1.8); ctx.lineTo(tgi.x, tgi.y); ctx.stroke();
    ctx.fillStyle = '#F2B430';
    cyRR(ctx, bx, by, tw, fs * 1.8, fs * 0.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tgi.text, tgi.x, by + fs * 0.95);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

  var util = total > 0 ? present / total : 0;
  var active = 0;
  for (j = 0; j < 3; j++) if (jobsState[j].active) active++;
  var scanP = loopT < 10.4 ? 0 : loopT < 13.2 ? cyEaseInOut((loopT - 10.4) / 2.8) : 1 - cySmooth(14.0, 14.9, loopT);
  cyUI(ctx, width, height, minSide, u, loopT, currentScene, sceneProgress, util, active, scanP, ph);

  ctx.restore();
}

function cyRtgSide(ctx, V, X, y, lw, INK) {
  var Y = ['#FFD25A', '#F5B82E', '#D39516'];
  var dark = ['#3B3F47', '#2F333B', '#23262C'];
  cyBox(ctx, V, X - 0.85, y - 0.12, 0, 0.46, 0.24, 0.22, dark, INK, lw);
  cyBox(ctx, V, X + 0.39, y - 0.12, 0, 0.46, 0.24, 0.22, dark, INK, lw);
  cyBox(ctx, V, X - 0.85, y - 0.08, 0.22, 1.7, 0.16, 0.14, Y, INK, lw);
  cyBox(ctx, V, X - 0.7, y - 0.08, 0.36, 0.16, 0.16, 2.2, Y, INK, lw);
  cyBox(ctx, V, X + 0.54, y - 0.08, 0.36, 0.16, 0.16, 2.2, Y, INK, lw);
  var a = cyP(V, X - 0.62, y, 0.4), b = cyP(V, X + 0.62, y, 2.4), c = cyP(V, X + 0.62, y, 0.4), d = cyP(V, X - 0.62, y, 2.4);
  ctx.strokeStyle = '#D39516'; ctx.lineWidth = 2 * (V.s / 50);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
  cyBox(ctx, V, X - 0.85, y - 0.1, 2.5, 1.7, 0.2, 0.22, Y, INK, lw);
}

function cyRtgTop(ctx, V, X, yb, js, lw, INK, u, loopT) {
  var Y = ['#FFD25A', '#F5B82E', '#D39516'];
  cyBox(ctx, V, X - 0.72, yb - 1.62, 2.72, 0.2, 3.24, 0.2, Y, INK, lw);
  cyBox(ctx, V, js.X - 0.5, js.ty - 0.24, 2.6, 1.0, 0.48, 0.32, ['#3B3F47', '#2F333B', '#23262C'], INK, lw);
  cyBox(ctx, V, X + 0.52, yb - 1.62, 2.72, 0.2, 3.24, 0.2, Y, INK, lw);
  cyBox(ctx, V, X - 0.75, yb + 1.0, 2.92, 1.5, 0.55, 0.42, ['#FFFFFF', '#EDE7DC', '#CFC6B6'], INK, lw);
  var on = js.active ? 0.5 + 0.5 * Math.sin(CY_TAU * loopT * 2) : 0.15;
  var lp = cyP(V, X, yb + 1.27, 3.36);
  ctx.fillStyle = 'rgba(240,122,58,' + (0.3 + 0.7 * on).toFixed(3) + ')';
  ctx.beginPath(); ctx.arc(lp[0], lp[1], 3.2 * u, 0, CY_TAU); ctx.fill();
}

function cyUI(ctx, width, height, minSide, u, loopT, scene, sp, util, active, scanP, ph) {
  var pad = minSide * 0.075;
  var INK = '#1F2228';
  var labels = ['01  AUTOMATED STACKING', '02  CONTAINER RELOCATION', '03  INVENTORY SCAN'];
  var la = cySmooth(0, 0.07, sp) * (1 - cySmooth(0.93, 1, sp));
  var lfs = minSide * 0.02;
  ctx.font = '700 ' + lfs + 'px ' + CY_FONT;
  ctx.textBaseline = 'middle';
  var lt = labels[scene];
  var lwid = ctx.measureText(lt).width + lfs * 1.8;
  ctx.save();
  ctx.globalAlpha = la;
  ctx.fillStyle = INK;
  cyRR(ctx, pad, pad, lwid, lfs * 2.1, lfs * 1.05); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(lt, pad + lfs * 0.9 + (1 - la) * 10 * u, pad + lfs * 1.08);
  ctx.restore();

  var tfs = minSide * 0.064;
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 ' + tfs + 'px ' + CY_FONT;
  var maxW = width * 0.33;
  var tw = Math.max(ctx.measureText('CONTAINER').width, ctx.measureText('YARD').width);
  if (tw > maxW) { tfs *= maxW / tw; ctx.font = '800 ' + tfs + 'px ' + CY_FONT; }
  var ty = pad + lfs * 2.1 + tfs * 1.05;
  ctx.fillStyle = '#2BB3A3';
  ctx.fillText('SMART', pad, ty);
  ctx.fillStyle = INK;
  ctx.fillText('CONTAINER', pad, ty + tfs * 0.98);
  ctx.fillText('YARD', pad, ty + tfs * 1.96);
  var sfs = minSide * 0.022;
  ctx.font = '500 ' + sfs + 'px ' + CY_FONT;
  ctx.fillStyle = '#4C5A57';
  ctx.fillText('Automated stacking &', pad, ty + tfs * 1.96 + sfs * 1.9);
  ctx.fillText('real-time inventory tracking', pad, ty + tfs * 1.96 + sfs * 3.2);

  var cw = minSide * 0.44, ch = minSide * 0.3;
  var cx = width - pad - cw, cy = pad;
  ctx.fillStyle = 'rgba(31,34,40,0.14)';
  cyRR(ctx, cx + 8 * u, cy + 8 * u, cw, ch, 18 * u); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  cyRR(ctx, cx, cy, cw, ch, 18 * u); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * u; ctx.stroke();
  var ip = cw * 0.07;
  var lab = minSide * 0.018;
  ctx.font = '700 ' + lab + 'px ' + CY_FONT;
  ctx.fillStyle = '#6B7472';
  ctx.fillText('YARD UTILIZATION', cx + ip, cy + ch * 0.17);
  ctx.font = '800 ' + (ch * 0.17) + 'px ' + CY_FONT;
  ctx.fillStyle = INK;
  ctx.fillText(Math.round(util * 92) + '%', cx + ip, cy + ch * 0.36);
  var bw = cw - ip * 2, bh = ch * 0.05;
  ctx.fillStyle = '#E6F2EF'; cyRR(ctx, cx + ip, cy + ch * 0.41, bw, bh, bh / 2); ctx.fill();
  ctx.fillStyle = '#2BB3A3'; if (util > 0.01) { cyRR(ctx, cx + ip, cy + ch * 0.41, bw * util * 0.92, bh, bh / 2); ctx.fill(); }

  ctx.font = '700 ' + lab + 'px ' + CY_FONT;
  ctx.fillStyle = '#6B7472';
  ctx.fillText('ACTIVE CRANES', cx + ip, cy + ch * 0.6);
  ctx.fillText('INVENTORY SCAN', cx + cw * 0.54, cy + ch * 0.6);
  ctx.font = '800 ' + (ch * 0.12) + 'px ' + CY_FONT;
  ctx.fillStyle = INK;
  ctx.fillText('0' + active + ' / 03', cx + ip, cy + ch * 0.76);
  ctx.fillText(Math.round(scanP * 100) + '%', cx + cw * 0.54, cy + ch * 0.76);
  for (var d = 0; d < 3; d++) {
    ctx.fillStyle = d < active ? '#F07A3A' : '#E6E1D6';
    cyRR(ctx, cx + ip + d * ch * 0.1, cy + ch * 0.83, ch * 0.07, ch * 0.07, ch * 0.035); ctx.fill();
  }
  ctx.fillStyle = '#E6F2EF'; cyRR(ctx, cx + cw * 0.54, cy + ch * 0.835, cw * 0.4, ch * 0.06, ch * 0.03); ctx.fill();
  if (scanP > 0.01) { ctx.fillStyle = '#F2B430'; cyRR(ctx, cx + cw * 0.54, cy + ch * 0.835, cw * 0.4 * scanP, ch * 0.06, ch * 0.03); ctx.fill(); }

  var steps = ['STACK', 'RELOCATE', 'SCAN'];
  var pos;
  if (loopT < 4.6) pos = 0;
  else if (loopT < 5.4) pos = cyEaseInOut((loopT - 4.6) / 0.8);
  else if (loopT < 9.6) pos = 1;
  else if (loopT < 10.4) pos = 1 + cyEaseInOut((loopT - 9.6) / 0.8);
  else if (loopT < 14.2) pos = 2;
  else pos = 2 - 2 * cyEaseInOut((loopT - 14.2) / 0.8);
  var sh = minSide * 0.05, sw = minSide * 0.15;
  var sx0 = pad, sy = height - pad - sh;
  ctx.fillStyle = 'rgba(31,34,40,0.14)';
  cyRR(ctx, sx0 + 6 * u, sy + 6 * u, sw * 3, sh, sh / 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  cyRR(ctx, sx0, sy, sw * 3, sh, sh / 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * u; ctx.stroke();
  ctx.fillStyle = '#F2B430';
  cyRR(ctx, sx0 + pos * sw + 4 * u, sy + 4 * u, sw - 8 * u, sh - 8 * u, (sh - 8 * u) / 2); ctx.fill();
  ctx.font = '800 ' + (sh * 0.32) + 'px ' + CY_FONT;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (var i = 0; i < 3; i++) {
    var act = 1 - cyClamp(Math.abs(pos - i), 0, 1);
    ctx.fillStyle = act > 0.5 ? INK : '#8A8E95';
    ctx.fillText('0' + (i + 1) + ' ' + steps[i], sx0 + sw * (i + 0.5), sy + sh * 0.53);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
