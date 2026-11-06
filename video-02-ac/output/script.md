# Script: How an Air Conditioner Works

Format 1920×1080, 30 fps, ±75.5 s (durasi dari `script/timing.json`). Narasi edge-tts `en-US-AndrewNeural`.
Alur: Hook → Mekanisme dasar → Proses 4 langkah → Rangkuman.

## Narasi dan teks layar per adegan

| # | Adegan | Narasi (EN) | Teks layar (judul · info) |
|---|---|---|---|
| 1 | Hook | An air conditioner does not make cold air. It moves heat. It picks up heat inside your room, and carries it outside. | HOW IT WORKS · *An air conditioner moves heat* · It does not make cold air · Heat goes from your room to the outdoors |
| 2 | Mekanisme dasar | The secret is a fluid called a refrigerant. When a liquid evaporates, it absorbs heat. When a vapor condenses, it releases heat. An air conditioner uses both, in a closed loop. | THE KEY IDEA · *Refrigerant* · Liquid evaporates: absorbs heat · Vapor condenses: releases heat · One closed loop |
| 3 | Langkah 1 | Step one: the compressor. It squeezes low-pressure refrigerant vapor into a hot, high-pressure gas. | STEP 1 · *Compressor* · In: low-pressure vapor · Out: hot, high-pressure gas |
| 4 | Langkah 2 | Step two: the condenser, in the outdoor unit. A fan blows outside air across the hot coil. The gas releases its heat, and condenses into a high-pressure liquid. | STEP 2 · *Condenser* · Outdoor unit · Gas releases heat to outside air · Gas condenses into a high-pressure liquid |
| 5 | Langkah 3 | Step three: the expansion valve. The liquid is forced through a narrow opening. Its pressure drops suddenly, and it becomes very cold. | STEP 3 · *Expansion valve* · Narrow opening · Pressure drops suddenly · Liquid becomes very cold |
| 6 | Langkah 4 | Step four: the evaporator, in the indoor unit. A fan pulls warm room air across the cold coil. The refrigerant absorbs the heat and evaporates. The air comes out cooler. | STEP 4 · *Evaporator* · Indoor unit · Absorbs heat from warm room air · Refrigerant evaporates · Air comes out cooler |
| 7 | Rangkuman | The vapor returns to the compressor, and the cycle repeats. Compress, condense, expand, evaporate. Heat in from your room, heat out to the outdoors. | SUMMARY · *One continuous cycle* · 1 Compress · 2 Condense · 3 Expand · 4 Evaporate · Heat in from your room · Heat out to the outdoors |

Tidak ada angka atau rumus di layar maupun di narasi. Warna di diagram bersifat kualitatif: oranye = gas panas bertekanan tinggi, kuning = cairan bertekanan tinggi, biru muda = campuran dingin bertekanan rendah, biru = uap bertekanan rendah.

## Tabel verifikasi

Folder `input/` tidak ada, jadi belum ada file sumber untuk dirujuk. Semua klaim memakai pengetahuan umum dan perlu kamu cocokkan dengan bahan kuliah.

| Klaim di video | Sumber | Halaman | Status |
|---|---|---|---|
| AC memindahkan panas dari dalam ke luar, bukan "membuat dingin" | pengetahuan umum | – | perlu dicek |
| Cairan yang menguap menyerap panas; uap yang mengembun melepas panas | pengetahuan umum | – | perlu dicek |
| Refrigeran bersirkulasi dalam siklus tertutup | pengetahuan umum | – | perlu dicek |
| Kompresor: uap tekanan rendah → gas panas tekanan tinggi | pengetahuan umum | – | perlu dicek |
| Kondensor ada di unit luar; kipas meniupkan udara luar; gas mengembun jadi cairan tekanan tinggi | pengetahuan umum | – | perlu dicek |
| Katup ekspansi: celah sempit, tekanan turun mendadak, refrigeran menjadi sangat dingin | pengetahuan umum | – | perlu dicek |
| Evaporator ada di unit dalam; kipas menarik udara kamar; refrigeran menyerap panas dan menguap; udara keluar lebih sejuk | pengetahuan umum | – | perlu dicek |
| Uap kembali ke kompresor, siklus berulang | pengetahuan umum | – | perlu dicek |

## Celah Data (perlu jawabanmu)

1. **Tidak ada bahan sumber di `input/`.** Mohon kirim modul/PDF agar tabel verifikasi bisa diisi nomor halaman, atau konfirmasi bahwa isi umum ini boleh dipakai.
2. **Jenis alat ekspansi.** Video menyebut "expansion valve". Kalau materi kuliah memakai pipa kapiler untuk AC split, narasi dan label perlu diubah.
3. **Posisi alat ekspansi.** Di diagram, alat ekspansi digambar di sisi luar (outdoor). Ini disederhanakan, dan perlu dicek apakah sesuai bahan.
4. **Angka.** Tidak ada angka tekanan, suhu, jenis refrigeran, atau COP. Kalau ingin ditampilkan, harus dari sumber.
5. **Video referensi gaya** (`reference/`) tidak ada. Gaya mengikuti deskripsi di prompt.

## Catatan produksi

- **Suara:** ElevenLabs tidak dipakai karena `ELEVENLABS_API_KEY` tidak diset dan host-nya diblokir jaringan. Dipakai provider cadangan edge-tts (gratis). `tools/tts.py` sudah menyiapkan mode `--provider elevenlabs` dengan konfirmasi jumlah karakter, tapi mode itu **belum teruji**.
- **Render:** dipakai HTML/SVG + Chromium headless + ffmpeg (`video/render.js`), bukan Remotion. Pipeline ini sudah terbukti di repo, tidak butuh dependensi baru, dan halaman lisensi Remotion tidak bisa dibuka dari jaringan ini untuk dicek.
- **Perakitan:** `tools/assemble.py` (skrip dari kamu) meletakkan `audio/scene_N.mp3` tepat di waktu mulai tiap adegan dari `script/scenes.json`.
- **Branding:** tidak ada file di `assets/`, jadi video tanpa nama/logo UMY.

## YouTube (EN)

**Title (53 chars):** How an Air Conditioner Works: The Refrigeration Cycle

**Description:**
An air conditioner does not make cold air. It moves heat from your room to the outdoors. This short animation follows the refrigerant through the four steps of the cycle: the compressor, the condenser in the outdoor unit, the expansion valve, and the evaporator in the indoor unit.

0:00 Hook: an AC moves heat
0:08 The key idea: evaporation and condensation
0:21 Step 1: Compressor
0:29 Step 2: Condenser
0:41 Step 3: Expansion valve
0:50 Step 4: Evaporator
1:03 Summary

Mechanical Engineering education video.

**Hashtags:** #AirConditioner #Refrigeration #MechanicalEngineering #HVAC #Thermodynamics

**References:** belum ada, karena tidak ada sumber yang diberikan di `input/`.
