# Fisika Listrik dalam 3D: Soal 2 (Motor) dan Soal 4 (Generator AC)

Video animasi 3D (1920×1080, 30 fps, ±2,5 menit) yang dibuat ulang dari animasi 2D
"Pembahasan UTS Fisika Listrik versi latihan, Teknik Mesin UMY". Isinya hanya **Soal 2** dan **Soal 4**.

**Hasil:** [`output/fisika-3d-soal-2-dan-4.mp4`](output/fisika-3d-soal-2-dan-4.mp4)

## Isi video

| Waktu | Bagian | Yang ditampilkan |
|---|---|---|
| 0:00 | Pembuka | Judul |
| 0:06 | Soal 2 · Motor | Kumparan di antara kutub U–S. Arus (titik kuning), gaya Lorentz (panah hijau), medan B (garis biru) |
| 0:22 | Soal 2 · Komutator | Close-up belahan cincin: sisi yang menyentuh sikat + menyala merah, sisi yang menyentuh sikat − menyala biru |
| 0:32 | Soal 2 · Tanpa komutator | Kumparan berayun lalu berhenti tegak (torsi nol) |
| 0:44 | Soal 2C · GGL balik | ε = 7,5 V, I = 0,5 A, lalu poros ditahan: I = 3 A, panas 27 W (36×), kumparan memerah |
| 0:58 | Soal 2A · Gaya Lorentz | Kawat diputar 90° → 30° → 0°, F = 0,60 sin θ N |
| 1:12 | Soal 4B · Generator AC | Garis medan yang menembus kumparan disorot, grafik Φ (putus-putus) dan ε, lampu menyala sesuai ε |
| 1:38 | Soal 4A · Putaran 2× | Gelombang GGL dua kali lebih tinggi, ε maks = NBAω ≈ 471 V |
| 1:48 | Soal 4C · Frekuensi | Rotor 4 kutub @1500 rpm = 50 Hz, 24 kutub @250 rpm (PLTA) = 50 Hz, 1470 rpm = 49 Hz |
| 2:10 | Soal 4D · Genset 20 kVA | Batang beban 3D: 13 kW = 81% (lewat batas 12,8 kW), pompa dimatikan → 63% |
| 2:25 | Penutup | Motor dan generator adalah mesin yang sama |

## Cara membuat ulang

Butuh Node.js, ffmpeg, dan Playwright (Chromium).

```bash
npm install
npm run render                                  # video penuh → output/fisika-3d-soal-2-dan-4.mp4
node video/render.js --start 58 --end 72 --out output/lorentz.mp4   # potongan tertentu
npm run stills                                  # gambar PNG untuk cek cepat → output/stills/
```

- `video/scene.html`: adegan Three.js, simulasi, linimasa kamera, dan teks. Kalau dibuka lewat
  server lokal (misalnya `npx serve .` lalu buka `/video/scene.html`), animasinya diputar langsung
  di browser. Tambahkan `?t=60` untuk mulai dari detik ke-60.
- `video/render.js`: merender setiap frame di Chromium headless dan meng-encode ke MP4 (H.264) lewat ffmpeg.

Animasi bersifat kualitatif; skala waktu dan ukuran disesuaikan agar mudah dilihat.
