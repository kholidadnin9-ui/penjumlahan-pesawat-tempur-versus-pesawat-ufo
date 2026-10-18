let ctx: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => { muted = m; };
export const isMuted = () => muted;

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(type: OscillatorType, f1: number, f2: number, dur: number, vol = 0.2, delay = 0) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

export const sfxLaser = () => { tone('square', 1800, 220, 0.25, 0.12); tone('sawtooth', 900, 120, 0.25, 0.06); };

export function sfxBoom() {
  const c = ac(); if (!c) return;
  const dur = 0.9;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(2000, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(80, c.currentTime + dur);
  const g = c.createGain(); g.gain.value = 0.6;
  src.connect(f).connect(g).connect(c.destination);
  src.start();
  tone('sine', 120, 30, 0.5, 0.4);
}

export const sfxWrong = () => { tone('sawtooth', 300, 90, 0.35, 0.15); tone('square', 200, 80, 0.4, 0.08, 0.1); };
export const sfxClick = () => tone('triangle', 600, 900, 0.08, 0.12);
export function sfxWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, f, 0.25, 0.18, i * 0.13));
}
export const sfxTick = () => tone('square', 980, 980, 0.07, 0.1);
export const sfxTimeout = () => { tone('sawtooth', 240, 60, 0.55, 0.18); tone('square', 180, 50, 0.5, 0.08, 0.05); };
