
let ctx = null;

const PATTERNS = {
  // [frequency Hz, start s, duration s]
  success:  [[660, 0, 0.12], [880, 0.1, 0.16]],
  admitted: [[523, 0, 0.12], [659, 0.11, 0.12], [784, 0.22, 0.22]],
  info:     [[740, 0, 0.14]],
  error:    [[330, 0, 0.14], [262, 0.12, 0.2]],
  on:       [[600, 0, 0.08], [800, 0.07, 0.1]],
  off:      [[800, 0, 0.08], [600, 0.07, 0.1]],
  test:     [[587, 0, 0.15], [784, 0.14, 0.22]],
};

function getCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export async function playTone(name = "info", { volume = 0.06, sinkId } = {}) {
  try {
    const c = getCtx();
    if (!c) return;

    // Route to the chosen speaker where the browser supports it (Chromium).
    if (sinkId !== undefined && typeof c.setSinkId === "function") {
      await c.setSinkId(sinkId === "default" ? "" : sinkId);
    }

    const now = c.currentTime;
    (PATTERNS[name] || PATTERNS.info).forEach(([freq, start, dur]) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    });
  } catch {
    // Audio is a nice-to-have; never break the UI over it.
  }
}