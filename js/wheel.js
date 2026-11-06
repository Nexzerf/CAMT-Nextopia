/* ==========================================================
   CAMT NEXTOPIA — วงล้อรางวัล (เชื่อม Supabase)
   - การสุ่มผล + ตัดสต็อก ทำบนเซิร์ฟเวอร์ (nextopia_spin) แบบ atomic
     ทุกเครื่องใช้สต็อกเดียวกัน ของหมดแล้วจะไม่ออกอีกโดยอัตโนมัติ
   - มือถือ 1 เครื่อง หมุนได้ 1 ครั้ง (เซิร์ฟเวอร์จำ device id)
   - เครื่องบูธ (Kiosk) ที่สตาฟปลดล็อกด้วย PIN หมุนได้ทุกรอบ
   - วงล้อเป็นแค่ภาพ หมุนไปหยุดตรงช่องของผลที่เซิร์ฟเวอร์ส่งมา
   ========================================================== */
const Prize = (function () {
  const FALLBACK_PRIZES = [
    { id: "clicker1", name: "คลิกเกอร์ 1 ปุ่ม", emoji: "🖲️", stock: 5, left: 5, available: true },
    { id: "clicker3", name: "คลิกเกอร์ 3 ปุ่ม", emoji: "🎛️", stock: 5, left: 5, available: true },
    { id: "bag", name: "กระเป๋า CAMT", emoji: "🎒", stock: 2, left: 2, available: true },
    { id: "mug", name: "แก้วน้ำ CAMT", emoji: "🥤", stock: 2, left: 2, available: true },
  ];

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
    { id: "bag" }, { id: "thx" }, { id: "clicker1" }, { id: "thx" },
    { id: "clicker3" }, { id: "thx" }, { id: "mug" }, { id: "thx" },
    { id: "clicker1" }, { id: "thx" }, { id: "clicker3" }, { id: "thx" },
  ];

  const LS = {
    device: "nx_device_v1",
    spun: "nx_spun_v2",
    kioskPin: "nx_kiosk_pin_v1",
  };

  let prizes = FALLBACK_PRIZES.map((p) => ({ ...p }));

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
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function rnd() {
    const a = new Uint32Array(1);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return a[0] / 4294967296;
  }

  function deviceId() {
    let id = read(LS.device, null);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + "-" + Math.floor(rnd() * 1e12).toString(36));
      write(LS.device, id);
    }
    return id;
  }

  /* ---------- Supabase RPC ---------- */
  async function rpc(fn, body, timeoutMs = 12000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${NEXTOPIA_CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          apikey: NEXTOPIA_CONFIG.SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body || {}),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadStatus() {
    try {
      const data = await rpc("nextopia_status", {});
      if (Array.isArray(data) && data.length) prizes = data;
      return { ok: true, prizes };
    } catch (e) {
      return { ok: false, prizes };
    }
  }
  function getPrizes() { return prizes; }

  /* หมุน: คืน { prize_id, prize_name, emoji, code, time, already } หรือ throw */
  async function spin(name, major) {
    const body = { p_device: deviceId(), p_name: name || null, p_major: major || null };
    const kpin = kioskPin();
    if (kpin) body.p_kiosk_pin = kpin;
    const r = await rpc("nextopia_spin", body);
    if (r && r.error) throw new Error(r.error);
    return r;
  }

  async function admin(pin, action, payload) {
    const r = await rpc("nextopia_admin", { p_pin: pin, p_action: action, p_payload: payload || {} }, 20000);
    if (r && r.error) throw new Error(r.error);
    return r;
  }

  /* ---------- วาดวงล้อ ---------- */
  const COLORS = {
    bag: ["#ff3df2", "#8a2bff"],
    mug: ["#00e5ff", "#0077ff"],
    clicker1: ["#ffb800", "#ff6a00"],
    clicker3: ["#39ff88", "#00b36b"],
    thx: ["#1b1440", "#120c2e"],
  };

  function shortName(id) {
    return { clicker1: "คลิกเกอร์ 1 ปุ่ม", clicker3: "คลิกเกอร์ 3 ปุ่ม", bag: "กระเป๋า", mug: "แก้วน้ำ" }[id] || "";
  }

  function drawWheel(canvas, rotation) {
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.clientWidth;
    if (!size) return;
    if (canvas.width !== Math.floor(size * dpr)) {
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const c = size / 2;
    const R = c - 6;
    const n = SEGMENTS.length;
    const arc = (Math.PI * 2) / n;
    const byId = Object.fromEntries(prizes.map((p) => [p.id, p]));

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
        const p = byId[s.id] || {};
        ctx.font = `${Math.max(16, size * 0.06)}px sans-serif`;
        ctx.fillText(p.emoji || "🎁", R - 12, 0);
        ctx.font = `700 ${Math.max(9, size * 0.03)}px Kanit, sans-serif`;
        ctx.fillText(shortName(s.id), R - 12 - size * 0.075, 0);
      }
      ctx.restore();
    }
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3), 2.2, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? "#fff" : "#ffb800";
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.strokeStyle = "#ff5a1f";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#ff5a1f";
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /* หาองศาที่จะให้เข็ม (ด้านบน) ชี้ช่องของผลลัพธ์ */
  function targetRotation(resultId, current) {
    const n = SEGMENTS.length;
    const arc = (Math.PI * 2) / n;
    let idxs = SEGMENTS.map((s, i) => (s.id === resultId ? i : -1)).filter((i) => i >= 0);
    if (!idxs.length) idxs = SEGMENTS.map((s, i) => (s.id === "thx" ? i : -1)).filter((i) => i >= 0);
    const idx = idxs[Math.floor(rnd() * idxs.length)];
    const jitter = (rnd() - 0.5) * arc * 0.7;
    const full = Math.PI * 2;
    const want = (((-idx * arc + jitter) % full) + full) % full;
    const base = current - (current % full);
    return base + full * (6 + Math.floor(rnd() * 3)) + want;
  }

  /* ---------- สถานะเครื่อง ---------- */
  function kioskPin() { return read(LS.kioskPin, null); }
  function isKiosk() { return !!kioskPin(); }
  function setKiosk(pin) { pin ? write(LS.kioskPin, pin) : remove(LS.kioskPin); }
  function lastSpin() { return read(LS.spun, null); }
  function markSpun(entry) { write(LS.spun, entry); }
  function resetSpinLock() { remove(LS.spun); }
  function hasSpun() { return !isKiosk() && !!lastSpin(); }

  return {
    THANKS, SEGMENTS,
    loadStatus, getPrizes, spin, admin,
    drawWheel, targetRotation,
    isKiosk, setKiosk, lastSpin, markSpun, resetSpinLock, hasSpun,
  };
})();
