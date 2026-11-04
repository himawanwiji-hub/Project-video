"""Deterministic poster enhancement: sharpen blurry embedded figures and text without changing content.

Steps (luminance only, so colours stay the same):
  1. Richardson-Lucy deconvolution with a small Gaussian PSF  -> recovers edges softened by upscaling
  2. Fine unsharp mask with a noise threshold                 -> crisp letter edges
  3. Mild "clarity" (large-radius local contrast)              -> details pop, like Photoshop Clarity
  4. Slight vibrance on chroma                                 -> colours a touch richer, hues unchanged
Usage: python3 enhance.py in.png out.png [sigma] [rl_iters] [rl_weight]
"""
import sys
import numpy as np
import cv2
from skimage.restoration import richardson_lucy


def gaussian_psf(sigma):
    r = int(np.ceil(sigma * 3))
    x = np.arange(-r, r + 1)
    g = np.exp(-(x ** 2) / (2 * sigma ** 2))
    k = np.outer(g, g)
    return k / k.sum()


def enhance(bgr, sigma=1.4, iters=12, w_rl=0.85, usm_amount=0.55, usm_sigma=0.8, usm_thresh=0.012,
            clarity=0.18, clarity_sigma=18, vibrance=1.08):
    f = bgr.astype(np.float32) / 255.0
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB)
    L = lab[..., 0] / 100.0

    # 1. deconvolution, processed in overlapping tiles to keep memory low
    out = np.empty_like(L)
    psf = gaussian_psf(sigma)
    T, P = 1024, 32
    H, W = L.shape
    for y in range(0, H, T):
        for x in range(0, W, T):
            y0, x0 = max(0, y - P), max(0, x - P)
            y1, x1 = min(H, y + T + P), min(W, x + T + P)
            tile = np.clip(L[y0:y1, x0:x1], 1e-4, 1.0)
            d = richardson_lucy(tile, psf, num_iter=iters, clip=True)
            out[y:min(H, y + T), x:min(W, x + T)] = d[y - y0:y - y0 + min(T, H - y), x - x0:x - x0 + min(T, W - x)]
    Ld = L + w_rl * (out - L)

    # 2. fine unsharp mask with threshold (ignores flat areas / noise)
    blur = cv2.GaussianBlur(Ld, (0, 0), usm_sigma)
    detail = Ld - blur
    mask = np.clip((np.abs(detail) - usm_thresh) / usm_thresh, 0, 1)
    Ld = Ld + usm_amount * detail * mask

    # 3. clarity: gentle large-radius local contrast, limited in mid-tones
    big = cv2.GaussianBlur(Ld, (0, 0), clarity_sigma)
    mid = 1 - np.abs(Ld - 0.5) * 2          # 1 at mid-grey, 0 at black/white
    Ld = Ld + clarity * (Ld - big) * np.clip(mid, 0, 1)

    lab[..., 0] = np.clip(Ld, 0, 1) * 100.0
    # 4. vibrance: scale chroma, more for low-saturation pixels
    a, b = lab[..., 1], lab[..., 2]
    c = np.sqrt(a * a + b * b)
    k = 1 + (vibrance - 1) * np.clip(1 - c / 80.0, 0, 1)
    lab[..., 1], lab[..., 2] = a * k, b * k
    res = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    return (np.clip(res, 0, 1) * 255 + 0.5).astype(np.uint8)


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    sigma = float(sys.argv[3]) if len(sys.argv) > 3 else 1.4
    iters = int(sys.argv[4]) if len(sys.argv) > 4 else 12
    w = float(sys.argv[5]) if len(sys.argv) > 5 else 0.85
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    P = 48                                                     # reflect-pad so the poster border has no artefacts
    padded = cv2.copyMakeBorder(img, P, P, P, P, cv2.BORDER_REFLECT)
    out = enhance(padded, sigma, iters, w)[P:-P, P:-P]
    assert out.shape == img.shape
    cv2.imwrite(dst, out, [cv2.IMWRITE_PNG_COMPRESSION, 6])
