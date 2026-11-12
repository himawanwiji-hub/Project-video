// Nomor 4 — Quantum Grid Pulse | 15 s | 3 scene | 16:9 | Canvas API murni

var QG_C30 = 0.8660254037844386;
var QG_TAU = Math.PI * 2;

function qgClamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function qgSmooth(a, b, v) { var x = qgClamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
function qgHash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function qgFrac(v) { return v - Math.floor(v); }
function qgBump(x) { return Math.exp(-2 * x * x); }
function qgMix(a, b, k) {
  return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')';
}

function qgP(V, x, y, z) {
  return [V.cx + (x - y) * QG_C30 * V.s, V.cy + (x + y) * 0.5 * V.s - z * V.s];
}

function qgQuad(ctx, a, b, c, d) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  ctx.closePath();
}

function qgRect(ctx, V, x, y, z, w, d) {
  qgQuad(ctx, qgP(V, x, y, z), qgP(V, x + w, y, z), qgP(V, x + w, y + d, z), qgP(V, x, y + d, z));
}

function qgBox(ctx, V, x, y, z, w, d, h, top, left, right, stroke, lw) {
  var a = qgP(V, x, y, z + h), b = qgP(V, x + w, y, z + h), c = qgP(V, x + w, y + d, z + h), e = qgP(V, x, y + d, z + h);
  var f = qgP(V, x, y + d, z), g = qgP(V, x + w, y + d, z), k = qgP(V, x + w, y, z);
  ctx.fillStyle = left; qgQuad(ctx, e, c, g, f); ctx.fill();
  ctx.fillStyle = right; qgQuad(ctx, c, b, k, g); ctx.fill();
  ctx.fillStyle = top; qgQuad(ctx, a, b, c, e); ctx.fill();
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

function qgLift(i, j, loopT, scene, p) {
  var env = qgSmooth(0, 0.05, p) * (1 - qgSmooth(0.95, 1, p));
  var v = 0;
  if (scene === 0) {
    var d = Math.hypot(i, j);
    var wf = -2 + p * 10;
    v = Math.max(qgBump((d - wf) / 0.9), 0.7 * qgBump((d - (wf - 3)) / 0.9));
  } else if (scene === 1) {
    var q = (i + 2) + (j + 2);
    var wf2 = -2.5 + p * 17;
    v = Math.max(qgBump((q - wf2) / 1.2), 0.75 * qgBump((q - (wf2 - 4)) / 1.2));
  } else {
    var h = qgHash((i + 3) * 17 + (j + 3) * 5);
    var h2 = qgHash((i + 3) * 7 + (j + 3) * 23);
    var w = Math.sin(QG_TAU * (p * (2 + Math.floor(h2 * 2)) + h));
    v = Math.pow(Math.max(0, w), 1.6) * (0.6 + 0.4 * h2);
  }
  return v * env;
}

function draw(ctx, time, width, height) {
  var t = time;
  var duration = 15;
  var sceneCount = 3;
  var loopT = ((t % duration) + duration) % duration;
  var sceneDuration = duration / sceneCount;
  var currentScene = Math.floor(loopT / sceneDuration);
  var sceneProgress = (loopT % sceneDuration) / sceneDuration;

  var minSide = Math.min(width, height);
  var u = minSide / 1080;
  var lw = 1.5 * u;
  var ph = loopT / duration;

  var GREEN = [57, 255, 136], WHITE = [235, 255, 245], DIM = [22, 70, 46], MINT = [140, 255, 230];
  var ledTarget = currentScene === 1 ? MINT : GREEN;

  var s = Math.min(width * 0.82 / 25, height * 0.74 / 15.5) * (1 + 0.025 * Math.sin(QG_TAU * ph));
  var V = { cx: width * 0.5 + Math.sin(QG_TAU * ph) * 0.012 * width, cy: height * 0.55 + Math.cos(QG_TAU * ph * 2) * 0.006 * height, s: s };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  var bg = ctx.createRadialGradient(width * 0.5, height * 0.48, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.7);
  bg.addColorStop(0, '#0F1A15');
  bg.addColorStop(0.6, '#070B09');
  bg.addColorStop(1, '#030504');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(57,255,136,0.05)';
  ctx.lineWidth = 1 * u;
  ctx.beginPath();
  var go = qgFrac(ph * 3) * 2;
  for (var gi = -32; gi <= 32; gi += 2) {
    var a1 = qgP(V, gi + go, -34, -1.2), a2 = qgP(V, gi + go, 34, -1.2);
    var b1 = qgP(V, -34, gi + go, -1.2), b2 = qgP(V, 34, gi + go, -1.2);
    ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]);
    ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]);
  }
  ctx.stroke();

  var lifts = [], maxLift = 0;
  for (var i = -2; i <= 2; i++) {
    lifts[i + 2] = [];
    for (var j = -2; j <= 2; j++) {
      var L = qgLift(i, j, loopT, currentScene, sceneProgress);
      lifts[i + 2][j + 2] = L;
      if (L > maxLift) maxLift = L;
    }
  }

  qgBox(ctx, V, -7.6, -7.6, -1.0, 15.2, 15.2, 0.35, '#0A0D0C', '#080A09', '#050706', 'rgba(57,255,136,0.18)', lw);
  qgBox(ctx, V, -7.2, -7.2, -0.65, 14.4, 14.4, 0.65, '#0F1412', '#0B0F0D', '#080B0A', 'rgba(57,255,136,0.45)', lw);

  ctx.fillStyle = '#C9A24A';
  for (var fg = 0; fg < 18; fg++) {
    var fx = -6.3 + fg * 0.72;
    var f1 = qgP(V, fx, 7.2, -0.55), f2 = qgP(V, fx + 0.42, 7.2, -0.55), f3 = qgP(V, fx + 0.42, 7.2, -0.12), f4 = qgP(V, fx, 7.2, -0.12);
    qgQuad(ctx, f1, f2, f3, f4); ctx.fill();
  }

  ctx.strokeStyle = 'rgba(57,255,136,0.14)';
  ctx.lineWidth = 1.1 * u;
  ctx.setLineDash([5 * u, 6 * u]);
  qgRect(ctx, V, -6.9, -6.9, 0, 13.8, 13.8); ctx.stroke();
  ctx.setLineDash([]);

  var pitch = 2.6;
  var traceZ = 0.002;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(57,255,136,0.3)';
  ctx.lineWidth = 1.8 * u;
  ctx.beginPath();
  var chan = [-1.5 * pitch, -0.5 * pitch, 0.5 * pitch, 1.5 * pitch];
  for (var k = 0; k < 4; k++) {
    for (var off = -1; off <= 1; off += 2) {
      var c = chan[k] + off * 0.16;
      var p1 = qgP(V, c, -6.4, traceZ), p2 = qgP(V, c, 6.4, traceZ);
      var p3 = qgP(V, -6.4, c, traceZ), p4 = qgP(V, 6.4, c, traceZ);
      ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
      ctx.moveTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]);
    }
  }
  ctx.stroke();

  ctx.fillStyle = '#C9A24A';
  for (k = 0; k < 4; k++) {
    for (off = -1; off <= 1; off += 2) {
      c = chan[k] + off * 0.16;
      var ends = [[c, -6.4], [c, 6.4], [-6.4, c], [6.4, c]];
      for (var e = 0; e < 4; e++) {
        var ep = qgP(V, ends[e][0], ends[e][1], traceZ);
        ctx.beginPath(); ctx.ellipse(ep[0], ep[1], 0.11 * s * 1.2247, 0.11 * s * 0.7071, 0, 0, QG_TAU); ctx.fill();
      }
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (k = 0; k < 4; k++) {
    for (var dirAxis = 0; dirAxis < 2; dirAxis++) {
      var lineAct = 0;
      for (var m = 0; m < 5; m++) lineAct += dirAxis === 0 ? lifts[k][m] + lifts[k + 1][m] : lifts[m][k] + lifts[m][k + 1];
      lineAct = qgClamp(lineAct / 2.2, 0, 1);
      var base = 0.3 + 0.7 * lineAct;
      for (var lane = 0; lane < 2; lane++) {
        var cc = chan[k] + (lane === 0 ? -0.16 : 0.16);
        var dirSign = lane === 0 ? 1 : -1;
        for (var pk = 0; pk < 3; pk++) {
          var fpos = qgFrac(qgHash(k * 13 + dirAxis * 7 + lane * 3 + pk) + ph * 3 * dirSign);
          var along = -6.4 + fpos * 12.8;
          var edge = Math.min(1, Math.min(fpos, 1 - fpos) * 10);
          var a = base * edge;
          var tail = 1.3 * dirSign;
          var hx = dirAxis === 0 ? cc : along, hy = dirAxis === 0 ? along : cc;
          var tx = dirAxis === 0 ? cc : along - tail, ty = dirAxis === 0 ? along - tail : cc;
          var hp = qgP(V, hx, hy, traceZ), tp = qgP(V, tx, ty, traceZ);
          var grad = ctx.createLinearGradient(tp[0], tp[1], hp[0], hp[1]);
          grad.addColorStop(0, 'rgba(57,255,136,0)');
          grad.addColorStop(1, 'rgba(57,255,136,' + (0.85 * a).toFixed(3) + ')');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.6 * u;
          ctx.beginPath(); ctx.moveTo(tp[0], tp[1]); ctx.lineTo(hp[0], hp[1]); ctx.stroke();
          ctx.fillStyle = 'rgba(210,255,230,' + (0.9 * a).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(hp[0], hp[1], 2.4 * u, 0, QG_TAU); ctx.fill();
        }
      }
    }
  }
  ctx.restore();

  var periph = [];
  for (var sc = 0; sc < 7; sc++) periph.push({ x: -5.4 + sc * 1.8, y: -7.0, type: 0, key: -5.4 + sc * 1.8 - 7 });
  for (sc = 0; sc < 3; sc++) periph.push({ x: -6.85, y: -3.6 + sc * 3.6, type: 1, key: -6.85 - 3.6 + sc * 3.6 });

  var drawList = [];
  periph.forEach(function (pp, idx) {
    drawList.push({ key: pp.key, fn: function () {
      if (pp.type === 0) {
        qgBox(ctx, V, pp.x - 0.3, pp.y - 0.18, 0, 0.6, 0.36, 0.22, '#1B2420', '#141B18', '#0E1311', 'rgba(57,255,136,0.5)', lw * 0.8);
        ctx.fillStyle = '#C9A24A';
        qgRect(ctx, V, pp.x - 0.3, pp.y - 0.18, 0.221, 0.12, 0.36); ctx.fill();
        qgRect(ctx, V, pp.x + 0.18, pp.y - 0.18, 0.221, 0.12, 0.36); ctx.fill();
      } else {
        qgBox(ctx, V, pp.x - 0.28, pp.y - 1.1, 0, 0.56, 2.2, 0.5, '#161C1A', '#101513', '#0B0F0D', 'rgba(57,255,136,0.5)', lw);
        for (var hp2 = 0; hp2 < 6; hp2++) {
          var hy2 = pp.y - 0.95 + hp2 * 0.36;
          var on = 0.5 + 0.5 * Math.sin(QG_TAU * (ph * 6) - hp2 * 0.9 - idx);
          ctx.fillStyle = qgMix(DIM, GREEN, on * (0.3 + 0.7 * maxLift));
          qgRect(ctx, V, pp.x - 0.12, hy2, 0.501, 0.24, 0.18); ctx.fill();
        }
      }
    } });
  });

  for (i = -2; i <= 2; i++) {
    for (j = -2; j <= 2; j++) {
      (function (i, j) {
        var L = lifts[i + 2][j + 2];
        var idle = 0.03 * Math.sin(QG_TAU * (ph * 3) + (i * 0.7 + j * 1.1));
        var z = 0.12 + L * 1.15 + idle;
        var cx = i * pitch, cy = j * pitch;
        drawList.push({ key: cx + cy, fn: function () {
          var hs = 0.98, cs = 0.85;
          ctx.fillStyle = '#121916';
          qgRect(ctx, V, cx - hs, cy - hs, 0.004, hs * 2, hs * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(57,255,136,' + (0.25 + 0.5 * L).toFixed(3) + ')';
          ctx.lineWidth = 1.2 * u;
          qgRect(ctx, V, cx - hs, cy - hs, 0.004, hs * 2, hs * 2); ctx.stroke();

          ctx.fillStyle = '#C9A24A';
          for (var pn = 0; pn < 5; pn++) {
            var o = -0.64 + pn * 0.32;
            qgRect(ctx, V, cx + o - 0.06, cy + hs - 0.14, 0.005, 0.12, 0.2); ctx.fill();
            qgRect(ctx, V, cx + hs - 0.14, cy + o - 0.06, 0.005, 0.2, 0.12); ctx.fill();
            qgRect(ctx, V, cx + o - 0.06, cy - hs - 0.06, 0.005, 0.12, 0.2); ctx.fill();
            qgRect(ctx, V, cx - hs - 0.06, cy + o - 0.06, 0.005, 0.2, 0.12); ctx.fill();
          }

          if (L > 0.02) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(57,255,136,' + (0.16 * L).toFixed(3) + ')';
            var gr = cs + 0.35 * L;
            qgRect(ctx, V, cx - gr, cy - gr, 0.006, gr * 2, gr * 2); ctx.fill();
            ctx.restore();
          }
          ctx.fillStyle = 'rgba(0,0,0,' + (0.55 - 0.25 * L).toFixed(3) + ')';
          var so = 0.12 + L * 0.35;
          qgRect(ctx, V, cx - cs + so * 0.4, cy - cs + so * 0.4, 0.007, cs * 2, cs * 2); ctx.fill();

          if (L > 0.03) {
            ctx.strokeStyle = 'rgba(57,255,136,' + (0.35 * L).toFixed(3) + ')';
            ctx.lineWidth = 1 * u;
            ctx.beginPath();
            var cn = [[cx - cs, cy + cs], [cx + cs, cy + cs], [cx + cs, cy - cs]];
            for (var q = 0; q < 3; q++) {
              var lb = qgP(V, cn[q][0], cn[q][1], 0.01), lt = qgP(V, cn[q][0], cn[q][1], z);
              ctx.moveTo(lb[0], lb[1]); ctx.lineTo(lt[0], lt[1]);
            }
            ctx.stroke();
          }

          var topC = qgMix([30, 39, 35], [34, 80, 58], L);
          qgBox(ctx, V, cx - cs, cy - cs, z, cs * 2, cs * 2, 0.36, topC, '#141A17', '#0D1210', qgMix([40, 120, 80], GREEN, L), lw);

          var di = 0.48;
          ctx.fillStyle = qgMix([20, 26, 23], [16, 60, 40], L);
          qgRect(ctx, V, cx - di, cy - di, z + 0.361, di * 2, di * 2); ctx.fill();
          ctx.strokeStyle = qgMix([50, 70, 60], GREEN, L);
          ctx.lineWidth = 1 * u;
          qgRect(ctx, V, cx - di, cy - di, z + 0.361, di * 2, di * 2); ctx.stroke();
          ctx.beginPath();
          for (var ln = 1; ln < 4; ln++) {
            var l1 = qgP(V, cx - di + ln * di * 0.5, cy - di + 0.12, z + 0.362), l2 = qgP(V, cx - di + ln * di * 0.5, cy + di - 0.12, z + 0.362);
            ctx.moveTo(l1[0], l1[1]); ctx.lineTo(l2[0], l2[1]);
          }
          ctx.stroke();

          var blink = 0.5 + 0.5 * Math.sin(QG_TAU * (ph * 10) + (i * 1.3 + j * 0.7));
          var ledK = qgClamp(0.18 + 0.25 * blink + L * 0.9, 0, 1);
          var ledCol = L > 0.65 ? qgMix(ledTarget, WHITE, (L - 0.65) / 0.35) : qgMix(DIM, ledTarget, ledK);
          ctx.fillStyle = ledCol;
          qgRect(ctx, V, cx + cs - 0.32, cy + cs - 0.32, z + 0.362, 0.2, 0.2); ctx.fill();
          if (ledK > 0.35) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            var lp = qgP(V, cx + cs - 0.22, cy + cs - 0.22, z + 0.362);
            ctx.fillStyle = 'rgba(57,255,136,' + (0.22 * ledK).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(lp[0], lp[1], (6 + 10 * L) * u, 0, QG_TAU); ctx.fill();
            ctx.restore();
          }
        } });
      })(i, j);
    }
  }

  drawList.sort(function (a, b) { return a.key - b.key; });
  for (var di2 = 0; di2 < drawList.length; di2++) drawList[di2].fn();

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (var sp = 0; sp < 40; sp++) {
    var sf = qgFrac(qgHash(sp * 4.1) + ph * (1 + (sp % 3)));
    var sx = width * qgHash(sp * 8.3);
    var sy = height * (1.02 - sf * 1.04);
    var sa = Math.sin(Math.PI * sf) * 0.35;
    var sz = (1 + qgHash(sp) * 2) * u;
    ctx.fillStyle = 'rgba(57,255,136,' + sa.toFixed(3) + ')';
    ctx.fillRect(sx - sz, sy - sz, sz * 2, sz * 2);
  }
  ctx.restore();

  var vg = ctx.createRadialGradient(width * 0.5, height * 0.52, minSide * 0.42, width * 0.5, height * 0.52, Math.max(width, height) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
