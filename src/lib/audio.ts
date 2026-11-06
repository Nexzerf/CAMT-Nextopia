/**
 * เสียงทั้งหมดของ MMIT World สังเคราะห์ด้วย Web Audio (ไม่มีไฟล์เสียง ไม่มีปัญหาลิขสิทธิ์)
 * - เอฟเฟกต์สั้น ๆ แบบ chiptune สำหรับปุ่ม/แบบทดสอบ/ผลลัพธ์/คนเข้าเมือง/พลุ
 * - เพลงประกอบ synthwave วนลูปสำหรับจอใหญ่ (กลางคืนเสียงนุ่มลง)
 * เบราว์เซอร์จะเล่นเสียงได้หลังผู้ใช้แตะ/คลิกครั้งแรก จึงต้องเรียก unlock() ใน event ของผู้ใช้
 */

type Wave = OscillatorType;

const MUTE_KEY = "mmit.sound.muted";

let ctx: AudioContext | null = null;
let master: GainNode;
let sfxBus: GainNode;
let musicBus: GainNode;
let musicFilter: BiquadFilterNode;
let drumBus: GainNode;
let arpDelay: DelayNode;
let noiseBuf: AudioBuffer | null = null;
let muted = readMuted();
const listeners = new Set<(m: boolean) => void>();

function readMuted(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function gainNode(c: AudioContext, v: number, to: AudioNode): GainNode {
  const g = c.createGain();
  g.gain.value = v;
  g.connect(to);
  return g;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.connect(ctx.destination);
    master = gainNode(ctx, muted ? 0 : 0.9, comp);
    // ตัววัดระดับเสียงที่ออกจริง (ใช้ตรวจว่ามีเสียงออกไหม: window.__mmitAudio())
    const meter = ctx.createAnalyser();
    meter.fftSize = 1024;
    comp.connect(meter);
    const buf = new Float32Array(meter.fftSize);
    (window as unknown as { __mmitAudio?: () => { state: string; level: number; muted: boolean } }).__mmitAudio = () => {
      meter.getFloatTimeDomainData(buf);
      let peak = 0;
      for (const v of buf) peak = Math.max(peak, Math.abs(v));
      return { state: ctx!.state, level: Math.round(peak * 1000) / 1000, muted };
    };
    sfxBus = gainNode(ctx, 0.7, master);
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.frequency.value = 9000;
    musicFilter.connect(master);
    musicBus = gainNode(ctx, 0.42, musicFilter);
    drumBus = gainNode(ctx, 1, musicBus);
    // ดีเลย์ให้เสียงอาร์เปจจิโอกังวานแบบ synthwave
    arpDelay = ctx.createDelay(1);
    arpDelay.delayTime.value = 0.45;
    const fb = gainNode(ctx, 0.32, arpDelay);
    arpDelay.connect(fb);
    arpDelay.connect(musicBus);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

let keepAlive: HTMLAudioElement | null = null;

/** ไฟล์ WAV เงียบ 0.5 วิ (สร้างในเครื่อง ไม่ต้องโหลด) */
function silentWavUrl(): string {
  const rate = 8000;
  const n = rate / 2;
  const b = new DataView(new ArrayBuffer(44 + n));
  const str = (o: number, t: string) => [...t].forEach((ch, i) => b.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF");
  b.setUint32(4, 36 + n, true);
  str(8, "WAVEfmt ");
  b.setUint32(16, 16, true);
  b.setUint16(20, 1, true);
  b.setUint16(22, 1, true);
  b.setUint32(24, rate, true);
  b.setUint32(28, rate, true);
  b.setUint16(32, 1, true);
  b.setUint16(34, 8, true);
  str(36, "data");
  b.setUint32(40, n, true);
  for (let i = 0; i < n; i++) b.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([b.buffer], { type: "audio/wav" }));
}

/**
 * เรียกใน event คลิก/แตะ เพื่อปลดล็อกเสียงของเบราว์เซอร์ (iOS ต้องเล่นเสียงจริงสักนิดใน event นั้น)
 * iPhone ที่เปิดสวิตช์เงียบจะปิดเสียง Web Audio ด้วย → ตั้งเป็นเสียงแบบ "เล่นสื่อ" และเปิดไฟล์เงียบวนไว้
 * เสียงจึงออกลำโพงเหมือนเปิดวิดีโอ
 */
export function unlock() {
  const c = ac();
  if (!c) return;
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (session) {
    try {
      session.type = "playback";
    } catch {
      /* ignore */
    }
  }
  if (!keepAlive) {
    keepAlive = new Audio(silentWavUrl());
    keepAlive.loop = true;
    keepAlive.setAttribute("playsinline", "");
  }
  if (keepAlive.paused && !document.hidden) void keepAlive.play().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, c.sampleRate);
  src.connect(c.destination);
  src.start(0);
}

/** เสียงพร้อมเล่นจริงหรือยัง (ยังไม่ปลดล็อก / ถูกพักโดยเบราว์เซอร์ = false) */
export function audioRunning(): boolean {
  return ctx?.state === "running";
}

/** หน้าเว็บถูกซ่อน (สลับแอป/ล็อกจอ) → พักเสียง กลับมาแล้วเล่นต่อ */
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) {
      void ctx.suspend();
      keepAlive?.pause();
    } else {
      void ctx.resume();
      if (keepAlive) void keepAlive.play().catch(() => {});
    }
  });
}

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
  listeners.forEach((f) => f(m));
}

export function onMuteChange(f: (m: boolean) => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

interface ToneOpts {
  type?: Wave;
  vol?: number;
  attack?: number;
  release?: number;
  slideTo?: number;
  bus?: AudioNode;
  cutoff?: number;
  detune?: number;
}

function tone(freq: number, start: number, dur: number, o: ToneOpts = {}) {
  const c = ctx!;
  const osc = c.createOscillator();
  osc.type = o.type ?? "square";
  osc.frequency.setValueAtTime(freq, start);
  if (o.detune) osc.detune.value = o.detune;
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, start + dur);
  const g = c.createGain();
  const vol = o.vol ?? 0.15;
  const atk = o.attack ?? 0.004;
  const rel = o.release ?? 0.08;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(vol, start + atk);
  g.gain.setValueAtTime(vol, start + Math.max(atk, dur));
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur + rel);
  let node: AudioNode = osc;
  if (o.cutoff) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.cutoff;
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(o.bus ?? sfxBus);
  osc.start(start);
  osc.stop(start + dur + rel + 0.05);
}

function noise(start: number, dur: number, o: { vol?: number; type?: BiquadFilterType; freq?: number; q?: number; bus?: AudioNode; sweepTo?: number }) {
  const c = ctx!;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = o.type ?? "highpass";
  f.frequency.setValueAtTime(o.freq ?? 6000, start);
  if (o.sweepTo) f.frequency.exponentialRampToValueAtTime(o.sweepTo, start + dur);
  f.Q.value = o.q ?? 0.8;
  const g = c.createGain();
  g.gain.setValueAtTime(o.vol ?? 0.2, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f);
  f.connect(g);
  g.connect(o.bus ?? sfxBus);
  src.start(start, Math.random() * 0.5);
  src.stop(start + dur + 0.05);
}

/** เรียกเอฟเฟกต์เฉพาะเมื่อเสียงพร้อม (ไม่เปิดเสียงเองถ้ายังไม่ได้ปลดล็อก) */
function play(fn: (t: number) => void) {
  const c = ac();
  if (!c || muted) return;
  fn(c.currentTime + 0.01);
}

// ---------------------------------------------------------------- เอฟเฟกต์
export const sfx = {
  /** แตะปุ่มทั่วไป */
  tap: () => play((t) => tone(1320, t, 0.025, { vol: 0.07, release: 0.04 })),
  /** เลือกตัวเลือก/คำตอบ */
  select: () =>
    play((t) => {
      tone(hz(76), t, 0.05, { type: "triangle", vol: 0.16 });
      tone(hz(83), t + 0.06, 0.08, { type: "triangle", vol: 0.16, release: 0.12 });
    }),
  /** ไปข้อถัดไป: เสียงสูงขึ้นตามความคืบหน้า */
  step: (i: number) =>
    play((t) => {
      const base = 64 + Math.round(i * 0.8);
      tone(hz(base), t, 0.04, { vol: 0.09 });
      tone(hz(base + 7), t + 0.05, 0.05, { vol: 0.09 });
    }),
  back: () =>
    play((t) => {
      tone(hz(72), t, 0.04, { vol: 0.08 });
      tone(hz(67), t + 0.05, 0.06, { vol: 0.08 });
    }),
  /** กำลังประมวลผลคำตอบ */
  loading: () =>
    play((t) => {
      for (let k = 0; k < 10; k++) tone(hz(60 + ((k * 5) % 24)), t + k * 0.12, 0.05, { vol: 0.06, type: "square" });
      tone(220, t, 1.3, { type: "sawtooth", vol: 0.05, slideTo: 880, cutoff: 1800, release: 0.2 });
    }),
  /** เฉลยอาชีพ: แฟนแฟร์สั้น */
  reveal: () =>
    play((t) => {
      const run = [60, 64, 67, 72, 76, 79];
      run.forEach((m, i) => tone(hz(m), t + i * 0.07, 0.08, { vol: 0.12 }));
      const end = t + run.length * 0.07;
      for (const m of [72, 76, 79, 84]) tone(hz(m), end, 0.7, { type: "square", vol: 0.07, release: 0.4, cutoff: 3500 });
      tone(hz(48), end, 0.7, { type: "triangle", vol: 0.2, release: 0.4 });
      for (let k = 0; k < 6; k++) tone(hz(96 + (k % 3) * 2), end + 0.1 + k * 0.08, 0.03, { type: "sine", vol: 0.05 });
    }),
  /** คนเข้าเมือง 1 คน: ระฆังสั้น */
  chime: () =>
    play((t) => {
      for (const [m, d] of [
        [88, 0],
        [95, 0.09],
      ] as const) {
        tone(hz(m), t + d, 0.02, { type: "sine", vol: 0.2, release: 0.9 });
        tone(hz(m + 12), t + d, 0.02, { type: "sine", vol: 0.05, release: 0.5 });
      }
    }),
  /** คนเข้าเมืองเป็นกลุ่ม */
  batch: () =>
    play((t) => {
      [84, 88, 91, 96].forEach((m, i) => tone(hz(m), t + i * 0.08, 0.02, { type: "sine", vol: 0.16, release: 0.7 }));
    }),
  /** พลุ 1 ลูก: เสียงหวีดขึ้น + ตูม + ประกาย */
  firework: () =>
    play((t) => {
      tone(500, t, 0.5, { type: "sine", vol: 0.05, slideTo: 1800, release: 0.02 });
      noise(t + 0.52, 0.7, { vol: 0.32, type: "lowpass", freq: 900, sweepTo: 120 });
      tone(90, t + 0.52, 0.25, { type: "sine", vol: 0.3, slideTo: 40, release: 0.2 });
      for (let k = 0; k < 7; k++) noise(t + 0.7 + k * 0.07 + Math.random() * 0.04, 0.06, { vol: 0.08, freq: 7000 });
    }),
  /** ประชากรครบทุก 50 คน */
  milestone: () =>
    play((t) => {
      const mel = [67, 72, 76, 79, 76, 79, 84];
      const dur = [0.12, 0.12, 0.12, 0.3, 0.12, 0.12, 0.8];
      let at = t;
      mel.forEach((m, i) => {
        tone(hz(m), at, dur[i], { type: "sawtooth", vol: 0.1, cutoff: 2600, release: 0.15 });
        tone(hz(m - 12), at, dur[i], { type: "square", vol: 0.05, cutoff: 1800 });
        at += dur[i] + 0.02;
      });
      tone(hz(48), t + 1.2, 0.8, { type: "triangle", vol: 0.25, release: 0.5 });
    }),
  /** รถไฟ maglev วิ่งผ่าน */
  train: () =>
    play((t) => {
      noise(t, 2.2, { vol: 0.07, type: "bandpass", freq: 300, sweepTo: 2200, q: 1.5 });
      tone(110, t, 1.8, { type: "sawtooth", vol: 0.02, slideTo: 150, cutoff: 600, attack: 0.6, release: 0.5 });
    }),
  share: () =>
    play((t) => {
      [79, 84, 88, 91].forEach((m, i) => tone(hz(m), t + i * 0.05, 0.03, { type: "triangle", vol: 0.1, release: 0.25 }));
    }),
};

// ---------------------------------------------------------------- เพลงประกอบ (จอใหญ่)
const STEP = 60 / 100 / 4; // 16th note ที่ 100 BPM
/** คอร์ด Am–F–C–G (ราก, เสียงคอร์ด) */
const CHORDS: [number, number[]][] = [
  [45, [57, 60, 64]],
  [41, [53, 57, 60]],
  [48, [55, 60, 64]],
  [43, [55, 59, 62]],
];
/** ทำนองหลัก โน้ตเขบ็ต 1 ชั้น 8 ตัวต่อห้อง (null = พัก) */
const MELODY: (number | null)[][] = [
  [76, null, 81, null, 79, 76, null, 74],
  [72, null, null, 69, 72, 74, null, 76],
  [79, null, 76, null, 72, null, 74, 76],
  [74, null, 71, null, 67, null, null, null],
];

let timer: ReturnType<typeof setInterval> | null = null;
let nextTime = 0;
let stepNo = 0;

function scheduleStep(n: number, t: number) {
  const bar = Math.floor(n / 16) % 4;
  const s = n % 16;
  const cycle = Math.floor(n / 64);
  const [root, chord] = CHORDS[bar];
  // กลอง
  if (s === 0 || s === 8 || s === 10) tone(150, t, 0.12, { type: "sine", vol: 0.5, slideTo: 42, release: 0.05, bus: drumBus });
  if (s === 4 || s === 12) noise(t, 0.18, { vol: 0.22, type: "bandpass", freq: 1800, q: 0.7, bus: drumBus });
  if (s % 2 === 0) noise(t, s % 4 === 2 ? 0.09 : 0.03, { vol: s % 4 === 2 ? 0.07 : 0.04, freq: 8000, bus: drumBus });
  // เบส (เขบ็ต 1 ชั้น สลับอ็อกเทฟ)
  if (s % 2 === 0) tone(hz(root + (s % 4 === 2 ? 12 : 0)), t, STEP * 1.6, { type: "sawtooth", vol: 0.13, cutoff: 520, release: 0.04, bus: musicBus });
  // แพดคอร์ดยาวทั้งห้อง
  if (s === 0)
    for (const m of chord)
      for (const det of [-9, 9]) tone(hz(m), t, STEP * 15, { type: "sawtooth", vol: 0.022, cutoff: 1300, attack: 0.35, release: 0.6, detune: det, bus: musicBus });
  // อาร์เปจจิโอ
  const arpNotes = [...chord, chord[0] + 12, chord[1] + 12, chord[2] + 12];
  const order = [0, 1, 2, 3, 4, 5, 4, 3];
  tone(hz(arpNotes[order[s % 8]] + 12), t, STEP * 0.6, { type: "triangle", vol: 0.045, release: 0.06, bus: arpDelay });
  tone(hz(arpNotes[order[s % 8]] + 12), t, STEP * 0.6, { type: "triangle", vol: 0.045, release: 0.06, bus: musicBus });
  // ทำนองเล่นรอบเว้นรอบ
  if (cycle % 2 === 1 && s % 2 === 0) {
    const m = MELODY[bar][s / 2];
    if (m) tone(hz(m), t, STEP * 1.7, { type: "square", vol: 0.05, cutoff: 3000, release: 0.12, bus: musicBus });
  }
}

/** soft = เวอร์ชันเบาสำหรับมือถือ (กลองเบา เพลงเบากว่าเสียงเอฟเฟกต์) */
export function startMusic(opts: { soft?: boolean } = {}) {
  const c = ac();
  if (!c || timer) return;
  musicBus.gain.value = opts.soft ? 0.34 : 0.42;
  drumBus.gain.value = opts.soft ? 0.35 : 1;
  nextTime = c.currentTime + 0.1;
  stepNo = 0;
  timer = setInterval(() => {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.15) {
      scheduleStep(stepNo, nextTime);
      nextTime += STEP;
      stepNo++;
    }
  }, 30);
}

export function stopMusic() {
  if (timer) clearInterval(timer);
  timer = null;
}

/** 0 = กลางวัน, 1 = กลางคืน: กลางคืนเสียงทุ้มนุ่ม กลองเบาลง */
export function setNight(n: number) {
  if (!ctx) return;
  const k = Math.max(0, Math.min(1, n));
  musicFilter.frequency.setTargetAtTime(9000 - 7200 * k, ctx.currentTime, 1.5);
  drumBus.gain.setTargetAtTime(1 - 0.7 * k, ctx.currentTime, 1.5);
}
