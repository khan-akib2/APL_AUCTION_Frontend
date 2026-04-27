// Web Audio API based sound effects — no external files needed

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!window._audioCtx) window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return window._audioCtx;
}

function playTone({ frequency = 440, type = 'sine', duration = 0.15, gain = 0.3, ramp = true }) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  if (ramp) gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playBidSound() {
  // Short ascending tick
  playTone({ frequency: 600, type: 'sine', duration: 0.1, gain: 0.25 });
  setTimeout(() => playTone({ frequency: 800, type: 'sine', duration: 0.08, gain: 0.2 }), 80);
}

export function playSoldSound() {
  // Triumphant ascending chord
  playTone({ frequency: 523, type: 'triangle', duration: 0.3, gain: 0.3 });
  setTimeout(() => playTone({ frequency: 659, type: 'triangle', duration: 0.3, gain: 0.3 }), 100);
  setTimeout(() => playTone({ frequency: 784, type: 'triangle', duration: 0.5, gain: 0.35 }), 200);
  setTimeout(() => playTone({ frequency: 1047, type: 'triangle', duration: 0.6, gain: 0.3 }), 350);
}

export function playUnsoldSound() {
  // Descending dull tone
  playTone({ frequency: 300, type: 'sawtooth', duration: 0.25, gain: 0.2 });
  setTimeout(() => playTone({ frequency: 200, type: 'sawtooth', duration: 0.3, gain: 0.15 }), 200);
}

export function playTimerUrgentSound() {
  // Soft tick for last 5 seconds
  playTone({ frequency: 880, type: 'square', duration: 0.05, gain: 0.1 });
}
