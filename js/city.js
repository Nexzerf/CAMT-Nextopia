/* ==========================================================
   CAMT NEXTOPIA — ฉากเมืองอนาคต (procedural canvas)
   ตึกสูงหลายชั้นความลึก, หอคอย 5 เขต, รถบิน, โฮโลแกรม
   ========================================================== */
(function () {
  const canvas = document.getElementById("city");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  let layers = [];
  let stars = [];
  let cars = [];
  let megaTowers = [];
  let t = 0;
  let running = true;
  let highlight = null; // รหัสสาขาที่จะเน้นหอคอย
  let seed = 20260;

  function rand() {
    // deterministic เพื่อให้เมืองหน้าตาเหมือนเดิมทุกครั้งที่ resize
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  const TOWER_DEFS = [
    { code: "SE", x: 0.12, h: 0.62, w: 0.055, color: "#00e5ff", shape: "spire" },
    { code: "ANI", x: 0.31, h: 0.5, w: 0.08, color: "#ff3df2", shape: "dome" },
    { code: "MMIT", x: 0.5, h: 0.74, w: 0.07, color: "#ffb800", shape: "needle" },
    { code: "DG", x: 0.69, h: 0.52, w: 0.085, color: "#39ff88", shape: "arena" },
    { code: "DII", x: 0.88, h: 0.6, w: 0.065, color: "#ff5a1f", shape: "forge" },
  ];

  function build() {
    seed = 20260;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    stars = [];
    const nStars = Math.floor((W * H) / 6000);
    for (let i = 0; i < nStars; i++) {
      stars.push({ x: rand() * W, y: rand() * H * 0.6, r: rand() * 1.2 + 0.2, p: rand() * Math.PI * 2 });
    }

    // 3 ชั้นความลึกของตึก
    const defs = [
      { depth: 0.25, minH: 0.18, maxH: 0.45, minW: 18, maxW: 46, col: [22, 18, 52], win: 0.15, speed: 2 },
      { depth: 0.55, minH: 0.12, maxH: 0.38, minW: 26, maxW: 64, col: [16, 12, 38], win: 0.22, speed: 5 },
      { depth: 1.0, minH: 0.06, maxH: 0.26, minW: 34, maxW: 90, col: [9, 7, 22], win: 0.3, speed: 10 },
    ];
    layers = defs.map((d) => {
      const bs = [];
      let x = -40;
      while (x < W + 200) {
        const w = d.minW + rand() * (d.maxW - d.minW);
        const h = H * (d.minH + rand() * (d.maxH - d.minH));
        const b = {
          x, w, h,
          antenna: rand() < 0.3 ? 10 + rand() * 40 : 0,
          stripe: rand() < 0.35 ? ["#00e5ff", "#ff3df2", "#ff6a00", "#39ff88"][Math.floor(rand() * 4)] : null,
          tiers: rand() < 0.4 ? 1 + Math.floor(rand() * 2) : 0,
          windows: [],
        };
        const cols = Math.max(2, Math.floor(w / 9));
        const rows = Math.floor(h / 12);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (rand() < d.win) {
              b.windows.push({
                x: 4 + c * ((w - 8) / cols),
                y: 8 + r * 12,
                warm: rand() < 0.55,
                flick: rand() < 0.05,
              });
            }
          }
        }
        bs.push(b);
        x += w + rand() * 14;
      }
      return { ...d, buildings: bs, width: x };
    });

    megaTowers = TOWER_DEFS.map((d) => ({
      ...d,
      px: d.x * W,
      ph: d.h * H * (W < 700 ? 0.85 : 1),
      pw: Math.max(34, d.w * W * (W < 700 ? 1.3 : 1)),
    }));

    cars = [];
    const nCars = W < 700 ? 10 : 22;
    for (let i = 0; i < nCars; i++) cars.push(newCar(true));
  }

  function newCar(anywhere) {
    const dir = rand() < 0.5 ? 1 : -1;
    const lane = 0.15 + rand() * 0.5;
    return {
      x: anywhere ? rand() * W : dir > 0 ? -60 : W + 60,
      y: H * lane,
      v: (40 + rand() * 120) * dir,
      c: ["#00e5ff", "#ff3df2", "#ffb800", "#ffffff"][Math.floor(rand() * 4)],
      len: 20 + rand() * 50,
    };
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#05010f");
    g.addColorStop(0.45, "#140630");
    g.addColorStop(0.75, "#3a0a3f");
    g.addColorStop(1, "#ff5a1f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // ดวงอาทิตย์นีออน
    const sx = W * 0.5, sy = H * 0.78, sr = Math.min(W, H) * 0.28;
    const sg = ctx.createLinearGradient(0, sy - sr, 0, sy + sr);
    sg.addColorStop(0, "rgba(255,184,0,0.85)");
    sg.addColorStop(0.6, "rgba(255,61,140,0.6)");
    sg.addColorStop(1, "rgba(255,61,140,0)");
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = sg;
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    // แถบตัดแบบ retro-future
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 9; i++) {
      const yy = sy - sr * 0.1 + i * (sr / 7);
      ctx.fillRect(sx - sr, yy, sr * 2, 2 + i * 1.3);
    }
    ctx.restore();

    for (const s of stars) {
      const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + s.p));
      ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
  }

  function drawLayer(L) {
    const off = (t * L.speed) % L.width;
    const baseY = H;
    for (let pass = 0; pass < 2; pass++) {
      const shift = -off + pass * L.width;
      for (const b of L.buildings) {
        const x = b.x + shift;
        if (x > W + 10 || x + b.w < -10) continue;
        const y = baseY - b.h;
        ctx.fillStyle = `rgb(${L.col[0]},${L.col[1]},${L.col[2]})`;
        ctx.fillRect(x, y, b.w, b.h);
        if (b.tiers) {
          for (let i = 1; i <= b.tiers; i++) {
            const tw = b.w * (1 - i * 0.25);
            ctx.fillRect(x + (b.w - tw) / 2, y - i * 14, tw, 14);
          }
        }
        if (b.antenna) {
          ctx.fillRect(x + b.w / 2 - 1, y - b.antenna - b.tiers * 14, 2, b.antenna);
          const blink = Math.sin(t * 3 + b.x) > 0.6;
          if (blink) {
            ctx.fillStyle = "#ff2d55";
            ctx.fillRect(x + b.w / 2 - 2, y - b.antenna - b.tiers * 14 - 2, 4, 4);
          }
        }
        if (b.stripe) {
          ctx.fillStyle = b.stripe;
          ctx.globalAlpha = 0.55 * L.depth + 0.2;
          ctx.fillRect(x, y, 2, b.h);
          ctx.globalAlpha = 1;
        }
        for (const w of b.windows) {
          if (w.flick && Math.sin(t * 7 + w.x * 13) > 0.3) continue;
          ctx.fillStyle = w.warm ? "rgba(255,190,110,0.75)" : "rgba(120,220,255,0.65)";
          ctx.fillRect(x + w.x, y + w.y, 3, 4);
        }
      }
    }
  }

  function drawMegaTower(m) {
    const isHi = highlight === m.code;
    const x = m.px, w = m.pw, h = m.ph;
    const top = H - h;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 + m.px);

    ctx.save();
    // กลีบแสงขึ้นฟ้า
    const beamA = isHi ? 0.35 : highlight ? 0.04 : 0.1;
    const bg = ctx.createLinearGradient(0, 0, 0, top);
    bg.addColorStop(0, "rgba(0,0,0,0)");
    bg.addColorStop(1, hexA(m.color, beamA + pulse * 0.05));
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(x - 4, top);
    ctx.lineTo(x + 4, top);
    ctx.lineTo(x + (isHi ? 60 : 25), 0);
    ctx.lineTo(x - (isHi ? 60 : 25), 0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = m.color;
    ctx.shadowBlur = isHi ? 30 : 12;
    ctx.fillStyle = "#0b0820";
    ctx.strokeStyle = hexA(m.color, highlight && !isHi ? 0.35 : 0.95);
    ctx.lineWidth = isHi ? 2.5 : 1.5;

    ctx.beginPath();
    if (m.shape === "spire") {
      ctx.moveTo(x - w / 2, H);
      ctx.lineTo(x - w / 2.6, top + h * 0.25);
      ctx.lineTo(x - w / 6, top + h * 0.08);
      ctx.lineTo(x, top - h * 0.12);
      ctx.lineTo(x + w / 6, top + h * 0.08);
      ctx.lineTo(x + w / 2.6, top + h * 0.25);
      ctx.lineTo(x + w / 2, H);
    } else if (m.shape === "dome") {
      ctx.moveTo(x - w / 2, H);
      ctx.lineTo(x - w / 2, top + w / 2);
      ctx.arc(x, top + w / 2, w / 2, Math.PI, 0);
      ctx.lineTo(x + w / 2, H);
    } else if (m.shape === "needle") {
      ctx.moveTo(x - w / 2, H);
      ctx.lineTo(x - w / 3, top + h * 0.3);
      ctx.lineTo(x - w / 2.2, top + h * 0.22);
      ctx.lineTo(x - w / 5, top);
      ctx.lineTo(x - 2, top - h * 0.18);
      ctx.lineTo(x + 2, top - h * 0.18);
      ctx.lineTo(x + w / 5, top);
      ctx.lineTo(x + w / 2.2, top + h * 0.22);
      ctx.lineTo(x + w / 3, top + h * 0.3);
      ctx.lineTo(x + w / 2, H);
    } else if (m.shape === "arena") {
      ctx.moveTo(x - w / 2, H);
      ctx.lineTo(x - w / 2, top + h * 0.35);
      ctx.quadraticCurveTo(x - w / 2, top, x, top);
      ctx.quadraticCurveTo(x + w / 2, top, x + w / 2, top + h * 0.35);
      ctx.lineTo(x + w / 2, H);
    } else {
      // forge — ตึกขั้นบันได + ปล่องพลังงาน
      ctx.moveTo(x - w / 2, H);
      ctx.lineTo(x - w / 2, top + h * 0.3);
      ctx.lineTo(x - w / 4, top + h * 0.3);
      ctx.lineTo(x - w / 4, top + h * 0.05);
      ctx.lineTo(x - w / 10, top + h * 0.05);
      ctx.lineTo(x - w / 10, top - h * 0.08);
      ctx.lineTo(x + w / 10, top - h * 0.08);
      ctx.lineTo(x + w / 10, top + h * 0.05);
      ctx.lineTo(x + w / 4, top + h * 0.05);
      ctx.lineTo(x + w / 4, top + h * 0.2);
      ctx.lineTo(x + w / 2, top + h * 0.2);
      ctx.lineTo(x + w / 2, H);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // เส้นแสงแนวนอนวิ่งขึ้น
    ctx.fillStyle = hexA(m.color, 0.5);
    const rows = 14;
    for (let i = 0; i < rows; i++) {
      const yy = H - ((i * h) / rows + ((t * 30) % (h / rows)));
      if (yy < top + 10) continue;
      ctx.globalAlpha = 0.25 + 0.5 * ((i % 3) / 3);
      ctx.fillRect(x - w * 0.3, yy, w * 0.6, 1.5);
    }
    ctx.globalAlpha = 1;

    // วงแหวนโฮโลแกรม
    const ry = top + h * 0.18;
    ctx.strokeStyle = hexA(m.color, isHi ? 0.9 : 0.45);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < (isHi ? 3 : 1); i++) {
      ctx.beginPath();
      ctx.ellipse(x, ry - i * 14 + Math.sin(t * 2 + i) * 3, w * (0.9 + i * 0.25), w * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ไฟยอดตึก
    ctx.fillStyle = m.color;
    ctx.shadowColor = m.color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, top - h * 0.12 - 4, 3 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCars(dt) {
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      c.x += c.v * dt;
      if (c.x < -100 || c.x > W + 100) cars[i] = newCar(false);
      const g = ctx.createLinearGradient(c.x, 0, c.x - Math.sign(c.v) * c.len, 0);
      g.addColorStop(0, c.c);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(c.x, c.x - Math.sign(c.v) * c.len), c.y, c.len, 2);
    }
  }

  function drawGround() {
    const gy = H - 2;
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, gy, W, 2);
    // ไฮเปอร์ลูปเรืองแสงด้านล่าง
    const g = ctx.createLinearGradient(0, H - 40, 0, H);
    g.addColorStop(0, "rgba(255,90,31,0)");
    g.addColorStop(1, "rgba(255,90,31,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, H - 40, W, 40);
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  let last = performance.now();
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    drawSky();
    drawLayer(layers[0]);
    drawCars(dt);
    drawLayer(layers[1]);
    for (const m of megaTowers) drawMegaTower(m);
    drawLayer(layers[2]);
    drawGround();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => {
    clearTimeout(window.__cityResize);
    window.__cityResize = setTimeout(build, 150);
  });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) {
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });

  build();
  requestAnimationFrame(frame);

  window.City = {
    highlight(code) { highlight = code || null; },
  };
})();
