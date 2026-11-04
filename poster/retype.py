#!/usr/bin/env python3
"""Re-type the blurry labels of panel 2(c), 2(d) and section 8 as crisp vector text, then export a PDF.

Nothing is reworded: every label keeps its original words, colour and position. The blurry pixels are
removed by inpainting and the same text is placed back as real (vector) text in an SVG layer over the
sharpened poster, so it stays sharp at any print size.

    python3 poster/retype.py poster/poster-diperjelas.png poster/
Outputs: poster-final.pdf (A1 landscape) and poster-final-preview.png.
"""
import html, json, os, sys
import numpy as np
import cv2
from PIL import ImageFont

SRC, OUTDIR = sys.argv[1], sys.argv[2]
F = {
    'carlito': ('Carlito', 400, '/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf'),
    'carlitoB': ('Carlito', 700, '/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf'),
    'interXB': ('Inter', 800, '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'),
}
RED, BLACK, NAVY, GREY = '#e8202c', '#0d0d0d', '#000033', '#3a3a3a'
GBLUE, BODY, LIMIT = '#3a4a96', '#26407e', '#13296f'

# (text, font, colour, cx, cy, ink width in the original, enlarge factor, erase box, ink kind)
# ink kind decides which pixels are treated as old text inside the erase box.
C = []
def lab(t, f, col, cx, cy, w, k, box, kind, size=None):
    C.append(dict(t=t, f=f, col=col, cx=cx, cy=cy, w=w * k if w else None, box=box, kind=kind, size=size))

# ---- panel 2(c)
for t, cy, w, box in [('Overlap-end', 1248, 137, (2781, 1236, 2926, 1260)), ('peel-shear', 1274, 118, (2790, 1262, 2916, 1286)),
                      ('concentration', 1299, 155, (2772, 1288, 2935, 1311))]:
    lab(t, 'carlitoB', RED, 2853, cy, w, 1.0, box, 'red')
for t, cy, w, box in [('Overlap-end', 1433, 139, (3427, 1422, 3575, 1445)), ('peel-shear', 1459, 117, (3438, 1447, 3563, 1471)),
                      ('concentration', 1484, 155, (3418, 1472, 3581, 1496))]:
    lab(t, 'carlitoB', RED, 3500, cy, w, 1.0, box, 'red')
lab('Overlap region', 'carlitoB', BLACK, 3139, 1274, 164, 1.0, (3052, 1262, 3226, 1288), 'dark')
lab('Hybrid carbon-Kevlar', 'carlitoB', BLACK, 3492, 1348, 236, 1.0, (3368, 1335, 3616, 1361), 'dark')
lab('Load', 'carlitoB', BLACK, 2609, 1409, 52, 1.0, (2578, 1398, 2640, 1420), 'dark')
lab('AA5052 Aluminium', 'carlitoB', BLACK, 2773, 1433, 217, 1.0, (2659, 1421, 2889, 1445), 'dark')
# small graph inside 2(c): enlarged a little for legibility
lab('High', 'carlitoB', RED, 2930, 1562, 24, 1.3, (2913, 1553, 2947, 1571), 'red')
lab('High', 'carlitoB', RED, 3358, 1567, 23, 1.3, (3342, 1557, 3377, 1576), 'red')
lab('Shear-peel', 'carlitoB', GREY, 2867, 1614, 57, 1.1, (2834, 1605, 2900, 1621), 'dark')
lab('response', 'carlitoB', GREY, 2867, 1628, 48, 1.1, (2836, 1621, 2898, 1637), 'dark')
lab('Lower toward', 'carlitoB', GBLUE, 3141, 1613, 68, 1.25, (3103, 1604, 3179, 1620), 'blue')
lab('center', 'carlitoB', GBLUE, 3140, 1626, 32, 1.25, (3119, 1619, 3161, 1635), 'blue')
lab('Low', 'carlitoB', GBLUE, 2929, 1687, 22, 1.3, (2913, 1679, 2945, 1696), 'blue')
lab('Overlap end', 'carlitoB', RED, 2981, 1717, 62, 1.3, (2946, 1708, 3016, 1727), 'red')
lab('Overlap center', 'carlitoB', GREY, 3140, 1718, 74, 1.3, (3100, 1708, 3181, 1728), 'dark')
lab('Overlap end', 'carlitoB', RED, 3303, 1717, 60, 1.3, (3268, 1708, 3338, 1727), 'red')

# ---- panel 2(d)
lab('Modular graded-X', 'carlitoB', RED, 2800, 2009, 201, 1.0, (2695, 1998, 2904, 2021), 'red')
lab('at overlap-end', 'carlitoB', RED, 2799, 2032, 163, 1.0, (2713, 2021, 2885, 2044), 'red')
lab('Modular graded-X', 'carlitoB', RED, 3484, 2182, 201, 1.0, (3380, 2171, 3589, 2194), 'red')
lab('at overlap-end', 'carlitoB', RED, 3484, 2204, 164, 1.0, (3398, 2194, 3570, 2217), 'red')
lab('Overlap region', 'carlitoB', BLACK, 3139, 2010, 164, 1.0, (3052, 1998, 3226, 2020), 'dark')
lab('Hybrid carbon-Kevlar', 'carlitoB', BLACK, 3492, 2072, 236, 1.0, (3368, 2060, 3616, 2086), 'dark')
lab('Load', 'carlitoB', BLACK, 2610, 2127, 51, 1.0, (2579, 2116, 2641, 2137), 'dark')
lab('AA5052 Aluminium', 'carlitoB', BLACK, 2774, 2148, 217, 1.0, (2661, 2137, 2889, 2160), 'dark')
DENS = 'density'  # 'High X' / 'Low X' use the same font size as the 'density' line below them
lab('High X', 'carlitoB', RED, 2907, 2243, None, 1.0, (2858, 2226, 2952, 2253), 'red', size=DENS)
lab('density', 'carlitoB', RED, 2908, 2264, 82, 1.0, (2862, 2253, 2954, 2276), 'red')
lab('Low X', 'carlitoB', RED, 3360, 2243, None, 1.0, (3314, 2226, 3408, 2253), 'red', size=DENS)
lab('density', 'carlitoB', RED, 3362, 2264, 80, 1.0, (3317, 2253, 3407, 2276), 'red')
for lv, cx, sub, val in [(1, 2913, '1', '0.2'), (2, 3079, '2', '0.3'), (3, 3297, '2', '0.4')]:
    lab(f'Level {lv}', 'carlitoB', '#333333', cx, 2378, 56, 1.25, (cx - 52, 2367, cx + 52, 2385), 'dark')
    lab(f's{sub} = {val} mm', 'carlitoB', '#333333', cx, 2395, 93, 1.25, (cx - 52, 2385, cx + 52, 2405), 'dark')

# ---- section 8
lab('KEY TAAKAWAYS', 'interXB', NAVY, 3046, 3790, 488, 1.0, (2794, 3760, 3300, 3820), 'dark')
BODY_LINES = [
    ('Laser texturing substantially increases joint strength compared with the untextured control.', 3001, 3852, 1877, 42),
    ('L4-60 achieved 15.73 MPa and retained 96.7% of L1 within a 60% treatment envelope.', 2998, 3912, 1753, 44),
    ('DIC results show reduced strain localization for textured joints.', 2997, 3976, 1247, 43),
    ('Fracture and SEM/EDS analyses indicate a transition from simple interfacial debonding (C0)', 3002, 4033, 1850, 45),
    ('to mixed interfacial failure with localized anchoring (L4-60).', 3000, 4090, 1185, 40),
]
LEFT = []   # left-aligned lines: (text, font, colour, x_left, cy, width, box, kind)
for t, x, y, w, h in BODY_LINES:
    LEFT.append((t, 'carlito', BODY, x, y + h / 2, w, (x - 6, y - 4, x + w + 8, y + h + 4), 'navy'))
LEFT.append(('Limitation:', 'carlitoB', LIMIT, 3100, 4176.5, 200, (3094, 4154, 3306, 4199), 'navy'))
LEFT.append(('The CZM model was calibrated for the baseline C0 joint; three-dimensional topography, fatigue, and durability '
             'remain for future work.', 'carlito', '#3b5296', 3348, 4177, 2283, (3336, 4152, 5660, 4203), 'navy'))
# digits in the orange circles and the section number
DIGITS = [(str(i + 1), 2834.5, cy, 36) for i, cy in enumerate((3867.0, 3939.5, 4012.0, 4089.5))]


def ink_mask(img, box, kind):
    x0, y0, x1, y1 = box
    p = img[y0:y1, x0:x1].astype(int)
    b, g, r = p[..., 0], p[..., 1], p[..., 2]
    s = r + g + b
    if kind == 'red':
        m = (r - g > 60) & (r - b > 50)
    elif kind == 'dark':
        m = s < 560
    elif kind == 'blue':
        m = (s < 600) & (b > r + 10)
    elif kind == 'navy':
        m = (s < 690) & (b >= r)
    elif kind == 'white':
        m = (np.minimum(np.minimum(r, g), b) > 175)
    m = cv2.dilate(m.astype(np.uint8) * 255, np.ones((7, 7) if kind == 'navy' else (5, 5), np.uint8))
    full = np.zeros(img.shape[:2], np.uint8); full[y0:y1, x0:x1] = m
    return full


def fit(text, key, width=None, height=None, size=None):
    _, _, path = F[key]
    f = ImageFont.truetype(path, 100)
    l, t, r, b = f.getbbox(text, anchor='ls')
    if size is None:
        size = 100 * (width / (r - l) if width else height / (b - t))
    f = ImageFont.truetype(path, size)
    return size, f.getbbox(text, anchor='ls')


def svg_text(x, y, text, key, size, col, anchor='start'):
    fam, wt, _ = F[key]
    return (f'<text x="{x:.2f}" y="{y:.2f}" font-family="{fam}" font-weight="{wt}" font-size="{size:.2f}" '
            f'fill="{col}" text-anchor="{anchor}">{html.escape(text)}</text>')


img = cv2.imread(SRC)
mask = np.zeros(img.shape[:2], np.uint8)
svg = []

dens_size = fit('density', 'carlitoB', width=82)[0]
for c in C:
    mask |= ink_mask(img, c['box'], c['kind'])
    size, (l, t, r, b) = fit(c['t'], c['f'], width=c['w'], size=dens_size if c['size'] == DENS else None)
    x = c['cx'] - (l + r) / 2
    y = c['cy'] - (t + b) / 2
    if c['t'].startswith('s') and ' = ' in c['t']:          # s1 = 0.2 mm  ->  s with subscript
        fam, wt, _ = F[c['f']]
        rest = c['t'][2:]
        svg.append(f'<text x="{x:.2f}" y="{y:.2f}" font-family="{fam}" font-weight="{wt}" font-size="{size:.2f}" fill="{c["col"]}">'
                   f's<tspan font-size="{size * 0.68:.2f}" dy="{size * 0.18:.2f}">{c["t"][1]}</tspan>'
                   f'<tspan dy="{-size * 0.18:.2f}">{html.escape(rest)}</tspan></text>')
    else:
        svg.append(svg_text(x, y, c['t'], c['f'], size, c['col']))

for t, key, col, xl, cy, w, box, kind in LEFT:
    mask |= ink_mask(img, box, kind)
    size, (l, tt, r, b) = fit(t, key, width=w)
    svg.append(svg_text(xl - l, cy - (tt + b) / 2, t, key, size, col))

for d, cx, cy, h in DIGITS:
    mask |= ink_mask(img, (int(cx - 15), int(cy - 21), int(cx + 15), int(cy + 21)), 'white')
    size, (l, t, r, b) = fit(d, 'interXB', height=h)
    svg.append(svg_text(cx - (l + r) / 2, cy - (t + b) / 2, d, 'interXB', size, '#ffffff'))
mask |= ink_mask(img, (2636, 3764, 2695, 3840), 'white')
size, (l, t, r, b) = fit('8', 'interXB', height=65)
svg.append(svg_text(2665 - (l + r) / 2, 3801.5 - (t + b) / 2, '8', 'interXB', size, '#ffffff'))

clean = cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)
base = os.path.join(OUTDIR, 'poster-final-base.png')
cv2.imwrite(base, clean, [cv2.IMWRITE_PNG_COMPRESSION, 6])

H, W = img.shape[:2]
page = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size: {W}px {H}px; margin: 0; }}
html, body {{ margin: 0; padding: 0; width: {W}px; height: {H}px; overflow: hidden; }}
img, svg {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; }}
text {{ font-kerning: normal; text-rendering: geometricPrecision; }}
</style></head><body>
<img src="poster-final-base.png">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">
{chr(10).join(svg)}
</svg></body></html>'''
open(os.path.join(OUTDIR, 'poster-final.html'), 'w').write(page)
print('labels:', len(svg))
