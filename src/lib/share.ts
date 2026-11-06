import QRCode from "qrcode";
import { CAMT_TAG, playUrl, shortLinkLabel } from "./config";
import type { Major } from "./majors";

type Persona = Major;
import { SPRITE_H, SPRITE_W, drawCharacter, type Look } from "./sprite";

const W = 1080;
const H = 1920;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  // ภาษาไทยไม่มีเว้นวรรคระหว่างคำ ใช้ Intl.Segmenter ถ้ามี ไม่งั้นตัดทีละตัวอักษร
  const Seg = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  const parts = Seg ? [...new Seg("th", { granularity: "word" }).segment(text)].map((s) => s.segment) : [...text];
  const lines: string[] = [];
  let line = "";
  for (const p of parts) {
    if (ctx.measureText(line + p).width > maxW && line) {
      lines.push(line.trim());
      line = p.trimStart();
    } else line += p;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

/** วาดการ์ดสตอรี่ 1080×1920 */
export async function renderStoryCard(opts: { nickname: string; look: Look; persona: Persona }): Promise<HTMLCanvasElement> {
  const { nickname, look, persona } = opts;
  try {
    await Promise.all([
      document.fonts.load('700 96px "Kanit"'),
      document.fonts.load('400 40px "Kanit"'),
      document.fonts.load('700 96px "Silkscreen"'),
      document.fonts.load('900 96px "Orbitron"'),
      document.fonts.load('700 40px "Orbitron"'),
    ]);
  } catch {
    /* ใช้ฟอนต์สำรอง */
  }

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const INK = "#141a3a";
  const NEON = "#46e6ff";
  const PINK = "#ff4fd8";
  const font = (w: number, size: number, fam = "Kanit") => `${w} ${size}px "${fam}", "Kanit", sans-serif`;
  const rect = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };
  /** แผงกระจก: ขอบนีออนเรืองแสง + ไฮไลต์บน */
  const panel = (x: number, y: number, w: number, h: number, col: string, glow = NEON) => {
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 36;
    rect(x - 6, y - 6, w + 12, h + 12, glow);
    ctx.restore();
    rect(x - 3, y - 3, w + 6, h + 6, INK);
    rect(x, y, w, h, col);
    rect(x, y, w, 6, "#ffffff66");
  };
  const outlinedText = (text: string, x: number, y: number, fillCol: string, stroke = 10, glow?: string) => {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke;
    ctx.strokeStyle = INK;
    ctx.strokeText(text, x, y);
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 24;
    }
    ctx.fillStyle = fillCol;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  // ---- ฟ้ายามพลบ + ดาว ----
  const HORIZON = 1180;
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, "#0e0a35");
  sky.addColorStop(0.45, "#3a2390");
  sky.addColorStop(0.8, "#b04fd8");
  sky.addColorStop(1, "#ff7ab8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON);
  for (let i = 0; i < 90; i++) {
    const x = (i * 337) % W;
    const y = (i * 151) % 640;
    rect(x, y, i % 7 === 0 ? 6 : 4, i % 7 === 0 ? 6 : 4, i % 5 === 0 ? "#9ff8ff" : "#ffffff");
  }

  // ---- พระอาทิตย์ลายแถบ ----
  const sunY = 1000;
  const sun = ctx.createLinearGradient(0, sunY - 260, 0, sunY + 260);
  sun.addColorStop(0, "#ffe36b");
  sun.addColorStop(0.55, "#ff8a5c");
  sun.addColorStop(1, PINK);
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, sunY, 260, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(W / 2 - 260, sunY - 260, 520, 520);
  for (let k = 0; k < 8; k++) {
    const y = sunY + 10 + k * 28;
    ctx.clearRect(0, y, W, 4 + k * 2);
  }
  ctx.restore();
  // เติมฟ้าในช่องแถบที่ลบ
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, HORIZON);
  ctx.restore();

  // ---- เส้นขอบฟ้าเมือง (ตึกสุ่มแบบคงที่ มีหน้าต่างเปิดไฟ) ----
  let bx = 0;
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  while (bx < W) {
    const bw = 60 + Math.floor(rnd() * 70);
    const bh = 120 + Math.floor(rnd() * 260);
    const top = HORIZON - bh;
    rect(bx, top, bw - 6, bh, "#1d1650");
    rect(bx, top, bw - 6, 6, "#3a2a8a");
    if (rnd() > 0.6) rect(bx + bw / 2 - 4, top - 40, 4, 40, "#1d1650");
    for (let wy = top + 20; wy < HORIZON - 16; wy += 22) {
      for (let wx = bx + 10; wx < bx + bw - 18; wx += 16) if (rnd() > 0.55) rect(wx, wy, 8, 10, rnd() > 0.5 ? "#9ff8ff" : "#ff9ce6");
    }
    bx += bw;
  }

  // ---- พื้นกริดนีออนแบบมีมิติ ----
  rect(0, HORIZON, W, H - HORIZON, "#0e1230");
  ctx.save();
  ctx.strokeStyle = NEON;
  ctx.shadowColor = NEON;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 3;
  for (let i = -12; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + i * 40, HORIZON);
    ctx.lineTo(W / 2 + i * 220, H);
    ctx.stroke();
  }
  for (let k = 0; k < 14; k++) {
    const y = HORIZON + Math.pow(k / 13, 2) * (H - HORIZON);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
  rect(0, HORIZON - 3, W, 6, "#9ff8ff");

  // ---- โลโก้งาน CAMT NEXTopia (ตัวอักษรโครเมียม) ----
  const chrome = (text: string, x: number, y: number, size: number, weight = 900) => {
    ctx.font = font(weight, size, "Orbitron");
    const g = ctx.createLinearGradient(0, y - size * 0.85, 0, y + size * 0.05);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.32, "#f3f6fb");
    g.addColorStop(0.47, "#aeb6c7");
    g.addColorStop(0.53, "#5f677d");
    g.addColorStop(0.72, "#d9dfe9");
    g.addColorStop(1, "#ffffff");
    ctx.save();
    ctx.lineJoin = "round";
    ctx.shadowColor = "#000000aa";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.lineWidth = Math.max(4, size * 0.06);
    ctx.strokeStyle = "#1a1f3a";
    ctx.strokeText(text, x, y);
    ctx.restore();
    ctx.fillStyle = g;
    ctx.fillText(text, x, y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#3c4560";
    ctx.strokeText(text, x, y);
  };
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  // วัดความกว้างคำ NEXTopia (NE + X ใหญ่ + T + opia เล็ก) แล้ววางกลาง
  const big = 104;
  const parts: [string, number, number][] = [
    ["NE", big, 900],
    ["X", big * 1.24, 900],
    ["T", big, 900],
    ["opia", big * 0.8, 700],
  ];
  const widths = parts.map(([t, sz, w]) => {
    ctx.font = font(w, sz, "Orbitron");
    return ctx.measureText(t).width;
  });
  const total = widths.reduce((a, b) => a + b, 0);
  let lx = (W - total) / 2;
  const wordY = 236;
  parts.forEach(([t, sz, w], i) => {
    chrome(t, lx, wordY, sz, w);
    lx += widths[i];
  });
  // ประกายดาวเหนือ "a"
  const star = (x: number, y: number, r: number) => {
    ctx.save();
    ctx.shadowColor = "#9ff8ff";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
      const rr = k % 2 ? r * 0.22 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  star(lx + 22, wordY - 96, 26);
  ctx.textAlign = "center";
  chrome("CAMT", W / 2, 118, 66);
  ctx.font = font(700, 32, "Orbitron");
  ctx.fillStyle = "#ffffff";
  ctx.fillText("DESIGN YOUR FUTURE", W / 2, 292);
  // แสงไฟส้มแนวนอน
  const flare = ctx.createLinearGradient(80, 0, W - 80, 0);
  flare.addColorStop(0, "#ff8a2b00");
  flare.addColorStop(0.3, "#ff8a2b");
  flare.addColorStop(0.5, "#fff1d6");
  flare.addColorStop(0.7, "#ff8a2b");
  flare.addColorStop(1, "#ff8a2b00");
  ctx.save();
  ctx.shadowColor = "#ff8a2b";
  ctx.shadowBlur = 26;
  ctx.fillStyle = flare;
  ctx.fillRect(80, 312, W - 160, 4);
  ctx.restore();

  // ---- ชื่อเกม + ผลลัพธ์ ----
  ctx.font = font(700, 34, "Silkscreen");
  const gameW = ctx.measureText("CAMT NEXTOPIA").width + 50;
  panel((W - gameW) / 2, 340, gameW, 56, "#1b1f52");
  outlinedText("CAMT NEXTOPIA", W / 2, 380, "#ffffff", 6, NEON);
  ctx.font = font(500, 40);
  outlinedText(`${nickname} คือ...`, W / 2, 462, "#ffffff", 10);
  let size = 96;
  ctx.font = font(700, size, "Silkscreen");
  while (ctx.measureText(persona.persona.toUpperCase()).width > W - 160 && size > 48) {
    size -= 4;
    ctx.font = font(700, size, "Silkscreen");
  }
  const nameW = Math.min(W - 80, ctx.measureText(persona.persona.toUpperCase()).width + 80);
  panel((W - nameW) / 2, 488, nameW, 124, persona.color, PINK);
  outlinedText(persona.persona.toUpperCase(), W / 2, 550 + size * 0.35, "#ffffff", 14);
  ctx.font = font(700, 44);
  wrap(ctx, `สาขาวิชา${persona.nameTH}`, 940).forEach((l, i) => outlinedText(l, W / 2, 680 + i * 52, "#ffffff", 10));

  // ---- ตัวละครยืนบนแท่นเรืองแสง ----
  // ตัวเล็กลงเล็กน้อย เผื่อชื่ออาชีพยาว 2 บรรทัด
  const scale = 16;
  const cw = SPRITE_W * scale;
  const ch = SPRITE_H * scale;
  ctx.save();
  ctx.shadowColor = NEON;
  ctx.shadowBlur = 40;
  ctx.strokeStyle = NEON;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.ellipse(W / 2, 1262, 230, 40, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#46e6ff33";
  ctx.beginPath();
  ctx.ellipse(W / 2, 1262, 220, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  drawCharacter(ctx, look, persona.id, 0, scale, (W - cw) / 2, 1290 - ch, { sticker: true });

  // ---- จุดเด่น 3 ข้อ ----
  const boxY = 1336;
  panel(90, boxY, W - 180, 280, "#f4f8ff");
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.font = font(700, 40);
  ctx.fillText(`จุดเด่นของ ${persona.persona}`, 140, boxY + 66);
  ctx.font = font(400, 42);
  persona.highlights.forEach((h, i) => {
    const y = boxY + 136 + i * 60;
    rect(140, y - 32, 30, 30, INK);
    rect(144, y - 28, 22, 22, persona.color);
    ctx.fillStyle = INK;
    ctx.fillText(h, 192, y);
  });

  // ---- QR + ข้อความชวนเล่น ----
  const qrSize = 200;
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, playUrl(), { width: qrSize, margin: 1, color: { dark: INK, light: "#ffffff" } });
  const qy = 1680;
  panel(90, qy, W - 180, qrSize, "#f4f8ff", PINK);
  ctx.drawImage(qr, 90, qy, qrSize, qrSize);
  rect(90 + qrSize, qy, 6, qrSize, INK);
  ctx.fillStyle = INK;
  ctx.font = font(700, 42);
  ctx.fillText("คุณเหมาะกับอาชีพไหน?", 330, qy + 62);
  ctx.font = font(500, 32);
  ctx.fillStyle = "#7c4dff";
  ctx.fillText(`สแกนเล่นที่ ${shortLinkLabel()}`, 330, qy + 118);
  ctx.fillStyle = "#4b5578";
  ctx.font = font(400, 28);
  ctx.fillText(`${CAMT_TAG} · CAMT Open House 2026`, 330, qy + 168);

  return c;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export type ShareOutcome = "shared" | "cancelled" | "fallback";

export interface PreparedCard {
  file: File;
  url: string;
}

/** เตรียมไฟล์ไว้ก่อน เพื่อให้ตอนกดแชร์เรียก navigator.share ได้ทันที (iOS ต้องเรียกภายใน user gesture) */
export async function prepareCard(canvas: HTMLCanvasElement, persona: Persona): Promise<PreparedCard> {
  const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/png"));
  return {
    file: new File([blob], `camt-nextopia-${persona.slug}.png`, { type: "image/png" }),
    url: URL.createObjectURL(blob),
  };
}

/** แชร์ผ่าน Web Share API (ไป IG Story ได้ตรง) ถ้าไม่รองรับ ผู้เรียกจะแสดงรูปให้บันทึกแทน */
export async function shareCard(card: PreparedCard, persona: Persona): Promise<ShareOutcome> {
  const data: ShareData = {
    files: [card.file],
    title: "CAMT Nextopia",
    text: `ฉันคือ ${persona.persona} เหมาะกับสาขาวิชา${persona.nameTH} ที่ CAMT มช.! ${CAMT_TAG}`,
  };
  if (typeof navigator !== "undefined" && navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return "cancelled";
    }
  }
  return "fallback";
}

export function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
