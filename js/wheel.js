/* ==========================================================
   CAMT NEXTOPIA — วงล้อรางวัล
   - ผลลัพธ์สุ่มจาก "เปอร์เซ็นต์" ใน config/prizes.json (ไม่ใช่ขนาดช่องบนวงล้อ)
   - ของรางวัลมีจำกัด: ของที่หมด/ปิดไว้ จะมีโอกาส 0%
   - ใช้ crypto.getRandomValues เพื่อความสุ่มที่ยุติธรรม
   ========================================================== */
const Prize = (function () {
  const DEFAULT_CONFIG = {
    prizes: [
      { id: "clicker1", name: "คลิกเกอร์ 1 ปุ่ม", emoji: "🖲️", stock: 5, chance: 1.0, enabled: true },
      { id: "clicker3", name: "คลิกเกอร์ 3 ปุ่ม", emoji: "🎛️", stock: 5, chance: 0.8, enabled: true },
      { id: "bag", name: "กระเป๋า CAMT", emoji: "🎒", stock: 2, chance: 0.25, enabled: true },
      { id: "mug", name: "แก้วน้ำ CAMT", emoji: "🥤", stock: 2, chance: 0.25, enabled: true },
    ],
  };

  const THANKS = [
    "ขอบคุณจ้า 💖",
    "เกือบแล้ว!",
    "เจอกันที่ CAMT นะ",
    "โชคดีครั้งหน้า",
    "สู้ ๆ นะว่าที่เด็ก CAMT",
    "ขอบคุณที่มาเที่ยวเมือง",
  ];

  // ลำดับช่องบนวงล้อ (สลับรางวัลกับช่องขอบคุณให้ดูลุ้น)
  const SEGMENTS = [
    { id: "bag" }, { id: "thx", i: 0 }, { id: "clicker1" }, { id: "thx", i: 1 },
    { id: "clicker3" }, { id: "thx", i: 2 }, { id: "mug" }, { id: "thx", i: 3 },
    { id: "clicker1" }, { id: "thx", i: 4 }, { id: "clicker3" }, { id: "thx", i: 5 },
  ];

  const LS = {
    given: "nx_given_v1",
    overrides: "nx_overrides_v1",
    history: "nx_history_v1",
    spun: "nx_spun_v1",
    mode: "nx_mode_v1",
  };

  let config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  function read(key, fb) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fb : JSON.parse(v);
    } catch (e) {
      return fb;
    }
  }
  function write(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ }
  }

  async function loadConfig() {
    try {
      const res = await fetch("config/prizes.json?ts=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        if (j && Array.isArray(j.prizes)) config = j;
      }
    } catch (e) {
      /* offline → ใช้ค่าเดิม */
    }
    return getPrizes();
  }

  /* รวมค่า config + ค่าที่แอดมินแก้ในเครื่อง + จำนวนที่แจกไปแล้วในเครื่อง */
  function getPrizes() {
    const ov = read(LS.overrides, {});
    const given = read(LS.given, {});
    return config.prizes.map((p) => {
      const o = ov[p.id] || {};
      const stock = o.stock != null ? o.stock : p.stock;
      const chance = o.chance != null ? o.chance : p.chance;
      const enabled = o.enabled != null ? o.enabled : p.enabled !== false;
      const g = given[p.id] || 0;
      const left = Math.max(0, stock - g);
      return { ...p, stock, chance, enabled, given: g, left, effective: enabled && left > 0 ? chance : 0 };
    });
  }

  function rnd() {
    const a = new Uint32Array(1);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return a[0] / 4294967296;
  }

  /* สุ่มผล: คืน prize object หรือ null (= ขอบคุณจ้า) */
  function draw() {
    const prizes = getPrizes();
    const r = rnd() * 100;
    let acc = 0;
    for (const p of prizes) {
      acc += p.effective;
      if (r < acc) return p;
    }
    return null;
  }

  function recordWin(p) {
    const given = read(LS.given, {});
    given[p.id] = (given[p.id] || 0) + 1;
    write(LS.given, given);
  }

  function addHistory(entry) {
    const h = read(LS.history, []);
    h.unshift(entry);
    write(LS.history, h.slice(0, 2000));
  }

  function code(prizeId) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 5; i++) s += chars[Math.floor(rnd() * chars.length)];
    const tag = { clicker1: "C1", clicker3: "C3", bag: "BG", mug: "MG" }[prizeId] || "TY";
    return `NX-${tag}-${s}`;
  }

  /* ---------- วาดวงล้อ ---------- */
  const COLORS = {
    bag: ["#ff3df2", "#8a2bff"],
    mug: ["#00e5ff", "#0077ff"],
    clicker1: ["#ffb800", "#ff6a00"],
    clicker3: ["#39ff88", "#00b36b"],
    thx: ["#1b1440", "#120c2e"],
  };

  function drawWheel(canvas, rotation) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.clientWidth;
    if (canvas.width !== Math.floor(size * dpr)) {
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = size / 2;
    const R = c - 6;
    const n = SEGMENTS.length;
    const arc = (Math.PI * 2) / n;
    const prizes = Object.fromEntries(config.prizes.map((p) => [p.id, p]));

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(rotation);
    for (let i = 0; i < n; i++) {
      const s = SEGMENTS[i];
      const a0 = -Math.PI / 2 + i * arc - arc / 2;
      const g = ctx.createRadialGradient(0, 0, R * 0.15, 0, 0, R);
      const col = COLORS[s.id] || COLORS.thx;
      g.addColorStop(0, col[1]);
      g.addColorStop(1, col[0]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, a0, a0 + arc);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // ข้อความ
      ctx.save();
      ctx.rotate(a0 + arc / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      if (s.id === "thx") {
        ctx.font = `600 ${Math.max(10, size * 0.032)}px Kanit, sans-serif`;
        ctx.globalAlpha = 0.85;
        ctx.fillText("ขอบคุณจ้า", R - 14, 0);
      } else {
        const p = prizes[s.id] || {};
        ctx.font = `${Math.max(16, size * 0.06)}px sans-serif`;
        ctx.fillText(p.emoji || "🎁", R - 12, 0);
        ctx.font = `700 ${Math.max(9, size * 0.03)}px Kanit, sans-serif`;
        ctx.fillText(shortName(s.id), R - 12 - size * 0.075, 0);
      }
      ctx.restore();
    }
    // ไฟรอบวง
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3), 2.2, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? "#fff" : "#ffb800";
      ctx.fill();
    }
    ctx.restore();

    // ขอบนีออน
    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.strokeStyle = "#ff5a1f";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#ff5a1f";
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function shortName(id) {
    return { clicker1: "คลิกเกอร์ 1 ปุ่ม", clicker3: "คลิกเกอร์ 3 ปุ่ม", bag: "กระเป๋า", mug: "แก้วน้ำ" }[id] || "";
  }

  /* หาองศาที่จะให้เข็ม (ด้านบน) ชี้ช่องที่ต้องการ */
  function targetRotation(resultId, current) {
    const n = SEGMENTS.length;
    const arc = (Math.PI * 2) / n;
    const idxs = SEGMENTS.map((s, i) => (s.id === resultId ? i : -1)).filter((i) => i >= 0);
    const idx = idxs[Math.floor(rnd() * idxs.length)];
    // ช่อง i อยู่ที่มุม i*arc (เทียบกับด้านบน) → หมุน -i*arc ให้มาอยู่ด้านบน
    const jitter = (rnd() - 0.5) * arc * 0.7;
    let target = -idx * arc + jitter;
    const full = Math.PI * 2;
    const base = current - (current % full);
    target = base + full * (6 + Math.floor(rnd() * 3)) + ((target % full) + full) % full;
    return target;
  }

  /* ---------- สถานะเครื่อง ---------- */
  function mode() { return read(LS.mode, "personal"); }
  function setMode(m) { write(LS.mode, m); }
  function hasSpun() { return mode() === "personal" && !!read(LS.spun, null); }
  function markSpun(entry) { write(LS.spun, entry); }
  function lastSpin() { return read(LS.spun, null); }
  function resetSpinLock() { try { localStorage.removeItem(LS.spun); } catch (e) {} }

  return {
    THANKS, SEGMENTS, LS,
    loadConfig, getPrizes, draw, recordWin, addHistory, code,
    drawWheel, targetRotation, rnd,
    mode, setMode, hasSpun, markSpun, lastSpin, resetSpinLock,
    read, write,
  };
})();
