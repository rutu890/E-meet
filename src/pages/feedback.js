// Tiny UI sounds. One shared AudioContext (cheap), very quiet, user can mute in Settings.
const SOUND_KEY = "euodoo-sound";
let ctx;

// Each tone = list of [frequency Hz, start delay s]
const TONES = {
  success: [[660, 0], [880, 0.09]],
  confirm: [[520, 0]],
  notify: [[740, 0], [988, 0.08]],
  pop: [[600, 0]],
  error: [[300, 0], [220, 0.1]],
};

export function isSoundOn() {
  try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; }
}
export function setSoundOn(on) {
  try { localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch { /* ignore */ }
}

export function playTone(kind = "success") {
  if (!isSoundOn()) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume();
    const t0 = ctx.currentTime;
    (TONES[kind] || TONES.success).forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = t0 + delay;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.035, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
      osc.start(start);
      osc.stop(start + 0.14);
    });
  } catch { /* audio is optional */ }
}
