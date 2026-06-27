/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AmbientThemeId = "rain" | "cafe" | "library";

export interface AmbientTheme {
  id: AmbientThemeId;
  name: string;
  icon: string;
  description: string;
}

export const AMBIENT_THEMES: AmbientTheme[] = [
  {
    id: "rain",
    name: "Rainy Window",
    icon: "🌧️",
    description: "Soft rain tapping on a window with melancholic Lo-Fi chords."
  },
  {
    id: "cafe",
    name: "Cozy Café",
    icon: "☕",
    description: "Vintage vinyl crackle and warm café jazz chords."
  },
  {
    id: "library",
    name: "Library Silence",
    icon: "📚",
    description: "Deep soothing silence, warm drafts, and pure, spacious keys."
  }
];

class CozyAmbientSynth {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentThemeId: AmbientThemeId = "rain";
  
  // Nodes references
  private masterVolume: GainNode | null = null;
  private chordsInterval: number | null = null;
  private noiseNode: AudioScheduledSourceNode | null = null;
  private activeOscillators: { osc: OscillatorNode; gain: GainNode; lfo?: OscillatorNode }[] = [];
  
  private currentChordIndex = 0;

  // Configuration per theme
  private themesConfig: Record<AmbientThemeId, {
    chords: number[][];
    intervalMs: number;
    lowpassFreq: number;
    noiseGain: number;
    oscType: OscillatorType;
    synthAttack: number;
    synthVolume: number;
  }> = {
    rain: {
      chords: [
        [110.00, 164.81, 196.00, 246.94, 293.66], // Am9-ish
        [116.54, 155.56, 196.00, 233.08, 277.18], // Comfort shift
        [97.99, 146.83, 174.61, 220.00, 261.63],  // G9-ish
        [130.81, 196.00, 261.63, 329.63, 392.00]   // Cmaj-ish
      ],
      intervalMs: 5000,
      lowpassFreq: 800,
      noiseGain: 0.07,
      oscType: "triangle",
      synthAttack: 2.0,
      synthVolume: 0.04
    },
    cafe: {
      chords: [
        [130.81, 164.81, 196.00, 246.94], // Cmaj7
        [110.00, 146.83, 174.61, 220.00], // A7-ish
        [146.83, 174.61, 220.00, 261.63], // Dm7
        [97.99, 146.83, 196.00, 246.94]   // G7
      ],
      intervalMs: 4000,
      lowpassFreq: 1200,
      noiseGain: 0.08,
      oscType: "triangle",
      synthAttack: 1.5,
      synthVolume: 0.035
    },
    library: {
      chords: [
        [82.41, 164.81, 246.94, 329.63], // Em
        [130.81, 196.00, 261.63, 329.63], // Cmaj
        [97.99, 146.83, 196.00, 293.66],  // Gmaj
        [146.83, 220.00, 293.66, 369.99]  // Dmaj
      ],
      intervalMs: 7000,
      lowpassFreq: 250,
      noiseGain: 0.04,
      oscType: "sine",
      synthAttack: 3.0,
      synthVolume: 0.03
    }
  };

  constructor() {}

  public toggle(themeId?: AmbientThemeId): boolean {
    if (themeId) {
      this.currentThemeId = themeId;
    }
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public setTheme(themeId: AmbientThemeId) {
    const themeChanged = this.currentThemeId !== themeId;
    this.currentThemeId = themeId;
    if (this.isPlaying && themeChanged) {
      // Smooth restart with new theme parameters
      this.stopNodesAndIntervals();
      this.startNodesAndIntervals();
    }
  }

  public getTheme(): AmbientThemeId {
    return this.currentThemeId;
  }

  public isActive(): boolean {
    return this.isPlaying;
  }

  private start() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error("Web Audio API not supported in this browser.");
        return;
      }
      this.audioCtx = new AudioContextClass();
      this.isPlaying = true;

      // Master Gain
      this.masterVolume = this.audioCtx.createGain();
      this.masterVolume.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
      this.masterVolume.connect(this.audioCtx.destination);

      this.startNodesAndIntervals();
    } catch (err) {
      console.error("Failed to start Cozy Synth:", err);
    }
  }

  private startNodesAndIntervals() {
    if (!this.audioCtx || !this.masterVolume) return;

    // 1. Generate customized ambient background loop
    this.startAtmosphereLoop();

    // 2. Play first chord immediately
    this.playNextChord();

    // 3. Setup interval
    const config = this.themesConfig[this.currentThemeId];
    this.chordsInterval = window.setInterval(() => {
      this.playNextChord();
    }, config.intervalMs);
  }

  private startAtmosphereLoop() {
    if (!this.audioCtx || !this.masterVolume) return;

    const config = this.themesConfig[this.currentThemeId];
    const bufferSize = this.audioCtx.sampleRate * 2; // 2-second looped buffer
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      
      if (this.currentThemeId === "cafe") {
        // Cafe theme: Vinyl pops/crackles + warm mid-tone noise
        // Custom vinyl crackle spikes
        const crackle = Math.random() > 0.997 ? (Math.random() * 0.8) : 0;
        data[i] = ((lastOut + (0.02 * white)) / 1.02) + crackle;
      } else if (this.currentThemeId === "library") {
        // Library theme: Extremely warm hum, lower high-frequency noise
        data[i] = (lastOut + (0.005 * white)) / 1.005;
      } else {
        // Rain theme: standard soothing rain pink noise simulation
        data[i] = (lastOut + (0.025 * white)) / 1.025;
      }
      lastOut = data[i];
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Apply lowpass filter custom to the selected theme
    const lowpass = this.audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(config.lowpassFreq, this.audioCtx.currentTime);

    const noiseGain = this.audioCtx.createGain();
    noiseGain.gain.setValueAtTime(config.noiseGain, this.audioCtx.currentTime);

    noise.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(this.masterVolume);
    noise.start();

    this.noiseNode = noise;
  }

  private playNextChord() {
    if (!this.audioCtx || !this.masterVolume) return;

    const now = this.audioCtx.currentTime;
    const config = this.themesConfig[this.currentThemeId];
    const chordNotes = config.chords[this.currentChordIndex];
    this.currentChordIndex = (this.currentChordIndex + 1) % config.chords.length;

    // Play all notes of the current jazz/ambient chord
    chordNotes.forEach((frequency, index) => {
      if (!this.audioCtx || !this.masterVolume) return;

      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = config.oscType;
      osc.frequency.setValueAtTime(frequency, now);

      // Lowpass filter to muffle and sweeten sound
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(this.currentThemeId === "library" ? 400 : 550, now);

      // Add gentle lofi tape saturation wobbling (LFO)
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(2.5 + Math.random() * 1.5, now); // 2.5 - 4 Hz LFO
      lfoGain.gain.setValueAtTime(1.5 + Math.random() * 1.5, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      // Soft envelope curves
      gainNode.gain.setValueAtTime(0, now);
      // Envelope SWELL/ATTACK
      gainNode.gain.linearRampToValueAtTime(config.synthVolume - (index * 0.003), now + config.synthAttack);
      // Envelope DECAY/RELEASE
      gainNode.gain.setValueAtTime(config.synthVolume - (index * 0.003), now + config.synthAttack + 1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + (config.intervalMs / 1000) - 0.1);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterVolume);

      osc.start(now);
      osc.stop(now + (config.intervalMs / 1000));

      const oscRecord = { osc, gain: gainNode, lfo };
      this.activeOscillators.push(oscRecord);

      setTimeout(() => {
        try {
          lfo.stop();
        } catch (e) {}
        this.activeOscillators = this.activeOscillators.filter(item => item !== oscRecord);
      }, config.intervalMs + 200);
    });
  }

  private stopNodesAndIntervals() {
    if (this.chordsInterval) {
      clearInterval(this.chordsInterval);
      this.chordsInterval = null;
    }

    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
      } catch (e) {}
      this.noiseNode = null;
    }

    // Stop and clear all active oscillators
    this.activeOscillators.forEach((item) => {
      try {
        item.osc.stop();
      } catch (e) {}
      try {
        if (item.lfo) item.lfo.stop();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }

  public stop() {
    this.isPlaying = false;
    this.stopNodesAndIntervals();

    if (this.masterVolume) {
      this.masterVolume.disconnect();
      this.masterVolume = null;
    }

    if (this.audioCtx) {
      if (this.audioCtx.state !== "closed") {
        this.audioCtx.close();
      }
      this.audioCtx = null;
    }
  }
}

export const ambientSynth = new CozyAmbientSynth();
