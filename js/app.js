/* ==========================================================
   CAMT NEXTOPIA — ตัวควบคุมหลัก
   intro → สร้างตัวละคร → ด่านเข้าเมือง → คำถาม → สแกน → ผลลัพธ์
   → (แชร์สตอรี่ / ดูบ้านในเมือง / หมุนวงล้อ)
   ========================================================== */
(function () {
  const ORDER = ["SE", "MMIT", "ANI", "DG", "DII"];
  const $ = (id) => document.getElementById(id);
  const LS_PROFILE = "nx_profile_v1";

  const saved = load(LS_PROFILE) || {};
  const state = {
    look: saved.look || Avatar.randomLook(),
    nickname: saved.nickname || "",
    result: saved.result || null,
    residentId: saved.residentId || null,
    idx: 0,
    answers: [],
    shuffled: [],
    scores: null,
    rotation: 0,
    spinning: false,
    canSpinThisRound: false,
    kioskRound: null,
    cityFrom: "s-intro",
  };

  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function saveProfile() { save(LS_PROFILE, { look: state.look, nickname: state.nickname, result: state.result, residentId: state.residentId }); }

  function escapeHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- เสียงสั้น ๆ ---------- */
  let actx = null;
  function beep(freq = 600, dur = 0.05, type = "square", vol = 0.03) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
    } catch (e) {}
  }

  /* ---------- นำทาง ---------- */
  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo({ top: 0 });
    City.setMode(id === "s-city" ? "explore" : "ambient");
  }
  document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => show(b.dataset.go)));

  /* ---------- พลเมืองในเมือง ---------- */
  let cityData = { total: 0, counts: {}, residents: [] };
  async function refreshCity() {
    try {
      const d = await Prize.residents(160);
      if (d && Array.isArray(d.residents)) {
        cityData = d;
        City.setResidents(d.residents);
        $("pop-count").textContent = d.total;
        renderHudDistricts();
      }
    } catch (e) {
      $("pop-count").textContent = "–";
    }
  }
  refreshCity();
  setInterval(() => { if (!document.hidden) refreshCity(); }, 20000);

  /* ---------- INTRO ---------- */
  $("district-strip").innerHTML = ORDER.map((k) => {
    const m = MAJORS[k];
    return `<li style="--c:${m.color};--k:${m.ink}">${icon(m.icon, 20)}<span>${m.district.replace(" ", "<br>")}</span></li>`;
  }).join("");

  $("btn-start").addEventListener("click", () => {
    beep(880, 0.06, "triangle");
    openCreator();
  });
  $("btn-peek").addEventListener("click", () => openCity("s-intro"));

  /* ---------- CREATE ---------- */
  const OPTS = {
    skin: { n: 5, swatch: (i) => Avatar.SKIN[i] },
    hair_color: { n: 10, swatch: (i) => Avatar.HAIR[i] },
    hair: { n: 8, names: Avatar.HAIR_NAMES },
    top: { n: 4, names: Avatar.TOP_NAMES },
    acc: { n: 6, names: Avatar.ACC_NAMES },
  };

  function openCreator() {
    $("nickname").value = state.nickname;
    $("nick-error").textContent = "";
    if (Prize.isKiosk()) {
      // เครื่องบูธ: แต่ละรอบเป็นคนใหม่
      state.kioskRound = Date.now().toString(36);
      state.look = Avatar.randomLook();
      state.residentId = null;
      $("nickname").value = "";
    }
    renderCreator();
    show("s-create");
  }

  function renderCreator() {
    Avatar.paint($("avatar-preview"), state.look, { scale: 12 });
    for (const key of Object.keys(OPTS)) {
      const o = OPTS[key];
      const box = $("opt-" + key);
      box.innerHTML = "";
      for (let i = 0; i < o.n; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-pressed", String(state.look[key] === i));
        if (o.swatch) {
          b.className = "swatch";
          b.style.setProperty("--c", o.swatch(i));
          b.setAttribute("aria-label", `${key} ${i + 1}`);
        } else {
          b.className = "chip";
          const c = document.createElement("canvas");
          c.width = 36; c.height = 48;
          c.style.width = "27px"; c.style.height = "36px";
          Avatar.paint(c, { ...state.look, [key]: i }, { scale: 2 });
          b.appendChild(c);
          const s = document.createElement("span");
          s.textContent = o.names[i];
          b.appendChild(s);
        }
        b.addEventListener("click", () => {
          state.look[key] = i;
          beep(700 + i * 40, 0.03, "square", 0.02);
          renderCreator();
        });
        box.appendChild(b);
      }
    }
  }

  $("btn-random").addEventListener("click", () => {
    state.look = Avatar.randomLook();
    beep(500, 0.05, "triangle");
    renderCreator();
  });

  $("btn-create-next").addEventListener("click", () => {
    const nick = $("nickname").value.trim().replace(/\s+/g, " ");
    if (!nick) {
      $("nick-error").textContent = "ใส่ชื่อเล่นก่อนนะ จะได้มีป้ายชื่อในเมือง";
      $("nickname").focus();
      return;
    }
    state.nickname = nick.slice(0, 16);
    saveProfile();
    startStory();
  });
  $("nickname").addEventListener("keydown", (e) => e.key === "Enter" && $("btn-create-next").click());
  $("nickname").addEventListener("input", () => ($("nick-error").textContent = ""));

  /* ---------- ARRIVAL ---------- */
  let typingTimer = null;
  function startStory() {
    show("s-story");
    Avatar.paint($("arrival-avatar"), state.look, { scale: 4 });
    const text =
      `ยินดีต้อนรับสู่ Nextopia คุณ${state.nickname}\n\n` +
      `เมืองนี้มี 5 เขต แต่ละเขตคือ 1 สาขาของ CAMT ` +
      `ตอบ 6 คำถามตามใจตัวเอง แล้วเมืองจะจัดบ้านให้ในเขตที่ใช่ที่สุด`;
    const el = $("story-text"), btn = $("btn-story");
    btn.disabled = true;
    el.textContent = "";
    let i = 0;
    clearInterval(typingTimer);
    typingTimer = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i % 3 === 0) beep(1100, 0.012, "square", 0.01);
      if (i >= text.length) { clearInterval(typingTimer); btn.disabled = false; }
    }, 20);
    el.onclick = () => { clearInterval(typingTimer); el.textContent = text; btn.disabled = false; };
  }
  $("btn-story").addEventListener("click", () => {
    state.idx = 0;
    state.answers = [];
    state.shuffled = QUESTIONS.map((q) => shuffle(q.options.map((_, i) => i)));
    buildTrack();
    renderQuestion();
    show("s-quiz");
  });

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------- QUIZ ---------- */
  function buildTrack() {
    const track = $("quiz-track");
    track.querySelectorAll(".node").forEach((n) => n.remove());
    for (let i = 0; i <= QUESTIONS.length; i++) {
      const n = document.createElement("i");
      n.className = "node";
      n.style.left = `${6 + (i / QUESTIONS.length) * 88}%`;
      track.appendChild(n);
    }
  }

  let walkTimer = null;
  function moveWalker() {
    const w = $("quiz-walker");
    w.style.left = `${6 + (state.idx / QUESTIONS.length) * 88}%`;
    $("quiz-track").querySelectorAll(".node").forEach((n, i) => n.classList.toggle("done", i < state.idx));
    let f = 0, steps = 0;
    clearInterval(walkTimer);
    walkTimer = setInterval(() => {
      f = f === 1 ? 2 : 1;
      Avatar.paint(w, state.look, { scale: 2, frame: steps++ > 5 ? 0 : f });
      if (steps > 6) clearInterval(walkTimer);
    }, 80);
  }

  function renderQuestion() {
    const q = QUESTIONS[state.idx];
    $("q-zone").textContent = `ZONE ${String(state.idx + 1).padStart(2, "0")} · ${q.zone}`;
    $("q-count").textContent = `${state.idx + 1}/${QUESTIONS.length}`;
    $("q-text").textContent = q.q;
    const box = $("q-options");
    box.innerHTML = "";
    state.shuffled[state.idx].forEach((oi, n) => {
      const b = document.createElement("button");
      b.className = "option";
      b.style.animationDelay = `${n * 40}ms`;
      const k = document.createElement("span");
      k.className = "opt-key";
      k.textContent = "ABCDE"[n];
      const t = document.createElement("span");
      t.textContent = q.options[oi].t;
      b.append(k, t);
      if (state.answers[state.idx] === oi) b.classList.add("chosen");
      b.addEventListener("click", () => choose(oi, b));
      box.appendChild(b);
    });
    $("btn-back").style.visibility = state.idx === 0 ? "hidden" : "visible";
    moveWalker();
  }

  let choosing = false;
  function choose(oi, el) {
    if (choosing) return;
    choosing = true;
    state.answers[state.idx] = oi;
    el.classList.add("chosen");
    beep(520 + state.idx * 60, 0.06, "triangle", 0.04);
    setTimeout(() => {
      choosing = false;
      if (state.idx < QUESTIONS.length - 1) { state.idx++; renderQuestion(); }
      else { state.idx = QUESTIONS.length; moveWalker(); setTimeout(runScan, 350); }
    }, 240);
  }
  $("btn-back").addEventListener("click", () => { if (state.idx > 0) { state.idx--; renderQuestion(); } });

  function computeScores() {
    const s = { SE: 0, MMIT: 0, ANI: 0, DG: 0, DII: 0 };
    QUESTIONS.forEach((q, i) => {
      const a = state.answers[i];
      if (a == null) return;
      const pts = q.options[a].s;
      for (const k in pts) s[k] += pts[k];
    });
    return s;
  }
  function pickResult(s) {
    const max = Math.max(...Object.values(s));
    const top = ORDER.filter((k) => s[k] === max);
    if (top.length === 1) return top[0];
    for (let i = QUESTIONS.length - 1; i >= 0; i--) {
      const pts = QUESTIONS[i].options[state.answers[i]].s;
      const best = top.find((k) => pts[k] >= 3);
      if (best) return best;
    }
    return top[0];
  }

  /* ---------- SCAN ---------- */
  function runScan() {
    show("s-scan");
    Avatar.paint($("scan-avatar"), state.look, { scale: 4 });
    const s = computeScores();
    const code = pickResult(s);
    const logs = ["อ่านคำตอบทั้ง 6 โซน", "เทียบกับ 5 เขตของเมือง", "หาบ้านที่ว่างในเขต", "ได้ที่อยู่แล้ว"];
    let i = 0;
    const timer = setInterval(() => {
      $("scan-log").textContent = logs[i];
      beep(300 + i * 160, 0.07, "square", 0.02);
      if (i < ORDER.length) City.focus(ORDER[(i + 2) % 5]);
      i++;
      if (i >= logs.length) {
        clearInterval(timer);
        City.focus(code);
        setTimeout(() => showResult(code, s), 500);
      }
    }, 520);
  }

  /* ---------- RESULT ---------- */
  function showResult(code, s) {
    const m = MAJORS[code];
    state.result = code;
    state.scores = s;
    state.canSpinThisRound = true;
    saveProfile();

    const card = $("result-card");
    card.style.setProperty("--c", m.color);
    card.style.setProperty("--k", m.ink);
    Avatar.paint($("result-avatar"), state.look, { scale: 6, color: m.color, y: 240 - Avatar.H * 6 });
    $("r-district").innerHTML = `${icon(m.icon, 14)} ${escapeHTML(m.district)}`;
    $("r-name").textContent = `${state.nickname} ย้ายเข้าเขต ${m.districtTH}`;
    $("r-persona").textContent = m.persona;
    $("r-persona-th").textContent = `${m.personaTH} — ${m.tagline}`;
    $("r-major-th").textContent = `สาขาวิชา${m.nameTH}`;
    $("r-major-en").textContent = m.nameEN;
    $("r-program").textContent = m.program;
    $("r-desc").textContent = m.desc;
    $("r-subjects").innerHTML = m.subjects.map((x) => `<li>${escapeHTML(x)}</li>`).join("");
    $("r-careers").innerHTML = m.careers.map((x) => `<li>${escapeHTML(x)}</li>`).join("");

    const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
    $("r-bars").innerHTML = [...ORDER].sort((a, b) => s[b] - s[a]).map((k) => {
      const mm = MAJORS[k];
      const pct = Math.round((s[k] / total) * 100);
      return `<div class="bar" style="--c:${mm.color};--k:${mm.ink}" title="${escapeHTML(mm.nameEN)}">
        <span class="bar-icon">${icon(mm.icon, 16)}</span>
        <span class="bar-track"><i data-w="${pct}"></i></span><b>${pct}%</b></div>`;
    }).join("");
    $("r-facts").innerHTML = CAMT_FACTS.map((f) => `<div><b>${escapeHTML(f.k)}</b><span>${escapeHTML(f.v)}</span></div>`).join("");
    $("r-perks").innerHTML = CAMT_PERKS.map((p) => `<li>${icon("check", 16)}${escapeHTML(p)}</li>`).join("");

    show("s-result");
    [523, 784].forEach((f, i) => setTimeout(() => beep(f, 0.12, "triangle", 0.05), i * 110));
    setTimeout(() => document.querySelectorAll("#r-bars i").forEach((i) => (i.style.width = i.dataset.w + "%")), 250);

    joinCity(code);
  }

  async function joinCity(code) {
    const note = $("join-note");
    note.className = "join-note";
    note.textContent = "กำลังย้ายเข้าเมือง...";
    City.setMe({ id: state.residentId || "me", nickname: state.nickname, major: code, look: state.look });
    try {
      const r = await Prize.join(state.look, state.nickname, code, Prize.isKiosk() ? state.kioskRound : null);
      state.residentId = r.id;
      saveProfile();
      City.setMe({ id: r.id, nickname: r.nickname, major: code, look: state.look });
      note.textContent = `ย้ายเข้าเมืองแล้ว — ตอนนี้ ${state.nickname} อยู่ในเขต ${MAJORS[code].district}`;
      refreshCity();
    } catch (e) {
      const msg = String((e && e.message) || "");
      note.className = "join-note bad";
      note.textContent = /not allowed/.test(msg)
        ? "ชื่อนี้ใช้ในเมืองไม่ได้ ลองเปลี่ยนชื่อเล่นแล้วเล่นใหม่นะ (ตัวละครยังเห็นในเครื่องนี้)"
        : /busy/.test(msg)
        ? "คนย้ายเข้าเมืองเยอะมาก ลองใหม่อีกสักครู่"
        : "เชื่อมต่อเมืองไม่ได้ตอนนี้ แต่ผลลัพธ์ของคุณยังอยู่ครบ";
    }
  }

  $("btn-retry").addEventListener("click", openCreator);
  $("btn-to-wheel").addEventListener("click", openWheel);
  $("btn-to-city").addEventListener("click", () => openCity("s-result"));

  $("btn-share").addEventListener("click", async () => {
    const btn = $("btn-share");
    btn.disabled = true;
    try {
      const r = await ShareCard.share({ nickname: state.nickname, major: state.result, look: state.look });
      if (r === "downloaded") toast("บันทึกรูปแล้ว เปิดแอป IG/FB แล้วลงสตอรี่ได้เลย");
    } catch (e) {
      toast("สร้างรูปไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- CITY (explore) ---------- */
  function openCity(from) {
    state.cityFrom = from;
    show("s-city");
    const hasMe = !!state.result;
    $("btn-find-me").hidden = !hasMe;
    $("btn-city-wheel").hidden = !hasMe;
    $("btn-city-start").hidden = hasMe;
    if (hasMe) setTimeout(() => City.focusMe(), 50);
    renderHudDistricts();
    refreshCity();
  }

  function renderHudDistricts() {
    $("city-total").textContent = cityData.total || 0;
    $("hud-districts").innerHTML = ORDER.map((k) => {
      const m = MAJORS[k];
      return `<button data-d="${k}" style="--c:${m.color};--k:${m.ink}">${icon(m.icon, 16)}${escapeHTML(m.district)} <b>${(cityData.counts && cityData.counts[k]) || 0}</b></button>`;
    }).join("");
    $("hud-districts").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => City.focus(b.dataset.d)));
  }

  $("btn-city-back").addEventListener("click", () => show(state.cityFrom));
  $("btn-find-me").addEventListener("click", () => City.focusMe());
  $("btn-city-wheel").addEventListener("click", openWheel);
  $("btn-city-start").addEventListener("click", openCreator);
  City.onSelect((r) => toast(`${r.nickname} · ${MAJORS[r.major] ? MAJORS[r.major].district : ""}`));

  let toastTimer = null;
  function toast(msg) {
    const t = $("city-toast");
    t.textContent = msg;
    t.hidden = false;
    t.style.position = "fixed";
    if (!$("s-city").classList.contains("active")) document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  /* ---------- WHEEL ---------- */
  async function openWheel() {
    show("s-wheel");
    const wheel = $("wheel");
    Prize.drawWheel(wheel, state.rotation);
    updateSpinButton();
    renderPrizeList(null);
    const st = await Prize.loadStatus();
    Prize.drawWheel(wheel, state.rotation);
    renderPrizeList(st.ok);
  }
  $("btn-wheel-back").addEventListener("click", () => show(state.result ? "s-result" : "s-intro"));

  function renderPrizeList(online) {
    $("prize-list").innerHTML = Prize.getPrizes().map((p) => {
      const out = !p.available;
      const label = out ? "หมด" : online ? `${p.left}/${p.stock}` : `${p.stock}`;
      return `<li class="${out ? "out" : ""}">${icon(p.id, 22)}<span>${escapeHTML(p.name)}</span><small>${label}</small></li>`;
    }).join("");
  }

  function setSpinUI(enabled, label, sub) {
    const btn = $("btn-spin");
    btn.disabled = !enabled;
    btn.textContent = label;
    if (sub != null) $("wheel-sub").textContent = sub;
  }

  function updateSpinButton() {
    if (state.spinning) return;
    if (!state.result) {
      setSpinUI(false, "หมุน", "ตอบคำถามให้จบก่อน แล้วค่อยมาหมุนนะ");
      return;
    }
    if (Prize.hasSpun()) {
      const last = Prize.lastSpin();
      setSpinUI(false, "หมุนแล้ว");
      const sub = $("wheel-sub");
      if (last && last.prize_id) {
        sub.innerHTML = `เครื่องนี้หมุนไปแล้ว — คุณได้ <b>${escapeHTML(last.prize_name)}</b> · <button class="link" id="show-claim">ดูรหัสรับรางวัล</button>`;
        $("show-claim").onclick = () => openModal(last, true);
      } else {
        sub.textContent = "เครื่องนี้หมุนไปแล้ว 1 ครั้ง ขอบคุณที่มาเที่ยวเมืองนะ";
      }
      return;
    }
    if (Prize.isKiosk() && !state.canSpinThisRound) {
      setSpinUI(false, "หมุนแล้ว", "รอบนี้หมุนไปแล้ว ให้คนถัดไปสร้างตัวละครก่อนนะ");
      return;
    }
    setSpinUI(true, "หมุน", Prize.isKiosk() ? "โหมดบูธ · 1 รอบเล่น หมุนได้ 1 ครั้ง" : "หมุนได้ 1 ครั้ง ลุ้นของรางวัลจาก CAMT");
  }

  $("btn-spin").addEventListener("click", async () => {
    if (state.spinning || !state.result) return;
    if (Prize.hasSpun() || (Prize.isKiosk() && !state.canSpinThisRound)) return updateSpinButton();
    state.spinning = true;
    setSpinUI(false, "...", "กำลังเชื่อมต่อ...");

    const wheel = $("wheel");
    let waiting = true, lastT = performance.now();
    (function idle(now) {
      if (!waiting) return;
      state.rotation += ((now - lastT) / 1000) * 6;
      lastT = now;
      Prize.drawWheel(wheel, state.rotation);
      requestAnimationFrame(idle);
    })(lastT);

    let r;
    try {
      r = await Prize.spin(state.nickname, state.result);
    } catch (e) {
      waiting = false;
      state.spinning = false;
      const msg = String((e && e.message) || "");
      if (/already spun/.test(msg)) setSpinUI(false, "หมุนแล้ว", "เครื่องนี้หมุนไปแล้ว");
      else if (/kiosk pin/.test(msg)) { Prize.setKiosk(null); setSpinUI(true, "หมุน", "PIN โหมดบูธไม่ถูกต้อง ปิดโหมดบูธแล้ว ลองหมุนอีกครั้ง"); }
      else setSpinUI(true, "หมุน", `เชื่อมต่อไม่ได้ (${msg.slice(0, 60) || "network"}) — ลองกดหมุนอีกครั้ง`);
      return;
    }
    waiting = false;

    const entry = {
      prize_id: r.prize_id || null,
      prize_name: r.prize_id ? r.prize_name : "ขอบคุณจ้า",
      code: r.code || "",
      time: r.time || new Date().toISOString(),
    };
    if (!Prize.isKiosk()) Prize.markSpun(entry);
    state.canSpinThisRound = false;

    if (r.already) {
      state.spinning = false;
      updateSpinButton();
      openModal(entry, true);
      return;
    }

    const start = state.rotation;
    const end = Prize.targetRotation(entry.prize_id || "thx", start);
    const dur = 5200 + Math.random() * 800;
    const t0 = performance.now();
    const n = Prize.SEGMENTS.length;
    let lastSeg = -1;
    const ease = (x) => 1 - Math.pow(1 - x, 4);
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      state.rotation = start + (end - start) * ease(p);
      Prize.drawWheel(wheel, state.rotation);
      const seg = Math.floor(((state.rotation / (Math.PI * 2)) * n) % n);
      if (seg !== lastSeg) { lastSeg = seg; beep(1300, 0.012, "square", 0.025); }
      if (p < 1) requestAnimationFrame(step);
      else {
        state.spinning = false;
        state.rotation = end % (Math.PI * 2);
        openModal(entry, false);
        updateSpinButton();
        Prize.loadStatus().then((st) => renderPrizeList(st.ok));
      }
    })(t0);
  });

  /* ---------- MODAL ---------- */
  let clockTimer = null;
  function openModal(entry, replay) {
    const win = !!entry.prize_id;
    $("modal-card").classList.toggle("win", win);
    $("m-icon").innerHTML = icon(win ? entry.prize_id : "heart", 48);
    if (win) {
      $("m-title").textContent = replay ? "รางวัลของคุณ" : "ได้รางวัล!";
      $("m-desc").innerHTML = `คุณได้รับ <b>${escapeHTML(entry.prize_name)}</b>`;
      $("m-claim").hidden = false;
      $("m-code").textContent = entry.code;
      clearInterval(clockTimer);
      const tick = () => {
        $("m-time").textContent = `ได้เมื่อ ${new Date(entry.time).toLocaleString("th-TH")} · ตอนนี้ ${new Date().toLocaleTimeString("th-TH")}`;
      };
      tick();
      clockTimer = setInterval(tick, 1000);
      if (!replay) [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.16, "triangle", 0.06), i * 110));
    } else {
      const msg = Prize.THANKS[Math.floor(Math.random() * Prize.THANKS.length)];
      $("m-title").textContent = msg;
      $("m-desc").textContent = "รอบนี้ยังไม่ได้ของรางวัล แต่ขอบคุณที่มาเที่ยว Nextopia นะ เจอกันที่ CAMT มช.";
      $("m-claim").hidden = true;
      beep(330, 0.18, "triangle", 0.04);
    }
    $("modal").hidden = false;
  }
  $("btn-modal-ok").addEventListener("click", () => { $("modal").hidden = true; clearInterval(clockTimer); });

  /* ---------- STAFF CONSOLE (แตะโลโก้ 5 ครั้ง หรือเปิด /#staff) ---------- */
  let adminPin = null, taps = 0, tapTimer = null;
  $("brand").addEventListener("click", () => {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => (taps = 0), 1500);
    if (taps >= 5) { taps = 0; openAdmin(); }
  });
  if (location.hash === "#staff") setTimeout(openAdmin, 300);
  window.addEventListener("hashchange", () => location.hash === "#staff" && openAdmin());

  function openAdmin() {
    $("admin").hidden = false;
    $("admin-lock").hidden = false;
    $("admin-body").hidden = true;
    $("admin-pin").value = "";
    $("admin-msg").textContent = "";
    setTimeout(() => $("admin-pin").focus(), 50);
  }
  $("admin-close").addEventListener("click", () => { $("admin").hidden = true; adminPin = null; });
  $("admin-unlock").addEventListener("click", unlockAdmin);
  $("admin-pin").addEventListener("keydown", (e) => e.key === "Enter" && unlockAdmin());

  function adminError(e) {
    const m = String((e && e.message) || e);
    $("admin-msg").textContent = /invalid pin/.test(m) ? "PIN ไม่ถูกต้อง"
      : /too many/.test(m) ? "ใส่ PIN ผิดหลายครั้งเกินไป รอ 5 นาที"
      : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: " + m;
  }

  async function unlockAdmin() {
    const pin = $("admin-pin").value.trim();
    $("admin-msg").textContent = "กำลังตรวจสอบ...";
    try {
      const data = await Prize.admin(pin, "status");
      adminPin = pin;
      $("admin-msg").textContent = "";
      $("admin-lock").hidden = true;
      $("admin-body").hidden = false;
      renderAdmin(data);
    } catch (e) {
      $("admin-pin").classList.add("shake");
      setTimeout(() => $("admin-pin").classList.remove("shake"), 400);
      adminError(e);
    }
  }

  async function adminCall(action, payload) {
    $("admin-status").textContent = "กำลังบันทึก...";
    try {
      const data = await Prize.admin(adminPin, action, payload);
      renderAdmin(data);
      $("admin-status").textContent = "อัปเดตแล้ว " + new Date().toLocaleTimeString("th-TH");
      return data;
    } catch (e) {
      $("admin-status").textContent = "";
      adminError(e);
      throw e;
    }
  }

  function renderAdmin(data) {
    $("admin-kiosk").checked = Prize.isKiosk();
    const ps = data.prizes || [];
    $("admin-prizes").innerHTML = ps.map((p) => `<tr data-id="${escapeHTML(p.id)}">
        <td>${icon(p.id, 18)} ${escapeHTML(p.name)}</td>
        <td><input type="number" min="0" step="1" class="a-stock" value="${Number(p.stock)}"></td>
        <td>${Number(p.given)}</td>
        <td><b>${Number(p.left)}</b></td>
        <td><input type="number" min="0" max="100" step="0.05" class="a-chance" value="${Number(p.chance)}"></td>
        <td><input type="checkbox" class="a-enabled" ${p.enabled ? "checked" : ""}></td>
      </tr>`).join("");
    const totalWin = ps.reduce((a, p) => a + (p.enabled && p.left > 0 ? Number(p.chance) : 0), 0);
    $("admin-odds").textContent = `โอกาสได้รางวัลรวมตอนนี้ ≈ ${totalWin.toFixed(2)}% (ประมาณ 1 ใน ${totalWin > 0 ? Math.round(100 / totalWin) : "∞"} คน) · รางวัลที่หมดจะไม่ออกอีกอัตโนมัติ`;

    const by = data.by_major || {};
    const majors = Object.keys(by).map((k) => `${k} ${by[k]}`).join(" · ");
    $("admin-stats").textContent = `หมุนทั้งหมด ${data.total_spins} ครั้ง · ได้รางวัล ${data.total_wins} ครั้ง${majors ? " · " + majors : ""}`;
    $("admin-history").innerHTML = (data.recent || []).map((x) => `<div class="${x.prize_id ? "w" : ""}"><span>${new Date(x.time).toLocaleString("th-TH")}</span>
        <span>${escapeHTML(x.name || "-")}</span><span>${escapeHTML(x.major || "-")}</span>
        <span>${x.prize_id ? escapeHTML(x.prize_name) : "ขอบคุณจ้า"}</span>
        <span>${escapeHTML(x.code || "")}${x.claimed_at ? " · รับแล้ว" : ""}</span></div>`).join("") || `<p class="muted small" style="padding:8px 10px">ยังไม่มีประวัติ</p>`;

    $("admin-res-stats").textContent = `พลเมืองทั้งหมด ${data.residents_total || 0} คน`;
    $("admin-residents").innerHTML = (data.residents || []).map((r) => {
      const m = MAJORS[r.major] || {};
      return `<div><i class="dot" style="--c:${m.color || "#999"}"></i><span>${escapeHTML(r.nickname)}</span><span class="muted small">${escapeHTML(r.major)}</span>
        <button class="pill ghost small" data-hide="${escapeHTML(r.id)}">${icon("eye_off", 14)}<span>ซ่อน</span></button></div>`;
    }).join("") || `<p class="muted small" style="padding:8px 10px">ยังไม่มีพลเมือง</p>`;
    $("admin-residents").querySelectorAll("[data-hide]").forEach((b) => b.addEventListener("click", () => {
      if (!confirm("ซ่อนตัวละครนี้จากเมือง?")) return;
      adminCall("hide_resident", { id: b.dataset.hide }).then(refreshCity).catch(() => {});
    }));

    if (data.lookup !== undefined) renderLookup(data.lookup);
  }

  function renderLookup(l) {
    const box = $("admin-lookup");
    if (!l) { box.innerHTML = `<b class="bad">${icon("x", 16)} ไม่พบรหัสนี้ — อาจเป็นรหัสปลอม</b>`; return; }
    box.innerHTML =
      `<b class="${l.claimed_at ? "warn" : "good"}">${icon(l.claimed_at ? "alert" : "check", 16)} ${l.claimed_at ? "รหัสนี้รับของไปแล้ว" : "รหัสถูกต้อง ยังไม่ได้รับของ"}</b>` +
      `<span>${escapeHTML(l.prize_name || "-")} · ${escapeHTML(l.name || "-")} · ${new Date(l.time).toLocaleString("th-TH")}</span>` +
      (l.claimed_at ? `<span>รับไปเมื่อ ${new Date(l.claimed_at).toLocaleString("th-TH")}</span>`
        : `<button class="pill primary small" id="admin-claim"><span>มอบของแล้ว</span></button>`);
    const btn = $("admin-claim");
    if (btn) btn.onclick = () => adminCall("claim", { code: l.code }).then(checkCode).catch(() => {});
  }

  async function checkCode() {
    const code = $("admin-code").value.trim().toUpperCase();
    if (!code) return;
    try { renderAdmin(await Prize.admin(adminPin, "status", { code })); } catch (e) { adminError(e); }
  }
  $("admin-check").addEventListener("click", checkCode);
  $("admin-code").addEventListener("keydown", (e) => e.key === "Enter" && checkCode());
  $("admin-refresh").addEventListener("click", () => adminCall("status").catch(() => {}));

  $("admin-kiosk").addEventListener("change", (e) => {
    Prize.setKiosk(e.target.checked ? adminPin : null);
    if (e.target.checked) { Prize.resetSpinLock(); state.canSpinThisRound = !!state.result; }
    updateSpinButton();
  });

  $("admin-save").addEventListener("click", () => {
    const prizes = [...document.querySelectorAll("#admin-prizes tr")].map((tr) => ({
      id: tr.dataset.id,
      stock: Math.max(0, parseInt(tr.querySelector(".a-stock").value, 10) || 0),
      chance: Math.min(100, Math.max(0, parseFloat(tr.querySelector(".a-chance").value) || 0)),
      enabled: tr.querySelector(".a-enabled").checked,
    }));
    adminCall("update_prizes", { prizes }).then(() => Prize.loadStatus()).then((st) => renderPrizeList(st.ok)).catch(() => {});
  });

  $("admin-reset-all").addEventListener("click", () => {
    if (!confirm("ล้างประวัติการหมุน ยอดแจก และพลเมืองทั้งหมดของทุกเครื่อง?\n(ใช้ก่อนเริ่มงานจริงเท่านั้น)")) return;
    if (prompt("พิมพ์คำว่า RESET เพื่อยืนยัน") !== "RESET") return;
    adminCall("reset_all").then(refreshCity).catch(() => {});
  });

  $("admin-unlock-spin").addEventListener("click", () => {
    Prize.resetSpinLock();
    state.canSpinThisRound = !!state.result;
    updateSpinButton();
    alert("ล้างการจำในเบราว์เซอร์แล้ว (ถ้าเครื่องนี้เคยหมุนในโหมดปกติ เซิร์ฟเวอร์จะยังแสดงผลเดิม — ใช้โหมดบูธแทน)");
  });

  $("admin-export").addEventListener("click", async () => {
    try {
      const data = await Prize.admin(adminPin, "status", { limit: 20000 });
      const rows = [["time", "name", "major", "prize", "code", "claimed_at", "kiosk"]].concat(
        (data.recent || []).map((x) => [x.time, x.name || "", x.major || "", x.prize_name || "ขอบคุณจ้า", x.code || "", x.claimed_at || "", x.kiosk])
      );
      const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = `nextopia-history-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (e) { adminError(e); }
  });

  window.addEventListener("resize", () => { if ($("s-wheel").classList.contains("active")) Prize.drawWheel($("wheel"), state.rotation); });

  hydrateIcons();
  // ผู้เล่นที่เคยมีตัวละครแล้ว: ให้เห็นตัวเองในเมืองทันที
  if (state.result && state.nickname) City.setMe({ id: state.residentId || "me", nickname: state.nickname, major: state.result, look: state.look });
})();
