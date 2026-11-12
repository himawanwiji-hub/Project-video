// Nomor 2 — Data Highway City | 15 s | 3 scene | 16:9 | Canvas API murni

var DH_C30 = 0.8660254037844386;
var DH_TAU = Math.PI * 2;
var DH_DATA = null;

function dhClamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function dhSmooth(a, b, v) { var x = dhClamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
function dhEaseOutBack(x) { x = dhClamp(x, 0, 1); var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
function dhEaseInOut(x) { x = dhClamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function dhHash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function dhFrac(v) { return v - Math.floor(v); }

function dhP(V, x, y, z) {
  return [V.cx + (x - y) * DH_C30 * V.s, V.cy + (x + y) * 0.5 * V.s - z * V.s];
}

function dhQuad(ctx, a, b, c, d) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  ctx.closePath();
}

function dhRect(ctx, V, x, y, z, w, d) {
  dhQuad(ctx, dhP(V, x, y, z), dhP(V, x + w, y, z), dhP(V, x + w, y + d, z), dhP(V, x, y + d, z));
}

function dhBox(ctx, V, x, y, z, w, d, h, top, left, right, stroke, lw) {
  var a = dhP(V, x, y, z + h), b = dhP(V, x + w, y, z + h), c = dhP(V, x + w, y + d, z + h), e = dhP(V, x, y + d, z + h);
  var f = dhP(V, x, y + d, z), g = dhP(V, x + w, y + d, z), k = dhP(V, x + w, y, z);
  ctx.fillStyle = left; dhQuad(ctx, e, c, g, f); ctx.fill();
  ctx.fillStyle = right; dhQuad(ctx, c, b, k, g); ctx.fill();
  ctx.fillStyle = top; dhQuad(ctx, a, b, c, e); ctx.fill();
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

function dhBuild() {
  var roads = [-6, -2, 2, 6];
  var buildings = [];
  var palettes = [
    ['#2E2A6B', '#211E52', '#17153C', '#7C6BFF'],
    ['#1F4E66', '#173B4F', '#102A39', '#36E0D0'],
    ['#3A2858', '#2B1D43', '#1E1430', '#B67BFF'],
    ['#22345E', '#192749', '#111B34', '#5FA8FF']
  ];
  var id = 0;
  for (var ci = 0; ci < 5; ci++) {
    for (var cj = 0; cj < 5; cj++) {
      var x0 = -10 + ci * 4, y0 = -10 + cj * 4;
      var big = dhHash(ci * 13 + cj * 7) > 0.72 && !(ci === 2 && cj === 2);
      var lots = big ? [[0.45, 0.45, 3.1, 3.1]] : [[0.45, 0.45, 1.45, 1.45], [2.1, 0.45, 1.45, 1.45], [0.45, 2.1, 1.45, 1.45], [2.1, 2.1, 1.45, 1.45]];
      if (ci === 2 && cj === 2) lots = [[0.6, 0.6, 2.8, 2.8]];
      for (var li = 0; li < lots.length; li++) {
        var L = lots[li];
        var hs = dhHash(id * 3.17 + 0.5);
        if (!big && hs < 0.12) { id++; continue; }
        var core = ci === 2 && cj === 2;
        var h = core ? 2.9 : big ? 0.9 + dhHash(id * 1.7) * 1.0 : 0.55 + Math.pow(dhHash(id * 5.3), 1.8) * 1.9;
        var pal = core ? ['#E6ECF5', '#AEBBD0', '#8394AE', '#FFFFFF'] : palettes[Math.floor(dhHash(id * 9.1) * palettes.length)];
        var bx = x0 + L[0], by = y0 + L[1];
        var cx = bx + L[2] / 2, cy = by + L[3] / 2;
        buildings.push({
          x: bx, y: by, w: L[2], d: L[3], h: h, pal: pal, core: core, big: big,
          key: cx + cy, dist: Math.hypot(cx, cy), ph: dhHash(id * 2.9), id: id
        });
        id++;
      }
    }
  }
  buildings.sort(function (a, b) { return a.key - b.key; });

  var lanes = [];
  for (var r = 0; r < roads.length; r++) {
    lanes.push({ axis: 0, c: roads[r] - 0.16, dir: 1 });
    lanes.push({ axis: 0, c: roads[r] + 0.16, dir: -1 });
    lanes.push({ axis: 1, c: roads[r] - 0.16, dir: -1 });
    lanes.push({ axis: 1, c: roads[r] + 0.16, dir: 1 });
  }
  var packets = [];
  for (var l = 0; l < lanes.length; l++) {
    var n = 5;
    for (var p = 0; p < n; p++) {
      packets.push({ lane: lanes[l], off: (p + dhHash(l * 11 + p) * 0.6) / n, speed: 1 + Math.floor(dhHash(l * 3 + p * 7) * 2), warm: dhHash(l * 5.5 + p) > 0.6, rank: dhHash(l * 17 + p * 3) });
    }
  }
  return { roads: roads, buildings: buildings, packets: packets };
}

function draw(ctx, time, width, height) {
  var t = time;
  var duration = 15;
  var sceneCount = 3;
  var loopT = ((t % duration) + duration) % duration;
  var sceneDuration = duration / sceneCount;
  var currentScene = Math.floor(loopT / sceneDuration);
  var sceneProgress = (loopT % sceneDuration) / sceneDuration;
  if (!DH_DATA) DH_DATA = dhBuild();
  var D = DH_DATA;

  var minSide = Math.min(width, height);
  var u = minSide / 1080;
  var lw = 1.4 * u;
  var ph = loopT / duration;

  var traffic = 0.45 + 0.55 * dhSmooth(4.6, 6.2, loopT) * (1 - dhSmooth(13.6, 14.9, loopT));
  var blinkAmt = dhSmooth(9.6, 10.6, loopT) * (1 - dhSmooth(14.0, 14.95, loopT));
  var accent = currentScene === 1 ? 0.5 + 0.5 * Math.sin(Math.PI * sceneProgress) : 0;

  var s = Math.min(height / 17, width / 30);
  var panX = Math.sin(DH_TAU * ph) * 0.06 * width;
  var panY = (1 - Math.cos(DH_TAU * ph)) * 0.5 * 0.05 * height;
  var V = { cx: width * 0.5 - panX, cy: height * 0.5 + panY - height * 0.02, s: s * (1 + 0.04 * (0.5 - 0.5 * Math.cos(DH_TAU * ph))) };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  var bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#1C1140');
  bg.addColorStop(0.55, '#120B2C');
  bg.addColorStop(1, '#0A0619');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  var halo = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.45, minSide * 0.9);
  halo.addColorStop(0, 'rgba(120,80,255,0.22)');
  halo.addColorStop(1, 'rgba(120,80,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  dhBox(ctx, V, -11, -11, -0.9, 22, 22, 0.5, '#170F33', '#120B28', '#0C071C', 'rgba(150,110,255,0.35)', lw);
  dhBox(ctx, V, -10.4, -10.4, -0.4, 20.8, 20.8, 0.4, '#1A2148', '#141A3A', '#0E1229', 'rgba(110,200,255,0.55)', lw);

  ctx.fillStyle = '#20295A';
  for (var bi = 0; bi < 5; bi++) {
    for (var bj = 0; bj < 5; bj++) {
      dhRect(ctx, V, -10 + bi * 4 + 0.25, -10 + bj * 4 + 0.25, 0, 3.5, 3.5); ctx.fill();
    }
  }
  ctx.strokeStyle = 'rgba(140,170,255,0.12)';
  ctx.lineWidth = 1 * u;
  ctx.beginPath();
  for (bi = 0; bi < 5; bi++) {
    for (bj = 0; bj < 5; bj++) {
      var q0 = dhP(V, -10 + bi * 4 + 0.25, -10 + bj * 4 + 0.25, 0), q1 = dhP(V, -10 + bi * 4 + 3.75, -10 + bj * 4 + 0.25, 0),
          q2 = dhP(V, -10 + bi * 4 + 3.75, -10 + bj * 4 + 3.75, 0), q3 = dhP(V, -10 + bi * 4 + 0.25, -10 + bj * 4 + 3.75, 0);
      ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.lineTo(q3[0], q3[1]); ctx.closePath();
    }
  }
  ctx.stroke();

  var roads = D.roads;
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#B98A3E';
  ctx.lineWidth = 2.2 * u;
  ctx.beginPath();
  for (var r = 0; r < roads.length; r++) {
    for (var side = -1; side <= 1; side += 2) {
      var a1 = dhP(V, roads[r] + side * 0.32, -10.2, 0.002), a2 = dhP(V, roads[r] + side * 0.32, 10.2, 0.002);
      var b1 = dhP(V, -10.2, roads[r] + side * 0.32, 0.002), b2 = dhP(V, 10.2, roads[r] + side * 0.32, 0.002);
      ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]);
      ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]);
    }
  }
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([10 * u, 12 * u]);
  ctx.lineDashOffset = -ph * 22 * u * 30;
  ctx.strokeStyle = 'rgba(255,214,130,' + (0.25 + 0.25 * traffic).toFixed(3) + ')';
  ctx.lineWidth = 1.4 * u;
  ctx.beginPath();
  for (r = 0; r < roads.length; r++) {
    var c1 = dhP(V, roads[r], -10.2, 0.003), c2 = dhP(V, roads[r], 10.2, 0.003);
    var d1 = dhP(V, -10.2, roads[r], 0.003), d2 = dhP(V, 10.2, roads[r], 0.003);
    ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]);
    ctx.moveTo(d1[0], d1[1]); ctx.lineTo(d2[0], d2[1]);
  }
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#E2B65C';
  for (r = 0; r < roads.length; r++) {
    for (var r2 = 0; r2 < roads.length; r2++) {
      var vp = dhP(V, roads[r], roads[r2], 0.004);
      ctx.beginPath(); ctx.ellipse(vp[0], vp[1], 0.42 * s * 1.2247, 0.42 * s * 0.7071, 0, 0, DH_TAU); ctx.fill();
    }
  }
  ctx.fillStyle = '#120B2C';
  for (r = 0; r < roads.length; r++) {
    for (r2 = 0; r2 < roads.length; r2++) {
      vp = dhP(V, roads[r], roads[r2], 0.005);
      ctx.beginPath(); ctx.ellipse(vp[0], vp[1], 0.24 * s * 1.2247, 0.24 * s * 0.7071, 0, 0, DH_TAU); ctx.fill();
    }
  }

  var packets = D.packets;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (var pi = 0; pi < packets.length; pi++) {
    var pk = packets[pi];
    var vis = dhSmooth(pk.rank - 0.15, pk.rank, traffic * 1.1);
    if (vis < 0.01) continue;
    var f = dhFrac(pk.off + ph * pk.speed * pk.lane.dir);
    var along = -10.2 + f * 20.4;
    var edge = Math.min(1, Math.min(f, 1 - f) * 12);
    var a = vis * edge;
    if (a < 0.01) continue;
    var len = 0.55, wid = 0.16;
    var col = pk.warm ? '255,170,70' : '70,240,230';
    var bx, by, bw, bd;
    if (pk.lane.axis === 0) { bx = pk.lane.c - wid / 2; by = along - len / 2; bw = wid; bd = len; }
    else { bx = along - len / 2; by = pk.lane.c - wid / 2; bw = len; bd = wid; }
    var tailDir = pk.lane.dir;
    ctx.fillStyle = 'rgba(' + col + ',' + (0.18 * a).toFixed(3) + ')';
    if (pk.lane.axis === 0) dhRect(ctx, V, bx, by - tailDir * 0.9, 0.01, bw, bd + 0.9);
    else dhRect(ctx, V, bx - tailDir * 0.9, by, 0.01, bw + 0.9, bd);
    ctx.fill();
    dhBox(ctx, V, bx, by, 0.01, bw, bd, 0.14, 'rgba(' + col + ',' + (0.95 * a).toFixed(3) + ')', 'rgba(' + col + ',' + (0.6 * a).toFixed(3) + ')', 'rgba(' + col + ',' + (0.45 * a).toFixed(3) + ')', null, 0);
  }
  ctx.restore();

  var B = D.buildings;
  for (var i = 0; i < B.length; i++) {
    var bd0 = B[i];
    var riseT = 0.25 + bd0.dist * 0.17 + bd0.ph * 0.25;
    var rise = loopT < 12 ? dhEaseOutBack((loopT - riseT) / 1.1) : 1;
    var sinkT = 13.2 + (14 - bd0.dist) * 0.06 + bd0.ph * 0.1;
    var sink = dhEaseInOut((loopT - sinkT) / 0.6);
    var k = Math.max(0, rise * (1 - sink));
    var hh = 0.12 + (bd0.h - 0.12) * k;
    var pal = bd0.pal;
    var x = bd0.x, y = bd0.y, w = bd0.w, d = bd0.d;

    ctx.fillStyle = 'rgba(5,3,15,0.35)';
    dhRect(ctx, V, x + 0.12, y + 0.12, 0.001, w + 0.15, d + 0.15); ctx.fill();

    dhBox(ctx, V, x, y, 0, w, d, hh, pal[0], pal[1], pal[2], pal[3], lw);

    if (!bd0.core) {
      ctx.fillStyle = '#C9A24A';
      var pins = Math.max(2, Math.round(w / 0.35));
      for (var pn = 0; pn < pins; pn++) {
        var pxp = x + (pn + 0.5) * (w / pins) - 0.05;
        dhRect(ctx, V, pxp, y + d, 0.002, 0.1, 0.16); ctx.fill();
        dhRect(ctx, V, x + w, y + (pn + 0.5) * (d / pins) - 0.05, 0.002, 0.16, 0.1); ctx.fill();
      }
    }

    if (hh > 0.45) {
      var floors = Math.max(1, Math.floor((hh - 0.2) / 0.38));
      var cols = Math.max(2, Math.floor(w / 0.42));
      var colsD = Math.max(2, Math.floor(d / 0.42));
      var blink = 0.5 + 0.5 * Math.sin(DH_TAU * (loopT * 2 + bd0.ph * 3));
      var base = 0.28 + 0.25 * traffic;
      var litA = base + blinkAmt * 0.65 * blink;
      var wcol = bd0.core ? '63,240,255' : (bd0.id % 3 === 0 ? '255,190,90' : '110,240,255');
      ctx.fillStyle = 'rgba(' + wcol + ',' + Math.min(1, litA).toFixed(3) + ')';
      ctx.beginPath();
      for (var fl = 0; fl < floors; fl++) {
        var z0 = 0.18 + fl * 0.38;
        if (z0 + 0.2 > hh - 0.1) break;
        for (var c = 0; c < cols; c++) {
          if (blinkAmt > 0.05 && dhHash(bd0.id * 31 + fl * 7 + c + Math.floor(loopT * 3) * 0.13) < 0.25 * blinkAmt) continue;
          var wx = x + (c + 0.2) * (w / cols), ww = (w / cols) * 0.6;
          var p1 = dhP(V, wx, y + d, z0), p2 = dhP(V, wx + ww, y + d, z0), p3 = dhP(V, wx + ww, y + d, z0 + 0.2), p4 = dhP(V, wx, y + d, z0 + 0.2);
          ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.closePath();
        }
        for (c = 0; c < colsD; c++) {
          if (blinkAmt > 0.05 && dhHash(bd0.id * 17 + fl * 5 + c + Math.floor(loopT * 3) * 0.29) < 0.25 * blinkAmt) continue;
          var wy = y + (c + 0.2) * (d / colsD), wd = (d / colsD) * 0.6;
          p1 = dhP(V, x + w, wy, z0); p2 = dhP(V, x + w, wy + wd, z0); p3 = dhP(V, x + w, wy + wd, z0 + 0.2); p4 = dhP(V, x + w, wy, z0 + 0.2);
          ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.closePath();
        }
      }
      ctx.fill();
    }

    var inset = Math.min(w, d) * 0.22;
    ctx.fillStyle = bd0.core ? '#C5D0E0' : 'rgba(255,255,255,0.08)';
    dhRect(ctx, V, x + inset, y + inset, hh + 0.001, w - inset * 2, d - inset * 2); ctx.fill();
    ctx.strokeStyle = bd0.core ? '#8394AE' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1 * u;
    dhRect(ctx, V, x + inset, y + inset, hh + 0.001, w - inset * 2, d - inset * 2); ctx.stroke();

    if (bd0.core) {
      var pulse = 0.5 + 0.5 * Math.sin(DH_TAU * loopT / 1.25);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (var rg = 0; rg < 3; rg++) {
        var rf = dhFrac(ph * 10 + rg / 3);
        var rr = (w / 2 - inset) * (0.2 + rf * 0.8);
        var mx = x + w / 2, my = y + d / 2;
        ctx.strokeStyle = 'rgba(63,240,255,' + ((1 - rf) * (0.4 + 0.5 * traffic)).toFixed(3) + ')';
        ctx.lineWidth = 2 * u;
        dhRect(ctx, V, mx - rr, my - rr, hh + 0.002, rr * 2, rr * 2); ctx.stroke();
      }
      var beamA = (0.25 + 0.35 * pulse) * (0.4 + 0.6 * traffic) * k;
      var bt = dhP(V, x + w / 2, y + d / 2, hh), bh = minSide * 0.26;
      var bg2 = ctx.createLinearGradient(0, bt[1], 0, bt[1] - bh);
      bg2.addColorStop(0, 'rgba(63,240,255,' + beamA.toFixed(3) + ')');
      bg2.addColorStop(1, 'rgba(63,240,255,0)');
      ctx.fillStyle = bg2;
      var bwid = 0.5 * s;
      ctx.fillRect(bt[0] - bwid / 2, bt[1] - bh, bwid, bh);
      ctx.restore();
    } else if (bd0.big && hh > 0.6) {
      var ant = dhP(V, x + w / 2, y + d / 2, hh), antTop = dhP(V, x + w / 2, y + d / 2, hh + 0.7 * k);
      ctx.strokeStyle = pal[3]; ctx.lineWidth = 1.6 * u;
      ctx.beginPath(); ctx.moveTo(ant[0], ant[1]); ctx.lineTo(antTop[0], antTop[1]); ctx.stroke();
      var tip = 0.5 + 0.5 * Math.sin(DH_TAU * (loopT / 1.5 + bd0.ph));
      ctx.fillStyle = 'rgba(255,90,120,' + (0.4 + 0.6 * tip).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(antTop[0], antTop[1], 3.2 * u, 0, DH_TAU); ctx.fill();
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (var sp = 0; sp < 36; sp++) {
    var sf = dhFrac(dhHash(sp * 3.3) + ph * (1 + (sp % 2)));
    var sx = width * dhHash(sp * 7.7);
    var sy = height * (1 - sf);
    var sa = Math.sin(Math.PI * sf) * (0.25 + 0.35 * accent);
    ctx.fillStyle = 'rgba(180,150,255,' + sa.toFixed(3) + ')';
    ctx.fillRect(sx, sy, 2 * u, 6 * u);
  }
  ctx.restore();

  var vg = ctx.createRadialGradient(width * 0.5, height * 0.5, minSide * 0.4, width * 0.5, height * 0.5, Math.max(width, height) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(6,3,16,0.72)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
