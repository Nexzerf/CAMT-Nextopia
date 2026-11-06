/* ==========================================================
   CAMT NEXTOPIA — เมืองพิกเซล
   5 เขต = 5 สาขา, พลเมืองทุกคนเดินอยู่ในเขตของตัวเอง
   โหมด ambient: เลื่อนช้า ๆ เป็นฉากหลัง
   โหมด explore: ลากเพื่อดูเมือง แตะตัวละครเพื่อดูชื่อ
   ========================================================== */
const City = (function () {
  const canvas = document.getElementById("city");
  const ctx = canvas.getContext("2d");

  const PAPER = "#F4F1EC", INK = "#161616", ORANGE = "#F15A24";
  const FAR = "#E4DDD1", MID = "#CEC5B6", NEAR = "#2A2622", NEAR2 = "#3A3530";
  const DW = 260; // ความกว้างต่อเขต
  const ORDER = ["SE", "MMIT", "ANI", "DG", "DII"];
  const WW = DW * ORDER.length;

  let dpr = 1, scale = 3, VW = 0, VH = 0, GY = 0;
  let camX = 0, camTarget = null, mode = "ambient";
  let t = 0, last = performance.now(), running = true;
  let residents = [];
  let me = null; // {id,nickname,major,look}
  let tagUntil = new Map();
  let onSelect = null;
  let farLine = [], midLine = [], clouds = [], pods = [];
  let seed = 7;

  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function wrap(x) { return ((x % WW) + WW) % WW; }

  /* ---------- สร้างฉาก ---------- */
  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.floor(window.innerWidth * dpr), ch = Math.floor(window.innerHeight * dpr);
    canvas.width = cw; canvas.height = ch;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    layout();

    seed = 7;
    farLine = []; midLine = [];
    for (let x = 0; x < WW; ) { const w = 14 + rnd() * 22; farLine.push({ x, w, h: 40 + rnd() * 70 }); x += w + 2; }
    for (let x = 0; x < WW; ) { const w = 16 + rnd() * 26; midLine.push({ x, w, h: 24 + rnd() * 60, win: rnd() < 0.6 }); x += w + 4 + rnd() * 10; }
    clouds = Array.from({ length: 6 }, () => ({ x: rnd() * WW, y: 12 + rnd() * 40, w: 18 + rnd() * 26 }));
    pods = Array.from({ length: 7 }, () => ({ x: rnd() * WW, y: 30 + rnd() * 50, v: (8 + rnd() * 18) * (rnd() < 0.5 ? -1 : 1) }));
  }

  /* ตำแหน่งพื้นดิน: ให้เมืองอยู่เหนือแผงเมนู/ปุ่มเสมอ */
  function layout() {
    const cw = canvas.width, ch = canvas.height;
    const portrait = window.innerHeight > window.innerWidth;
    // ฉากหลัง: ซูมออกให้เห็นหลายตึก / โหมดเดินเมือง: ซูมเข้าให้เห็นตัวละครชัด
    const minW = mode === "explore" ? 210 : 280;
    scale = Math.max(2, Math.min(Math.floor(cw / minW), Math.floor(ch / (mode === "explore" ? 200 : 260))));
    VW = Math.ceil(cw / scale); VH = Math.ceil(ch / scale);
    const fromBottomCss = mode === "explore" ? 250 : portrait ? window.innerHeight * 0.5 : 70;
    GY = Math.max(150, Math.round(VH - (fromBottomCss * dpr) / scale));
  }
  function uiPx(css) { return Math.max(6, Math.round((css * dpr) / scale)); }

  /* ---------- ตึกประจำเขต ---------- */
  function sign(cx, y, text, color, ink) {
    ctx.font = "8px Silkscreen, monospace";
    const w = Math.ceil(ctx.measureText(text).width) + 8;
    R(cx - w / 2, y, w, 11, color);
    R(cx - w / 2, y + 11, w, 1, INK);
    ctx.fillStyle = ink;
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.fillText(text, Math.round(cx), y + 2);
  }

  function windows(x, y, w, h, color, step = 4, on = 0.55, salt = 1) {
    for (let yy = y + 3; yy < y + h - 3; yy += step) {
      for (let xx = x + 3; xx < x + w - 3; xx += 4) {
        const v = Math.sin(xx * 12.9898 + yy * 78.233 + salt) * 43758.5453;
        if (v - Math.floor(v) < on) R(xx, yy, 2, 2, color);
      }
    }
  }

  function towers(ox) {
    const g = GY;
    const blink = Math.floor(t * 2) % 2 === 0;
    ORDER.forEach((code, i) => {
      const m = MAJORS[code];
      const cx = ox + i * DW + DW / 2;
      if (cx < -120 || cx > VW + 120) return;
      // ตึกเล็กข้าง ๆ
      R(cx - 100, g - 46, 30, 46, NEAR2); windows(cx - 100, g - 46, 30, 46, "#5A534B", 5, 0.5, i);
      R(cx + 70, g - 34, 34, 34, NEAR2); windows(cx + 70, g - 34, 34, 34, "#5A534B", 5, 0.5, i + 9);

      switch (code) {
        case "SE": { // CODE SPIRE
          R(cx - 14, g - 120, 28, 120, NEAR);
          R(cx - 10, g - 140, 20, 20, NEAR);
          R(cx - 5, g - 158, 10, 18, NEAR);
          R(cx - 1, g - 172, 2, 14, NEAR);
          if (blink) R(cx - 2, g - 175, 4, 3, ORANGE);
          for (let y = g - 116; y < g - 4; y += 6) { R(cx - 10, y, 3, 3, m.color); R(cx + 7, y, 3, 3, m.color); }
          windows(cx - 4, g - 118, 8, 112, PAPER, 6, 0.5, 3);
          sign(cx, g - 96, "CODE SPIRE", m.color, "#fff");
          break;
        }
        case "MMIT": { // NEXUS EXCHANGE — ตึกขั้นบันได
          R(cx - 34, g - 70, 68, 70, NEAR);
          R(cx - 26, g - 110, 52, 40, NEAR);
          R(cx - 16, g - 138, 32, 28, NEAR);
          R(cx - 34, g - 72, 68, 2, m.color); R(cx - 26, g - 112, 52, 2, m.color); R(cx - 16, g - 140, 32, 2, m.color);
          windows(cx - 32, g - 68, 64, 66, "#E9D7A6", 5, 0.45, 11);
          windows(cx - 24, g - 108, 48, 36, "#E9D7A6", 5, 0.45, 12);
          // กราฟบนป้าย
          R(cx - 12, g - 134, 24, 18, PAPER);
          [4, 8, 6, 12].forEach((h, k) => R(cx - 9 + k * 5, g - 118 - h, 3, h, m.color));
          sign(cx, g - 60, "NEXUS EXCHANGE", m.color, INK);
          break;
        }
        case "ANI": { // PRISM STUDIO — โดม + จอ
          R(cx - 30, g - 56, 60, 56, NEAR);
          for (let r = 0; r < 26; r++) {
            const w = Math.round(Math.sqrt(26 * 26 - r * r));
            R(cx - w, g - 56 - r, w * 2, 1, r % 6 < 3 ? m.color : Avatar.shade(m.color, 0.8));
          }
          R(cx - 22, g - 46, 44, 26, INK);
          const hue = Math.floor(t * 1.5) % 3;
          R(cx - 20, g - 44, 40, 22, [m.color, ORANGE, "#2F62D9"][hue]);
          R(cx - 6, g - 38, 4, 4, PAPER); R(cx + 2, g - 38, 4, 4, PAPER);
          sign(cx, g - 16, "PRISM STUDIO", m.color, "#fff");
          break;
        }
        case "DG": { // ARCADE ARENA — อารีน่า + จอใหญ่
          R(cx - 44, g - 40, 88, 40, NEAR);
          R(cx - 40, g - 44, 80, 4, NEAR);
          R(cx - 30, g - 92, 60, 44, INK);
          R(cx - 27, g - 89, 54, 38, m.color);
          // จอยเกมพิกเซล
          R(cx - 14, g - 76, 28, 12, PAPER); R(cx - 10, g - 74, 2, 8, INK); R(cx - 13, g - 71, 8, 2, INK);
          R(cx + 6, g - 73, 2, 2, ORANGE); R(cx + 10, g - 70, 2, 2, ORANGE);
          R(cx - 2, g - 48, 4, 8, NEAR);
          for (let k = 0; k < 10; k++) R(cx - 40 + k * 9, g - 36, 4, 2, (k + Math.floor(t * 4)) % 3 === 0 ? m.color : "#5A534B");
          sign(cx, g - 28, "ARCADE ARENA", m.color, "#fff");
          break;
        }
        case "DII": { // SYNTH FORGE — โรงงาน + ปล่อง + โดรน
          R(cx - 40, g - 48, 80, 48, NEAR);
          for (let k = 0; k < 4; k++) { R(cx - 40 + k * 20, g - 58, 20, 10, NEAR); R(cx - 40 + k * 20, g - 58, 10, 2, m.color); }
          R(cx + 18, g - 100, 10, 52, NEAR); R(cx + 18, g - 100, 10, 3, m.color);
          R(cx - 28, g - 86, 8, 38, NEAR); R(cx - 28, g - 86, 8, 3, m.color);
          // ควัน (พิกเซล)
          for (let k = 0; k < 3; k++) {
            const yy = g - 106 - ((t * 10 + k * 8) % 24);
            R(cx + 20 + Math.sin(t + k) * 2, yy, 6, 4, "#D9D2C6");
          }
          windows(cx - 38, g - 46, 76, 44, "#C9B8F0", 6, 0.5, 31);
          // โดรน
          const dx = cx + Math.sin(t * 0.8) * 50, dy = g - 130 + Math.sin(t * 2) * 6;
          R(dx - 5, dy, 10, 2, INK); R(dx - 7, dy - 2, 4, 1, INK); R(dx + 3, dy - 2, 4, 1, INK); R(dx - 1, dy + 2, 2, 2, ORANGE);
          sign(cx, g - 40, "SYNTH FORGE", m.color, "#fff");
          break;
        }
      }
    });
  }

  /* ---------- พลเมือง ---------- */
  function lookOf(r) { return { hair: r.hair | 0, hair_color: r.hair_color | 0, skin: r.skin | 0, acc: r.acc | 0, top: r.top | 0 }; }

  function placeResident(r, prev) {
    const d = Math.max(0, ORDER.indexOf(r.major));
    const lo = d * DW + 18, hi = d * DW + DW - 18;
    const x = prev && prev.major === r.major ? prev.x : lo + Math.random() * (hi - lo);
    return {
      ...r, look: lookOf(r), lo, hi, x,
      lane: prev && prev.major === r.major ? prev.lane : Math.random(),
      tx: lo + Math.random() * (hi - lo),
      v: 6 + Math.random() * 10,
      wait: Math.random() * 3,
      phase: Math.random() * 10,
    };
  }

  function setResidents(list) {
    const old = new Map(residents.map((r) => [r.id, r]));
    residents = (list || []).map((r) => placeResident(r, old.get(r.id)));
    if (me) attachMe();
  }

  function attachMe() {
    if (!me) return;
    let r = residents.find((x) => x.id === me.id);
    const data = { id: me.id || "me", nickname: me.nickname, major: me.major, ...me.look };
    if (!r) { r = placeResident(data); residents.push(r); }
    else Object.assign(r, data, { look: lookOf(data) });
    r.isMe = true;
  }

  function setMe(obj) { me = obj; attachMe(); }

  function updateResidents(dt) {
    for (const r of residents) {
      if (r.wait > 0) { r.wait -= dt; continue; }
      const dir = Math.sign(r.tx - r.x);
      r.x += dir * r.v * dt;
      if (Math.abs(r.tx - r.x) < 1) {
        r.wait = 1 + Math.random() * 4;
        r.tx = r.lo + Math.random() * (r.hi - r.lo);
      }
    }
  }

  function drawResidents(ox) {
    const list = [];
    for (const r of residents) {
      let sx = r.x + ox;
      if (sx < -20) sx += WW; else if (sx > VW + 20) sx -= WW;
      if (sx < -20 || sx > VW + 20) continue;
      list.push({ r, sx, sy: GY + 8 + r.lane * 22 });
    }
    list.sort((a, b) => a.sy - b.sy);
    ctx.imageSmoothingEnabled = false;
    for (const { r, sx, sy } of list) {
      const moving = r.wait <= 0;
      const frame = moving ? (Math.floor(t * 6 + r.phase) % 2 ? 1 : 2) : 0;
      const spr = Avatar.sprite(r.look, frame, MAJORS[r.major] ? MAJORS[r.major].color : undefined);
      const flip = r.tx < r.x;
      // เงา
      R(sx - 6, sy - 1, 12, 2, "rgba(22,22,22,0.18)");
      ctx.save();
      ctx.translate(Math.round(sx), Math.round(sy - spr.height));
      if (flip) { ctx.scale(-1, 1); ctx.drawImage(spr, -Math.ceil(spr.width / 2), 0); }
      else ctx.drawImage(spr, -Math.floor(spr.width / 2), 0);
      ctx.restore();
      r._sx = sx; r._sy = sy;
    }
    // ป้ายชื่อ (วาดทีหลังให้อยู่บนสุด)
    const now = performance.now();
    for (const { r, sx, sy } of list) {
      const show = r.isMe || (tagUntil.get(r.id) || 0) > now;
      if (!show) continue;
      nameTag(sx, sy - 27, r.nickname, r.isMe);
    }
  }

  function nameTag(x, y, text, isMe) {
    const fs = uiPx(12);
    ctx.font = `600 ${fs}px 'IBM Plex Sans Thai', sans-serif`;
    const w = Math.ceil(ctx.measureText(text).width) + fs;
    const h = Math.round(fs * 1.5);
    const bg = isMe ? ORANGE : INK;
    ctx.fillStyle = bg;
    roundRect(x - w / 2, y - h, w, h, Math.round(h / 2));
    ctx.fill();
    R(x - 1, y, 3, 2, bg);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y - h / 2 + 0.5);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- เฟรม ---------- */
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    if (camTarget != null) {
      const diff = ((camTarget - camX + WW / 2) % WW + WW) % WW - WW / 2;
      camX = wrap(camX + diff * Math.min(1, dt * 4));
      if (Math.abs(diff) < 0.5) camTarget = null;
    } else if (mode === "ambient" && !dragging) {
      camX = wrap(camX + dt * 10);
    }

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // ท้องฟ้า + พระอาทิตย์ (สีพื้น ไม่มีไล่สี)
    R(0, 0, VW, VH, PAPER);
    const sr = Math.min(46, VH * 0.22), sx = VW * 0.72, sy = GY - 70;
    ctx.fillStyle = ORANGE;
    for (let y = -sr; y <= sr; y++) {
      const w = Math.round(Math.sqrt(sr * sr - y * y));
      if (y > sr * 0.15 && (Math.floor(y) % 6) < 2) continue; // เส้นตัดสไตล์โปสเตอร์
      ctx.fillRect(Math.round(sx - w), Math.round(sy + y), w * 2, 1);
    }
    for (const c of clouds) {
      const x = wrap(c.x - camX * 0.15 + t * 2) - 40;
      R(x, c.y, c.w, 4, "#FFFFFF"); R(x + 4, c.y - 3, c.w - 10, 3, "#FFFFFF");
    }

    // แนวตึกไกล / กลาง (parallax)
    const farOff = -camX * 0.35, midOff = -camX * 0.65;
    for (const pass of [0, 1, 2]) {
      for (const b of farLine) { const x = b.x + farOff + (pass - 1) * WW; if (x > -40 && x < VW + 40) R(x, GY - b.h - 30, b.w, b.h + 30, FAR); }
    }
    for (const p of pods) {
      p.x = wrap(p.x + p.v * dt);
      const x = wrap(p.x - camX * 0.8);
      R(x, p.y, 7, 2, INK); R(p.v > 0 ? x + 6 : x - 1, p.y, 1, 1, ORANGE);
    }
    for (const pass of [0, 1, 2]) {
      for (const b of midLine) {
        const x = b.x + midOff + (pass - 1) * WW;
        if (x < -50 || x > VW + 50) continue;
        R(x, GY - b.h - 10, b.w, b.h + 10, MID);
        if (b.win) windows(x, GY - b.h - 10, b.w, b.h, "#E9E3D8", 5, 0.4, b.x);
      }
    }

    // รถไฟลอยฟ้า
    const railY = GY - 22;
    R(0, railY, VW, 2, NEAR);
    for (let x = ((-camX) % 40 + 40) % 40 - 40; x < VW; x += 40) R(x, railY + 2, 2, 20, NEAR2);
    const trainX = wrap(t * 60 - camX) - 80;
    for (let k = 0; k < 3; k++) { R(trainX + k * 24, railY - 7, 22, 7, PAPER); R(trainX + k * 24, railY - 4, 22, 1, ORANGE); R(trainX + k * 24, railY - 7, 22, 1, INK); }

    // ตึกประจำเขต
    for (const pass of [0, 1, 2]) towers(-camX + (pass - 1) * WW);

    // พื้นลาน
    R(0, GY, VW, VH - GY, "#E2DACC");
    R(0, GY, VW, 2, INK);
    for (let x = ((-camX) % 16 + 16) % 16 - 16; x < VW; x += 16) R(x, GY + 2, 1, VH - GY, "#D6CDBD");
    // เส้นแบ่งเขต + ป้ายพื้น
    for (let i = 0; i < ORDER.length; i++) {
      for (const pass of [0, 1, 2]) {
        const x = i * DW - camX + (pass - 1) * WW;
        if (x > -2 && x < VW + 2) R(x, GY + 2, 2, VH - GY, MAJORS[ORDER[i]].color);
      }
    }

    updateResidents(dt);
    for (const pass of [0]) drawResidents(-camX + pass);

    requestAnimationFrame(frame);
  }

  /* ---------- การโต้ตอบ ---------- */
  let dragging = false, dragX = 0, dragCam = 0, moved = 0;
  canvas.addEventListener("pointerdown", (e) => {
    if (mode !== "explore") return;
    dragging = true; moved = 0; dragX = e.clientX; dragCam = camX; camTarget = null;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = ((e.clientX - dragX) * dpr) / scale;
    moved = Math.max(moved, Math.abs(dx));
    camX = wrap(dragCam - dx);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    if (moved < 4) tap(e);
  });

  function tap(e) {
    const rect = canvas.getBoundingClientRect();
    const lx = ((e.clientX - rect.left) * dpr) / scale;
    const ly = ((e.clientY - rect.top) * dpr) / scale;
    let best = null, bd = 18;
    for (const r of residents) {
      if (r._sx == null) continue;
      const d = Math.hypot(r._sx - lx, r._sy - 12 - ly);
      if (d < bd) { bd = d; best = r; }
    }
    if (best) {
      tagUntil.set(best.id, performance.now() + 4000);
      onSelect && onSelect(best);
    }
  }

  function focus(code) {
    const i = Math.max(0, ORDER.indexOf(code));
    camTarget = wrap(i * DW + DW / 2 - VW / 2);
  }

  function focusMe() {
    const r = residents.find((x) => x.isMe);
    if (r) camTarget = wrap(r.x - VW / 2);
  }

  window.addEventListener("resize", () => { clearTimeout(window.__cr); window.__cr = setTimeout(build, 150); });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  build();
  requestAnimationFrame(frame);

  return {
    setResidents, setMe, focus, focusMe,
    setMode(m) { if (m !== mode) { mode = m; layout(); } canvas.classList.toggle("explore", m === "explore"); },
    onSelect(cb) { onSelect = cb; },
    count() { return residents.length; },
  };
})();
