// Every sound in the lobby is synthesized with WebAudio: no audio files.
// Ambience (city rumble, wind, distant horns), a slow lobby theme, and UI sfx.

type Ctx = AudioContext;

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Am(add9) · Fmaj7 · C(add9) · G6/B, as MIDI notes.
const CHORDS = [
  [45, 52, 59, 60, 64],
  [41, 48, 52, 57, 60],
  [48, 55, 62, 64, 67],
  [47, 55, 62, 64, 67],
];
const BAR = 4.8; // seconds per chord

class LobbyAudio {
  private ctx: Ctx | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private ambBus!: GainNode;
  private delayIn!: GainNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private nextBar = 0;
  private bar = 0;
  private nextHorn = 0;
  private soundOn = true;
  private musicOn = true;
  private lastHover = 0;

  get ready() {
    return this.ctx !== null;
  }

  /** Must run inside a user gesture. Safe to call repeatedly. */
  start() {
    if (typeof window === "undefined") return;
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    let ctx: Ctx;
    try {
      ctx = new AC();
    } catch {
      return;
    }
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.soundOn ? 0.9 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);

    this.ambBus = ctx.createGain();
    this.ambBus.gain.value = 0;
    this.ambBus.connect(this.master);

    // Shared echo for the arpeggio and chimes.
    this.delayIn = ctx.createGain();
    const delay = ctx.createDelay(2);
    delay.delayTime.value = BAR / 16 * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2200;
    const wet = ctx.createGain();
    wet.gain.value = 0.32;
    this.delayIn.connect(delay);
    delay.connect(tone).connect(fb).connect(delay);
    tone.connect(wet).connect(this.musicBus);

    this.noise = this.makeNoise(ctx);
    this.startAmbience();

    const t = ctx.currentTime;
    this.ambBus.gain.setTargetAtTime(1, t, 1.5);
    this.musicBus.gain.setTargetAtTime(this.musicOn ? 1 : 0, t + 0.5, 2);
    this.nextBar = t + 0.6;
    this.nextHorn = t + 9;
    this.timer = window.setInterval(() => this.schedule(), 250);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) void this.ctx.suspend();
    else if (this.soundOn) void this.ctx.resume();
  };

  setSound(on: boolean) {
    this.soundOn = on;
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.15);
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.6);
  }

  private makeNoise(ctx: Ctx) {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  private brown(ctx: Ctx) {
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.2;
      }
    }
    return buf;
  }

  private startAmbience() {
    const ctx = this.ctx!;
    // City rumble.
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.brown(ctx);
    rumble.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    rumble.connect(lp).connect(g).connect(this.ambBus);
    rumble.start();

    // Wind across the balcony, slowly breathing.
    const wind = ctx.createBufferSource();
    wind.buffer = this.noise;
    wind.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 520;
    bp.Q.value = 0.6;
    const wg = ctx.createGain();
    wg.gain.value = 0.025;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain).connect(wg.gain);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.045;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 260;
    lfo2.connect(lfo2Gain).connect(bp.frequency);
    wind.connect(bp).connect(wg).connect(this.ambBus);
    wind.start();
    lfo.start();
    lfo2.start();
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    const horizon = ctx.currentTime + 1.2;
    while (this.nextBar < horizon) {
      this.playBar(this.nextBar, this.bar);
      this.nextBar += BAR;
      this.bar++;
    }
    if (this.nextHorn < horizon) {
      this.horn(this.nextHorn);
      this.nextHorn += 14 + Math.random() * 22;
    }
  }

  private playBar(t: number, index: number) {
    const ctx = this.ctx!;
    const chord = CHORDS[index % CHORDS.length];

    // Pad: detuned saws through a soft lowpass.
    const padOut = ctx.createGain();
    padOut.gain.setValueAtTime(0, t);
    padOut.gain.linearRampToValueAtTime(0.05, t + 1.6);
    padOut.gain.setValueAtTime(0.05, t + BAR - 0.4);
    padOut.gain.linearRampToValueAtTime(0, t + BAR + 2.2);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(420, t);
    lp.frequency.linearRampToValueAtTime(980, t + BAR * 0.6);
    lp.frequency.linearRampToValueAtTime(520, t + BAR + 2);
    lp.Q.value = 0.8;
    padOut.connect(lp).connect(this.musicBus);
    for (const n of chord.slice(0, 4)) {
      for (const detune of [-8, 7]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = NOTE(n);
        o.detune.value = detune;
        o.connect(padOut);
        o.start(t);
        o.stop(t + BAR + 2.4);
      }
    }

    // Sub pulse on beats one and three.
    for (const beat of [0, 2]) {
      const bt = t + (BAR / 4) * beat;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(NOTE(chord[0] - 12) * 1.5, bt);
      o.frequency.exponentialRampToValueAtTime(NOTE(chord[0] - 12), bt + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, bt);
      g.gain.exponentialRampToValueAtTime(0.12, bt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, bt + 0.9);
      o.connect(g).connect(this.musicBus);
      o.start(bt);
      o.stop(bt + 1);
    }

    // Arpeggio from the upper chord tones, every eighth, into the echo.
    if (index >= 2) {
      const tones = chord.slice(1).map((n) => n + 12);
      const pattern = [0, 1, 2, 3, 2, 1, 3, 2];
      pattern.forEach((p, i) => {
        if (index % 4 === 3 && i > 4) return;
        const nt = t + (BAR / 8) * i;
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = NOTE(tones[p % tones.length]);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, nt);
        g.gain.exponentialRampToValueAtTime(0.045, nt + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, nt + 0.42);
        o.connect(g);
        g.connect(this.musicBus);
        g.connect(this.delayIn);
        o.start(nt);
        o.stop(nt + 0.5);
      });
    }
  }

  private horn(t: number) {
    const ctx = this.ctx!;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    const g = ctx.createGain();
    const len = 0.25 + Math.random() * 0.35;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.022, t + 0.03);
    g.gain.setValueAtTime(0.022, t + len);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.25);
    g.connect(lp).connect(pan).connect(this.ambBus);
    const base = 280 + Math.random() * 120;
    for (const ratio of [1, 1.26]) {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = base * ratio;
      o.connect(g);
      o.start(t);
      o.stop(t + len + 0.3);
    }
  }

  // ---- UI sounds -------------------------------------------------------

  private env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  hover() {
    const ctx = this.ctx;
    if (!ctx || !this.soundOn) return;
    const now = ctx.currentTime;
    if (now - this.lastHover < 0.045) return;
    this.lastHover = now;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(1500, now);
    o.frequency.exponentialRampToValueAtTime(2100, now + 0.03);
    const g = ctx.createGain();
    this.env(g, now, 0.035, 0.004, 0.05);
    o.connect(g).connect(this.sfxBus);
    o.start(now);
    o.stop(now + 0.08);
  }

  click() {
    const ctx = this.ctx;
    if (!ctx || !this.soundOn) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.06);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    const g = ctx.createGain();
    this.env(g, t, 0.07, 0.003, 0.09);
    o.connect(lp).connect(g).connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.12);
    this.noiseHit(t, 4200, 0.05, 0.03);
  }

  private noiseHit(t: number, freq: number, peak: number, decay: number) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = freq;
    const g = ctx.createGain();
    this.env(g, t, peak, 0.002, decay);
    s.connect(hp).connect(g).connect(this.sfxBus);
    s.start(t, Math.random());
    s.stop(t + decay + 0.05);
  }

  private sweep(t: number, from: number, to: number, dur: number, peak: number) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(from, t);
    bp.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp).connect(g).connect(this.sfxBus);
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }

  swoosh() {
    const ctx = this.ctx;
    if (!ctx || !this.soundOn) return;
    this.sweep(ctx.currentTime, 380, 3200, 0.24, 0.14);
  }

  back() {
    const ctx = this.ctx;
    if (!ctx || !this.soundOn) return;
    this.sweep(ctx.currentTime, 2600, 300, 0.22, 0.11);
  }

  chime() {
    const ctx = this.ctx;
    if (!ctx || !this.soundOn) return;
    const t = ctx.currentTime;
    [880, 1320, 1760].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      this.env(g, t + i * 0.06, 0.05, 0.005, 0.6);
      o.connect(g);
      g.connect(this.sfxBus);
      g.connect(this.delayIn);
      o.start(t + i * 0.06);
      o.stop(t + i * 0.06 + 0.7);
    });
  }

  deploy() {
    const ctx = this.ctx;
    if (!ctx || !this.soundOn) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.6);
    const g = ctx.createGain();
    this.env(g, t, 0.5, 0.01, 0.8);
    o.connect(g).connect(this.sfxBus);
    o.start(t);
    o.stop(t + 0.9);
    this.sweep(t, 200, 4000, 0.5, 0.16);
    this.chime();
  }

  boot() {
    const ctx = this.ctx;
    if (!ctx || !this.soundOn) return;
    const t = ctx.currentTime;
    this.sweep(t, 120, 2400, 1.1, 0.18);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(55, t + 0.9);
    o.frequency.exponentialRampToValueAtTime(32, t + 2.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.95);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    o.connect(g).connect(this.sfxBus);
    o.start(t + 0.9);
    o.stop(t + 2.7);
    this.noiseHit(t + 0.9, 900, 0.12, 0.5);
  }
}

export const audio = new LobbyAudio();
