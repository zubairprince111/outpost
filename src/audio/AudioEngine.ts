/**
 * Comprehensive Audio Controller for OUTPOST
 * Supports soundtrack music, crisis alert music, voice narration,
 * and high-fidelity Web Audio synthesized sound effects.
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;

  private ambientMusic: HTMLAudioElement | null = null;
  private alertMusic: HTMLAudioElement | null = null;
  private voiceAudio: HTMLAudioElement | null = null;

  private currentMusicState: 'ambient' | 'alert' | 'none' = 'none';

  private constructor() {
    // Lazy initialization on first user interaction
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (!this.ambientMusic) {
      this.ambientMusic = new Audio('/audio/ambient_exploration.mp3');
      this.ambientMusic.loop = true;
      this.ambientMusic.volume = this.isMuted ? 0 : 0.45 * this.masterVolume;
    }

    if (!this.alertMusic) {
      this.alertMusic = new Audio('/audio/crisis_alert.mp3');
      this.alertMusic.loop = true;
      this.alertMusic.volume = this.isMuted ? 0 : 0.6 * this.masterVolume;
    }
  }

  public playAmbient() {
    this.init();
    if (this.currentMusicState === 'ambient') return;
    this.currentMusicState = 'ambient';

    if (this.alertMusic) {
      this.fadeOut(this.alertMusic, 1.0, () => {
        this.alertMusic?.pause();
      });
    }

    if (this.ambientMusic) {
      this.ambientMusic.currentTime = 0;
      this.fadeIn(this.ambientMusic, this.isMuted ? 0 : 0.45 * this.masterVolume, 1.5);
    }
  }

  public playCrisis() {
    this.init();
    if (this.currentMusicState === 'alert') return;
    this.currentMusicState = 'alert';

    if (this.ambientMusic) {
      this.fadeOut(this.ambientMusic, 0.8, () => {
        this.ambientMusic?.pause();
      });
    }

    if (this.alertMusic) {
      this.alertMusic.currentTime = 0;
      this.fadeIn(this.alertMusic, this.isMuted ? 0 : 0.65 * this.masterVolume, 1.0);
    }

    // Play crisis alert synth
    this.playWarningKlaxon();
  }

  public playVoice(type: 'problem1' | 'problem2') {
    this.init();
    const src = type === 'problem1' ? '/audio/problem_voice1.mp3' : '/audio/problem_voice2.mp3';
    if (this.voiceAudio) {
      this.voiceAudio.pause();
    }
    this.voiceAudio = new Audio(src);
    this.voiceAudio.volume = this.isMuted ? 0 : 0.85 * this.masterVolume;
    this.voiceAudio.play().catch(() => {
      // Browser autoplay policy grace
    });
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ambientMusic) {
      this.ambientMusic.volume = this.isMuted ? 0 : (this.currentMusicState === 'ambient' ? 0.45 * this.masterVolume : 0);
    }
    if (this.alertMusic) {
      this.alertMusic.volume = this.isMuted ? 0 : (this.currentMusicState === 'alert' ? 0.65 * this.masterVolume : 0);
    }
    if (this.voiceAudio) {
      this.voiceAudio.volume = this.isMuted ? 0 : 0.85 * this.masterVolume;
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /* ----------------- Web Audio Synthesizer SFX ----------------- */

  public playBeep(freq = 880, duration = 0.08, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15 * this.masterVolume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  public playSubsystemFocus() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, this.audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2 * this.masterVolume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.22);
    } catch {
      // ignore
    }
  }

  public playWarningKlaxon() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        const start = now + i * 0.35;
        osc.frequency.setValueAtTime(620, start);
        osc.frequency.linearRampToValueAtTime(420, start + 0.25);
        gain.gain.setValueAtTime(0.25 * this.masterVolume, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.28);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.28);
      }
    } catch {
      // ignore
    }
  }

  public playFutureForkWhoosh() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, this.audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25 * this.masterVolume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch {
      // ignore
    }
  }

  public playSuccessChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        const t = this.audioCtx!.currentTime + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch {
      // ignore
    }
  }

  private fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number) {
    audio.volume = 0;
    audio.play().catch(() => {});
    const step = 0.05;
    const intervalTime = (duration * 1000) / (targetVolume / step);
    const timer = setInterval(() => {
      if (audio.volume + step >= targetVolume) {
        audio.volume = targetVolume;
        clearInterval(timer);
      } else {
        audio.volume += step;
      }
    }, Math.max(intervalTime, 20));
  }

  private fadeOut(audio: HTMLAudioElement, duration: number, onComplete?: () => void) {
    const step = 0.05;
    const intervalTime = (duration * 1000) / (audio.volume / step);
    const timer = setInterval(() => {
      if (audio.volume - step <= 0) {
        audio.volume = 0;
        clearInterval(timer);
        onComplete?.();
      } else {
        audio.volume -= step;
      }
    }, Math.max(intervalTime, 20));
  }
}
