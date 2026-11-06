/* ==========================================================
   CAMT NEXTOPIA — ตัวละครพิกเซล
   กริด 16×22 พิกเซล, ประกอบจากชิ้นส่วน แล้วตีเส้นขอบอัตโนมัติ
   cache เป็น canvas ต่อ (หน้าตา + เฟรม) เพื่อวาดคนเป็นร้อยได้ลื่น
   ========================================================== */
const Avatar = (function () {
  const W = 16, H = 22;

  const SKIN = ["#F6D5B8", "#E8B48F", "#C98D63", "#9A6440", "#6B4129"];
  const HAIR = ["#1D1A1A", "#4A2E1F", "#7A4A2A", "#E2B54A", "#E2622A", "#E87AA8", "#3D6FD8", "#4FB89A", "#8A5AD0", "#E9E6DF"];
  const HAIR_NAMES = ["สั้น", "ตั้งชี้", "บ๊อบ", "ยาว", "หางม้า", "จุก", "หยิก", "เกรียน"];
  const TOP_NAMES = ["ฮู้ด", "แจ็กเก็ต", "เสื้อยืด", "เสื้อกาวน์"];
  const ACC_NAMES = ["ไม่มี", "แว่น", "ไวเซอร์", "หูฟัง", "หมวกแก๊ป", "แว่น VR"];
  const INK = "#161616";
  const PANTS = "#2B2B33";
  const NEUTRAL_TOP = "#3A3A44";

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("");
  }

  /* ---------- ชิ้นส่วน ---------- */
  function px(g, x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  }

  function drawHairBack(g, style, c) {
    // ผมด้านหลังศีรษะ (วาดก่อนหน้า)
    if (style === 2) px(g, 3, 4, 10, 6, c); // bob
    if (style === 3) px(g, 3, 4, 10, 10, c); // long
    if (style === 4) { px(g, 11, 5, 2, 2, c); px(g, 12, 6, 2, 6, c); } // ponytail
  }

  function drawHairFront(g, style, c) {
    const d = shade(c, 0.78);
    switch (style) {
      case 0: // short
        px(g, 4, 2, 8, 3, c); px(g, 4, 5, 1, 2, c); px(g, 11, 5, 1, 2, c); px(g, 5, 4, 3, 1, d);
        break;
      case 1: // spiky
        px(g, 4, 3, 8, 2, c); px(g, 4, 1, 2, 2, c); px(g, 7, 0, 2, 3, c); px(g, 10, 1, 2, 2, c);
        px(g, 4, 5, 1, 2, c); px(g, 11, 5, 1, 1, c); px(g, 7, 4, 2, 1, d);
        break;
      case 2: // bob
        px(g, 4, 2, 8, 3, c); px(g, 3, 4, 2, 6, c); px(g, 11, 4, 2, 6, c); px(g, 5, 4, 6, 1, d);
        break;
      case 3: // long
        px(g, 4, 2, 8, 3, c); px(g, 3, 4, 2, 10, c); px(g, 11, 4, 2, 10, c); px(g, 8, 4, 3, 1, d);
        break;
      case 4: // ponytail
        px(g, 4, 2, 8, 3, c); px(g, 4, 5, 1, 1, c); px(g, 11, 5, 1, 1, c); px(g, 5, 4, 4, 1, d);
        break;
      case 5: // bun
        px(g, 6, 0, 4, 2, c); px(g, 4, 2, 8, 3, c); px(g, 4, 5, 1, 1, c); px(g, 11, 5, 1, 1, c); px(g, 7, 1, 2, 1, d);
        break;
      case 6: // curly
        px(g, 3, 1, 10, 4, c); px(g, 2, 3, 2, 5, c); px(g, 12, 3, 2, 5, c);
        px(g, 4, 1, 1, 1, d); px(g, 7, 1, 1, 1, d); px(g, 10, 1, 1, 1, d); px(g, 5, 3, 1, 1, d); px(g, 9, 3, 1, 1, d);
        break;
      case 7: // buzz
        px(g, 4, 3, 8, 1, c); px(g, 5, 2, 6, 1, c); px(g, 4, 4, 1, 1, c); px(g, 11, 4, 1, 1, c);
        break;
    }
  }

  function drawTop(g, style, c, skin, frame) {
    const d = shade(c, 0.75);
    const swing = frame === 1 ? 1 : 0;
    // ลำตัว
    px(g, 4, 11, 8, 6, c);
    // แขน
    px(g, 3, 11 + swing, 1, 4, c); px(g, 12, 12 - swing, 1, 4, c);
    px(g, 3, 15 + swing, 1, 1, skin); px(g, 12, 16 - swing, 1, 1, skin);
    switch (style) {
      case 0: // hoodie: ฮู้ดหลังคอ + กระเป๋าหน้า
        px(g, 5, 11, 6, 1, d); px(g, 6, 14, 4, 2, d); px(g, 7, 12, 1, 2, "#F4F1EC"); px(g, 9, 12, 1, 2, "#F4F1EC");
        break;
      case 1: // jacket: เสื้อในสีขาว
        px(g, 7, 11, 2, 6, "#F4F1EC"); px(g, 6, 11, 1, 3, d); px(g, 9, 11, 1, 3, d);
        break;
      case 2: // tee: ลายแถบกลางอก
        px(g, 5, 13, 6, 1, d);
        px(g, 3, 13 + swing, 1, 2, skin); px(g, 12, 14 - swing, 1, 2, skin);
        break;
      case 3: // lab coat: เสื้อคลุมขาว ทับเสื้อสี
        px(g, 4, 11, 8, 7, "#ECE9E2"); px(g, 7, 11, 2, 4, c); px(g, 3, 11 + swing, 1, 4, "#ECE9E2"); px(g, 12, 12 - swing, 1, 4, "#ECE9E2");
        px(g, 10, 13, 1, 1, c);
        break;
    }
  }

  function drawLegs(g, frame) {
    if (frame === 0) {
      px(g, 5, 17, 2, 4, PANTS); px(g, 9, 17, 2, 4, PANTS);
      px(g, 5, 21, 2, 1, INK); px(g, 9, 21, 2, 1, INK);
    } else if (frame === 1) {
      px(g, 4, 17, 2, 4, PANTS); px(g, 10, 17, 2, 3, PANTS);
      px(g, 4, 21, 2, 1, INK); px(g, 10, 20, 2, 1, INK);
    } else {
      px(g, 6, 17, 2, 3, PANTS); px(g, 8, 17, 2, 4, PANTS);
      px(g, 6, 20, 2, 1, INK); px(g, 8, 21, 2, 1, INK);
    }
  }

  function drawFace(g, skin, acc) {
    px(g, 4, 3, 8, 8, skin);
    px(g, 3, 6, 1, 2, skin); px(g, 12, 6, 1, 2, skin); // หู
    // ตา
    if (acc !== 2 && acc !== 5) { px(g, 6, 7, 1, 2, INK); px(g, 9, 7, 1, 2, INK); }
    px(g, 7, 9, 2, 1, shade(skin, 0.72)); // ปาก
  }

  function drawAcc(g, acc, accent) {
    switch (acc) {
      case 1: // glasses
        px(g, 5, 6, 3, 1, INK); px(g, 8, 6, 3, 1, INK); px(g, 5, 7, 1, 2, INK); px(g, 7, 7, 1, 2, INK);
        px(g, 8, 7, 1, 2, INK); px(g, 10, 7, 1, 2, INK);
        break;
      case 2: // visor
        px(g, 4, 6, 8, 2, "#F15A24"); px(g, 5, 6, 2, 1, "#FFB08F");
        break;
      case 3: // headphones
        px(g, 4, 1, 8, 1, INK); px(g, 3, 2, 1, 4, INK); px(g, 12, 2, 1, 4, INK);
        px(g, 2, 5, 2, 3, accent); px(g, 12, 5, 2, 3, accent);
        break;
      case 4: // cap
        px(g, 4, 1, 8, 3, accent); px(g, 10, 3, 4, 1, shade(accent, 0.7)); px(g, 7, 1, 2, 1, shade(accent, 1.25));
        break;
      case 5: // VR
        px(g, 4, 6, 8, 3, INK); px(g, 5, 7, 6, 1, "#4FB89A"); px(g, 3, 6, 1, 2, INK); px(g, 12, 6, 1, 2, INK);
        break;
    }
  }

  /* ---------- ประกอบ + ตีเส้นขอบ ---------- */
  const cache = new Map();

  function sprite(look, frame = 0, topColor) {
    const color = topColor || NEUTRAL_TOP;
    const key = [look.hair, look.hair_color, look.skin, look.acc, look.top, frame, color].join(",");
    let c = cache.get(key);
    if (c) return c;

    const base = document.createElement("canvas");
    base.width = W; base.height = H;
    const g = base.getContext("2d");
    const skin = SKIN[look.skin] || SKIN[0];
    const hair = HAIR[look.hair_color] || HAIR[0];

    drawHairBack(g, look.hair, hair);
    drawLegs(g, frame);
    drawTop(g, look.top, color, skin, frame);
    drawFace(g, skin, look.acc);
    drawHairFront(g, look.hair, hair);
    drawAcc(g, look.acc, color === NEUTRAL_TOP ? "#F15A24" : color);

    // เส้นขอบรอบตัว (ขยาย canvas ออก 1px ทุกด้าน)
    c = document.createElement("canvas");
    c.width = W + 2; c.height = H + 2;
    const o = c.getContext("2d");
    const src = g.getImageData(0, 0, W, H).data;
    const filled = (x, y) => x >= 0 && y >= 0 && x < W && y < H && src[(y * W + x) * 4 + 3] > 0;
    o.fillStyle = INK;
    for (let y = -1; y <= H; y++) {
      for (let x = -1; x <= W; x++) {
        if (filled(x, y)) continue;
        if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) o.fillRect(x + 1, y + 1, 1, 1);
      }
    }
    o.drawImage(base, 1, 1);
    cache.set(key, c);
    if (cache.size > 2000) cache.delete(cache.keys().next().value);
    return c;
  }

  /* วาดตัวละครลง canvas ปลายทางแบบคมชัด (scale เป็นจำนวนเต็ม) */
  function paint(canvas, look, opts = {}) {
    const scale = opts.scale || Math.max(1, Math.floor(Math.min(canvas.width / (W + 2), canvas.height / (H + 2))));
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    if (!opts.keep) ctx.clearRect(0, 0, canvas.width, canvas.height);
    const s = sprite(look, opts.frame || 0, opts.color);
    const w = (W + 2) * scale, h = (H + 2) * scale;
    const x = opts.x != null ? opts.x : Math.floor((canvas.width - w) / 2);
    const y = opts.y != null ? opts.y : Math.floor((canvas.height - h) / 2);
    ctx.drawImage(s, x, y, w, h);
  }

  function randomLook() {
    const r = (n) => Math.floor(Math.random() * n);
    return { hair: r(8), hair_color: r(10), skin: r(5), acc: r(6), top: r(4) };
  }

  return { W: W + 2, H: H + 2, SKIN, HAIR, HAIR_NAMES, TOP_NAMES, ACC_NAMES, sprite, paint, randomLook, shade };
})();
