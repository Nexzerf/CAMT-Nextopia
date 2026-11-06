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
    { id: "clicker1", name: "คลิกเกอร์ 1 ปุ่ม", stock: 5, left: 5, available: true },
    { id: "clicker3", name: "คลิกเกอร์ 3 ปุ่ม", stock: 5, left: 5, available: true },
    { id: "bag", name: "กระเป๋า CAMT", stock: 2, left: 2, available: true },
    { id: "mug", name: "แก้วน้ำ CAMT", stock: 2, left: 2, available: true },
  ];

  const THANKS = [
    "ขอบคุณจ้า",
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

  /* ---------- Supabase RPC ----------
     เรียกผ่าน /api/rpc/* (โดเมนเดียวกับเว็บ, Vercel ส่งต่อให้ Supabase)
     เพื่อให้เครือข่ายที่บล็อก *.supabase.co ก็ยังใช้ได้
     ถ้าไม่มี proxy (เช่นรันในเครื่อง) จะสลับไปเรียก Supabase ตรง ๆ */
  let base = null;
  const PROXY = "/api/rpc/";
  const DIRECT = () => `${NEXTOPIA_CONFIG.SUPABASE_URL}/rest/v1/rpc/`;

  async function call(url, body, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { apikey: NEXTOPIA_CONFIG.SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
        signal: ctrl.signal,
        cache: "no-store",
      });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { /* not json */ }
      return { res, data, json: data !== null || text === "" };
    } finally {
      clearTimeout(timer);
    }
  }

  async function rpc(fn, body, timeoutMs = 12000) {
    const order = base ? [base] : [PROXY, DIRECT()];
    let lastErr = null;
    for (const b of order) {
      try {
        const { res, data, json } = await call(b + fn, body, timeoutMs);
        // proxy ไม่มี (404 HTML จาก static server) → ลองตัวถัดไป
        if (!json || (res.status === 404 && b === PROXY)) { lastErr = new Error("proxy unavailable"); continue; }
        if (!res.ok) throw new Error((data && (data.message || data.error)) || `HTTP ${res.status}`);
        base = b;
        return data;
      } catch (e) {
        lastErr = e;
        if (e && /HTTP|invalid|already|pin|not allowed|length|busy/.test(e.message)) throw e;
      }
    }
    throw lastErr || new Error("network");
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

  async function join(look, nickname, major, kioskRound) {
    const dev = kioskRound ? `${deviceId().slice(0, 40)}-k${kioskRound}` : deviceId();
    const r = await rpc("nextopia_join", {
      p_device: dev, p_nickname: nickname, p_major: major,
      p_hair: look.hair, p_hair_color: look.hair_color, p_skin: look.skin, p_acc: look.acc, p_top: look.top,
    });
    if (r && r.error) throw new Error(r.error);
    return r;
  }

  async function residents(limit = 160) {
    return rpc("nextopia_residents", { p_limit: limit });
  }

  async function admin(pin, action, payload) {
    const r = await rpc("nextopia_admin", { p_pin: pin, p_action: action, p_payload: payload || {} }, 20000);
    if (r && r.error) throw new Error(r.error);
    return r;
  }

  /* ---------- วาดวงล้อ (สีพื้นเรียบ + ไอคอนเวกเตอร์) ---------- */
  const SEG_STYLE = {
    bag: { bg: "#161616", fg: "#FFFFFF" },
    mug: { bg: "#F15A24", fg: "#FFFFFF" },
    clicker1: { bg: "#FFFFFF", fg: "#161616" },
    clicker3: { bg: "#E9A319", fg: "#161616" },
  };
  const THX_STYLE = [{ bg: "#F4F1EC", fg: "#8A8378" }, { bg: "#E2DACC", fg: "#6E675C" }];

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
    const R = c - 4;
    const n = SEGMENTS.length;
    const arc = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(rotation);
    let thx = 0;
    for (let i = 0; i < n; i++) {
      const s = SEGMENTS[i];
      const st = s.id === "thx" ? THX_STYLE[thx++ % 2] : SEG_STYLE[s.id];
      const a0 = -Math.PI / 2 + i * arc - arc / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, a0, a0 + arc);
      ctx.closePath();
      ctx.fillStyle = st.bg;
      ctx.fill();
      ctx.strokeStyle = "#161616";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(a0 + arc / 2);
      // ไอคอนตั้งฉากกับรัศมี (หัวชี้ออกนอกวง)
      const ir = R * 0.74;
      ctx.save();
      ctx.translate(ir, 0);
      ctx.rotate(Math.PI / 2);
      drawIcon(ctx, s.id === "thx" ? "heart" : s.id, 0, 0, Math.max(18, size * 0.075), st.fg, 2);
      ctx.restore();
      ctx.textBaseline = "middle";
      ctx.fillStyle = st.fg;
      ctx.font = `600 ${Math.max(9, size * 0.028)}px "IBM Plex Sans Thai", sans-serif`;
      const label = s.id === "thx" ? "ขอบคุณจ้า" : shortName(s.id);
      // ครึ่งซ้ายของวงล้อ: กลับตัวหนังสือให้อ่านได้ไม่กลับหัว
      if (Math.cos(a0 + arc / 2 + rotation) < 0) {
        ctx.save(); ctx.translate(R * 0.6, 0); ctx.rotate(Math.PI);
        ctx.textAlign = "left"; ctx.fillText(label, 0, 0); ctx.restore();
      } else {
        ctx.textAlign = "right"; ctx.fillText(label, R * 0.6, 0);
      }
      ctx.restore();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(c, c, R, 0, Math.PI * 2);
    ctx.strokeStyle = "#161616";
    ctx.lineWidth = 4;
    ctx.stroke();
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
    loadStatus, getPrizes, spin, admin, join, residents, deviceId,
    drawWheel, targetRotation,
    isKiosk, setKiosk, lastSpin, markSpun, resetSpinLock, hasSpun,
  };
})();
