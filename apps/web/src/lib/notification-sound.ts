const MIN_SOUND_INTERVAL_MS = 1200;
const SOUND_VOLUME = 0.55;

let audioContext: AudioContext | null = null;
let lastPlayedAt = 0;
let unlockListenerRegistered = false;

type WindowWithWebkitAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

function getAudioContext() {
  if (typeof window === "undefined") return null;

  const typedWindow = window as WindowWithWebkitAudioContext;
  const AudioContextConstructor =
    typedWindow.AudioContext ?? typedWindow.webkitAudioContext;

  if (!AudioContextConstructor) return null;

  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

function playTone(
  context: AudioContext,
  startAt: number,
  frequency: number,
  duration: number,
  volume: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);

  oscillator.addEventListener(
    "ended",
    () => {
      oscillator.disconnect();
      gain.disconnect();
    },
    { once: true },
  );
}

function playChime(context: AudioContext) {
  const now = context.currentTime;
  playTone(context, now, 740, 0.12, SOUND_VOLUME);
  playTone(context, now + 0.09, 980, 0.16, SOUND_VOLUME * 0.9);
}

export function setupNotificationSoundUnlock() {
  if (unlockListenerRegistered || typeof window === "undefined") return;

  unlockListenerRegistered = true;

  const unlock = () => {
    const context = getAudioContext();
    if (!context || context.state !== "suspended") return;
    void context.resume().catch(() => {});
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  window.addEventListener("touchstart", unlock, { passive: true });
}

export function playNotificationSound() {
  const now = Date.now();
  if (now - lastPlayedAt < MIN_SOUND_INTERVAL_MS) return;

  try {
    const context = getAudioContext();
    if (!context) return;

    lastPlayedAt = now;

    if (context.state === "suspended") {
      void context
        .resume()
        .then(() => playChime(context))
        .catch(() => {});
      return;
    }

    playChime(context);
  } catch {
    // Browser autoplay limits can block audio. Notifications should still work.
  }
}
