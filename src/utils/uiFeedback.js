
import { toast } from "sonner";

let audioContext;

function playSuccessTone() {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    audioContext ??= new AudioContextClass();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime + 0.07
    );

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.045,
      audioContext.currentTime + 0.015
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.18
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.19);
  } catch {
    // Audio is optional; notifications should still work.
  }
}

export function showSuccess(message) {
  toast.success(message, {
    duration: 2200,
    position: "top-right",
    icon: "✓",
    className: "em-success-toast",
  });

  playSuccessTone();
}

export function showError(message) {
  toast.error(message, {
    duration: 2800,
    position: "top-right",
  });
}
