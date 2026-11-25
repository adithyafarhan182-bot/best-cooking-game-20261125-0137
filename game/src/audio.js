// Sizzle & Serve — sound: every effect is synthesised with WebAudio, no files.
// A short blip for a chop, filtered noise for the sizzle, a two-note ding when a
// dish is ready, and a little coin arpeggio when a customer pays. A quiet music
// loop (bass + pluck) keeps the kitchen humming; M mutes everything.
let ctx = null;
let muted = false;
let musicTimer = null;
let sizzleNodes = null;

function ensureCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq, seconds, type = 'sine', gain = 0.12, when = 0, slideTo = null) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  const t = ac.currentTime + when;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + seconds);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(amp).connect(ac.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

function noise(seconds, gain = 0.08, filterFreq = 1200) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  const len = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const amp = ac.createGain();
  amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start();
}

/** The chop thock: a low square blip with a noise snap. */
export function playChop() {
  tone(180, 0.08, 'square', 0.08);
  noise(0.05, 0.05, 2400);
}

/** A coin arpeggio for a served dish: E5, G5, B5, E6. */
export function playCoin() {
  [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, i * 0.07));
}

/** Two-note ding when a burner finishes cooking. */
export function playDing() {
  tone(880, 0.18, 'sine', 0.12);
  tone(1175, 0.28, 'sine', 0.12, 0.12);
}

/** A sad descending buzz for a burnt pan or a walked-out customer. */
export function playBurn() {
  tone(220, 0.35, 'sawtooth', 0.08, 0, 110);
}

/** A soft pop when an ingredient is grabbed or plated. */
export function playPop() {
  tone(520, 0.07, 'sine', 0.09, 0, 780);
}

/** A rising whoosh when a new order ticket slides in. */
export function playTicket() {
  noise(0.18, 0.05, 900);
  tone(440, 0.12, 'sine', 0.06, 0, 660);
}

/** Start the quiet sizzle bed while something cooks; call stopSizzle to end it. */
export function startSizzle() {
  const ac = ensureCtx();
  if (!ac || muted || sizzleNodes) return;
  const len = ac.sampleRate;
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;
  const amp = ac.createGain();
  amp.gain.value = 0.015;
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start();
  sizzleNodes = { src, amp };
}

export function stopSizzle() {
  if (!sizzleNodes) return;
  try { sizzleNodes.src.stop(); } catch { /* already stopped */ }
  sizzleNodes = null;
}

// A tiny loop: a walking bass line with a pluck on top, one bar every 2 seconds.
const BASS = [130.8, 98, 110, 146.8];
const PLUCK = [523, 659, 784, 659];
export function startMusic() {
  const ac = ensureCtx();
  if (!ac || musicTimer !== null) return;
  let bar = 0;
  musicTimer = window.setInterval(() => {
    if (muted) return;
    tone(BASS[bar % BASS.length], 0.5, 'triangle', 0.05);
    tone(PLUCK[(bar * 2) % PLUCK.length], 0.22, 'sine', 0.04, 0.25);
    tone(PLUCK[(bar * 2 + 1) % PLUCK.length], 0.22, 'sine', 0.04, 0.75);
    bar += 1;
  }, 500);
}

export function stopMusic() {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  stopSizzle();
}

/** Toggle mute; returns the new muted state. */
export function toggleMute() {
  muted = !muted;
  if (muted) stopSizzle();
  return muted;
}

export function isMuted() {
  return muted;
}
