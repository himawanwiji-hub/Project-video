#!/usr/bin/env python3
"""Lecturer-style Indonesian voice-over, generated offline from video/narasi.json.

Voice: espeak-ng + MBROLA Indonesian male voice (mb-id1):
    sudo apt-get install espeak-ng mbrola mbrola-id1

Steps:
    python3 video/voiceover.py plan   # synthesize cues, write video/timing.json (stretches the timeline to fit)
    node video/render.js --out output/fisika-3d-soal-2-dan-4-dosen.mp4 --silent   # render the stretched video
    python3 video/voiceover.py mux    # mix the cues and put them on the video

Every cue is spoken at the same calm pace. If a cue does not fit in its window [t, end] of the authored
150 s timeline, that window is stretched in the video (video/scene.html reads the knots from timing.json).
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUES = json.load(open(os.path.join(ROOT, 'video', 'narasi.json')))
TIMING = os.path.join(ROOT, 'video', 'timing.json')
WORK = os.path.join(ROOT, 'output', 'vo')
SILENT = os.path.join(ROOT, 'output', 'parts', 'dosen-silent.mp4')
OUT = os.path.join(ROOT, 'output', 'fisika-3d-soal-2-dan-4-dosen.mp4')
VOICE, PITCH, SPEED = 'mb-id1', '40', 150
PAD = 0.45          # silence kept after each cue before the window closes
BASE = 150.0        # authored timeline length
os.makedirs(WORK, exist_ok=True)


def dur(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]))


def cue_path(i):
    return os.path.join(WORK, f'cue{i:02d}.wav')


def plan():
    knots, T, prev = [[0.0, 0.0]], 0.0, 0.0
    starts = []
    for i, c in enumerate(CUES):
        subprocess.run(['espeak-ng', '-v', VOICE, '-s', str(SPEED), '-p', PITCH, '-g', '4', '-w', cue_path(i), c['text']], check=True)
        d = dur(cue_path(i))
        T += c['t'] - prev                       # gap before the cue keeps its length
        knots.append([c['t'], round(T, 4)]); starts.append(round(T, 4))
        win = c['end'] - c['t']
        T += max(win, d + PAD)                   # stretch the window if the cue needs more room
        knots.append([c['end'], round(T, 4)])
        prev = c['end']
        print(f'cue {i:2d}  {d:4.1f}s  window {win:4.1f}s -> {max(win, d + PAD):4.1f}s')
    T += BASE - prev
    knots.append([BASE, round(T, 4)])
    json.dump({'knots': knots, 'cueStarts': starts}, open(TIMING, 'w'), indent=1)
    print(f'video length {BASE:.0f}s -> {T:.1f}s; wrote {TIMING}')


def mux():
    timing = json.load(open(TIMING))
    starts, total = timing['cueStarts'], timing['knots'][-1][1]
    inputs, filters = [], []
    for k, t in enumerate(starts):
        inputs += ['-i', cue_path(k)]
        ms = int(t * 1000)
        filters.append(f'[{k}:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[a{k}]')
    mix = ''.join(f'[a{k}]' for k in range(len(starts)))
    filters.append(
        f'{mix}amix=inputs={len(starts)}:normalize=0,'
        'highpass=f=90,lowpass=f=7000,'
        'equalizer=f=180:t=q:w=1:g=3,equalizer=f=3000:t=q:w=1.2:g=2,'
        'aecho=0.8:0.6:35|70:0.16|0.08,'              # a little room, like a lecture hall
        'acompressor=threshold=-18dB:ratio=3:attack=10:release=200,'
        f'apad,atrim=0:{total},loudnorm=I=-16:TP=-1.5:LRA=9[out]')
    voice = os.path.join(WORK, 'voiceover.wav')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(filters), '-map', '[out]', voice], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', SILENT, '-i', voice, '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT], check=True)
    print('wrote', OUT)


if __name__ == '__main__':
    {'plan': plan, 'mux': mux}[sys.argv[1] if len(sys.argv) > 1 else 'plan']()
