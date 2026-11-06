/* ==========================================================
   CAMT NEXTOPIA — ตัวควบคุมหลัก
   ========================================================== */
(function () {
  const ADMIN_PIN = "2026"; // เปลี่ยน PIN สตาฟได้ที่นี่
  const ORDER = ["SE", "MMIT", "ANI", "DG", "DII"];
  const $ = (id) => document.getElementById(id);

  const state = {
    name: "",
    idx: 0,
    answers: [], // index ของตัวเลือกที่ตอบในแต่ละข้อ
    shuffled: [], // ลำดับตัวเลือกที่สุ่มแล้วต่อข้อ
    result: null,
    scores: null,
    rotation: 0,
    spinning: false,
    canSpinThisRound: false,
  };

  /* ---------- เสียง (WebAudio สั้น ๆ ไม่ต้องโหลดไฟล์) ---------- */
  let actx = null;
  function beep(freq = 600, dur = 0.05, type = "square", vol = 0.04) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g).connect(actx.destination);
      o.start();
      o.stop(actx.currentTime + dur);
    } catch (e) {}
  }

  /* ---------- นำทางหน้าจอ ---------- */
  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- INTRO ---------- */
  $("btn-start").addEventListener("click", () => {
    state.name = $("nickname").value.trim().slice(0, 20);
    beep(880, 0.08, "sine", 0.05);
    startStory();
  });
  $("nickname").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("btn-start").click();
  });

  /* ---------- STORY (typewriter) ---------- */
  let typingTimer = null;
  function startStory() {
    show("s-story");
    City.highlight(null);
    const who = state.name ? `คุณ${state.name}` : "พลเมืองใหม่";
    const text =
      `สวัสดี ${who} ฉันคือ CAMI — AI ผู้ดูแลนครเนกซ์โทเปีย\n\n` +
      `เมืองนี้มี 5 เขตยักษ์ แต่ละเขตต้องการพลังที่ต่างกัน ` +
      `ตั้งแต่หอคอยโค้ด อารีน่าเกม สตูดิโอแอนิเมชัน ศูนย์ธุรกิจ ไปจนถึงโรงงานอัตโนมัติ\n\n` +
      `ตอบตามใจตัวเองใน 6 โซนข้างหน้า แล้วฉันจะบอกว่าคุณคือพลเมืองแบบไหน!`;
    const el = $("story-text");
    const btn = $("btn-story");
    btn.disabled = true;
    el.textContent = "";
    let i = 0;
    clearInterval(typingTimer);
    typingTimer = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i % 3 === 0) beep(1200 + Math.random() * 200, 0.015, "square", 0.012);
      if (i >= text.length) {
        clearInterval(typingTimer);
        btn.disabled = false;
      }
    }, 22);
    // แตะเพื่อข้าม
    el.onclick = () => {
      clearInterval(typingTimer);
      el.textContent = text;
      btn.disabled = false;
    };
  }
  $("btn-story").addEventListener("click", () => {
    state.idx = 0;
    state.answers = [];
    state.shuffled = QUESTIONS.map((q) => shuffle(q.options.map((_, i) => i)));
    renderQuestion();
    show("s-quiz");
  });

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- QUIZ ---------- */
  function renderQuestion() {
    const q = QUESTIONS[state.idx];
    $("q-zone").textContent = `ZONE ${String(state.idx + 1).padStart(2, "0")} · ${q.zone}`;
    $("q-count").textContent = `${state.idx + 1}/${QUESTIONS.length}`;
    $("q-progress").style.width = `${(state.idx / QUESTIONS.length) * 100}%`;
    $("q-text").textContent = q.q;
    const box = $("q-options");
    box.innerHTML = "";
    state.shuffled[state.idx].forEach((oi, n) => {
      const b = document.createElement("button");
      b.className = "option";
      b.style.animationDelay = `${n * 60}ms`;
      b.innerHTML = `<span class="opt-key">${"ABCDE"[n]}</span><span>${escapeHTML(q.options[oi].t)}</span>`;
      if (state.answers[state.idx] === oi) b.classList.add("chosen");
      b.addEventListener("click", () => choose(oi, b));
      box.appendChild(b);
    });
    $("btn-back").style.visibility = state.idx === 0 ? "hidden" : "visible";
    const panel = document.querySelector(".quiz");
    panel.classList.remove("enter");
    void panel.offsetWidth;
    panel.classList.add("enter");
  }

  let choosing = false;
  function choose(oi, el) {
    if (choosing) return;
    choosing = true;
    state.answers[state.idx] = oi;
    el.classList.add("chosen");
    beep(520 + state.idx * 40, 0.06, "triangle", 0.05);
    setTimeout(() => {
      choosing = false;
      if (state.idx < QUESTIONS.length - 1) {
        state.idx++;
        renderQuestion();
      } else {
        $("q-progress").style.width = "100%";
        runScan();
      }
    }, 260);
  }
  $("btn-back").addEventListener("click", () => {
    if (state.idx > 0) {
      state.idx--;
      renderQuestion();
    }
  });

  /* ---------- คำนวณผล ---------- */
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
    // เสมอกัน → ดูคำตอบข้อหลัง ๆ (ความฝันในอนาคต) เป็นตัวตัดสิน
    for (let i = QUESTIONS.length - 1; i >= 0; i--) {
      const a = state.answers[i];
      const pts = QUESTIONS[i].options[a].s;
      const best = top.find((k) => pts[k] >= 3);
      if (best) return best;
    }
    return top[0];
  }

  /* ---------- SCAN ---------- */
  function runScan() {
    show("s-scan");
    const logs = [
      "กำลังเชื่อมต่อ Neural Link...",
      "อ่านคลื่นความคิดสร้างสรรค์...",
      "วิเคราะห์ตรรกะ & ความชอบ...",
      "เทียบกับฐานข้อมูล 5 เขตของเมือง...",
      "พบตัวตนของคุณแล้ว!",
    ];
    const el = $("scan-log");
    el.textContent = "";
    let i = 0;
    const timer = setInterval(() => {
      el.textContent = logs[i];
      beep(300 + i * 150, 0.08, "sawtooth", 0.025);
      ORDER.forEach((k, n) => n === i && City.highlight(k));
      i++;
      if (i >= logs.length) {
        clearInterval(timer);
        setTimeout(showResult, 650);
      }
    }, 600);
  }

  /* ---------- RESULT ---------- */
  function showResult() {
    const s = computeScores();
    const code = pickResult(s);
    const m = MAJORS[code];
    state.result = code;
    state.scores = s;
    state.canSpinThisRound = true;
    City.highlight(code);

    const card = $("result-card");
    card.style.setProperty("--c", m.color);
    card.style.setProperty("--c2", m.color2);
    $("r-hello").textContent = state.name ? `ผลการสแกนตัวตนของ ${state.name}` : "ผลการสแกนตัวตน";
    $("r-icon").textContent = m.icon;
    $("r-district").textContent = `${m.district} · ${m.districtTH}`;
    $("r-persona").textContent = m.persona;
    $("r-persona-th").textContent = `"${m.personaTH}" — ${m.tagline}`;
    $("r-major-th").textContent = `สาขาวิชา${m.nameTH}`;
    $("r-major-en").textContent = m.nameEN;
    $("r-program").textContent = m.program;
    $("r-desc").textContent = m.desc;
    $("r-subjects").innerHTML = m.subjects.map((x) => `<li>${escapeHTML(x)}</li>`).join("");
    $("r-careers").innerHTML = m.careers.map((x) => `<li>${escapeHTML(x)}</li>`).join("");

    const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
    const sorted = [...ORDER].sort((a, b) => s[b] - s[a]);
    $("r-bars").innerHTML = sorted
      .map((k) => {
        const mm = MAJORS[k];
        const pct = Math.round((s[k] / total) * 100);
        return `<div class="bar" style="--c:${mm.color}">
          <span class="bar-label">${mm.icon} ${escapeHTML(mm.nameEN)}</span>
          <span class="bar-track"><i data-w="${pct}"></i></span>
          <b>${pct}%</b></div>`;
      })
      .join("");
    $("r-facts").innerHTML = CAMT_FACTS.map((f) => `<div><b>${f.k}</b><span>${f.v}</span></div>`).join("");
    $("r-perks").innerHTML = CAMT_PERKS.map((p) => `<li>${escapeHTML(p)}</li>`).join("");

    show("s-result");
    beep(660, 0.1, "sine", 0.06);
    setTimeout(() => beep(990, 0.15, "sine", 0.06), 120);
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll("#r-bars i").forEach((i) => (i.style.width = i.dataset.w + "%"));
      }, 200);
    });
  }

  $("btn-retry").addEventListener("click", () => {
    City.highlight(null);
    show("s-intro");
  });
  $("btn-to-wheel").addEventListener("click", openWheel);
  $("btn-wheel-back").addEventListener("click", () => show("s-result"));

  /* ---------- WHEEL ---------- */
  async function openWheel() {
    show("s-wheel");
    const wheel = $("wheel");
    Prize.drawWheel(wheel, state.rotation);
    await Prize.loadConfig();
    Prize.drawWheel(wheel, state.rotation);
    renderPrizeList();
    updateSpinButton();
  }

  function renderPrizeList() {
    const ps = Prize.getPrizes();
    $("prize-list").innerHTML = ps
      .map((p) => {
        const out = !p.enabled || p.left <= 0;
        return `<li class="${out ? "out" : ""}"><span>${p.emoji}</span>${escapeHTML(p.name)}<small>${
          out ? "หมดแล้ว" : `${p.stock} รางวัล`
        }</small></li>`;
      })
      .join("");
  }

  function updateSpinButton() {
    const btn = $("btn-spin");
    const sub = $("wheel-sub");
    if (Prize.mode() === "personal" && Prize.hasSpun()) {
      const last = Prize.lastSpin();
      btn.disabled = true;
      btn.textContent = "✓";
      sub.innerHTML = last && last.prizeId
        ? `เครื่องนี้หมุนไปแล้ว — คุณได้ <b>${escapeHTML(last.prizeName)}</b> (รหัส ${escapeHTML(last.code)}) <button class="link" id="show-claim">ดูรหัสรับรางวัล</button>`
        : "เครื่องนี้หมุนไปแล้ว 1 ครั้ง ขอบคุณที่มาร่วมสนุกนะ 💖";
      const sc = $("show-claim");
      if (sc) sc.onclick = () => openModal(last, true);
      return;
    }
    if (Prize.mode() === "kiosk" && !state.canSpinThisRound) {
      btn.disabled = true;
      btn.textContent = "✓";
      sub.textContent = "รอบนี้หมุนไปแล้ว — ให้คนถัดไปเล่นตอบคำถามก่อนนะ";
      return;
    }
    btn.disabled = false;
    btn.textContent = "SPIN";
    sub.textContent = "หมุนได้ 1 ครั้ง ลุ้นของรางวัลจาก CAMT!";
  }

  $("btn-spin").addEventListener("click", async () => {
    if (state.spinning) return;
    if (Prize.hasSpun()) return updateSpinButton();
    if (Prize.mode() === "kiosk" && !state.canSpinThisRound) return updateSpinButton();
    state.spinning = true;
    $("btn-spin").disabled = true;

    await Prize.loadConfig(); // โหลดค่าล่าสุด (กรณีสตาฟปิดรางวัลที่หมด)
    const prize = Prize.draw();
    const resultId = prize ? prize.id : "thx";
    const now = new Date();
    const entry = {
      time: now.toISOString(),
      name: state.name || "-",
      major: state.result || "-",
      prizeId: prize ? prize.id : null,
      prizeName: prize ? prize.name : "ขอบคุณจ้า",
      emoji: prize ? prize.emoji : "💖",
      code: prize ? Prize.code(prize.id) : "",
    };
    // บันทึกก่อนเริ่มหมุน กันการรีเฟรชหน้าเพื่อหมุนใหม่
    if (prize) Prize.recordWin(prize);
    Prize.addHistory(entry);
    Prize.markSpun(entry);
    state.canSpinThisRound = false;

    const start = state.rotation;
    const end = Prize.targetRotation(resultId, start);
    const dur = 5200 + Math.random() * 800;
    const t0 = performance.now();
    const n = Prize.SEGMENTS.length;
    let lastSeg = -1;
    const wheel = $("wheel");

    function ease(x) { return 1 - Math.pow(1 - x, 4); }
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      state.rotation = start + (end - start) * ease(p);
      Prize.drawWheel(wheel, state.rotation);
      const seg = Math.floor(((state.rotation / (Math.PI * 2)) * n) % n);
      if (seg !== lastSeg) {
        lastSeg = seg;
        beep(1400, 0.012, "square", 0.03);
      }
      if (p < 1) requestAnimationFrame(step);
      else {
        state.spinning = false;
        state.rotation = end % (Math.PI * 2);
        openModal(entry, false);
        renderPrizeList();
        updateSpinButton();
      }
    }
    requestAnimationFrame(step);
  });

  /* ---------- MODAL ---------- */
  let clockTimer = null;
  function openModal(entry, replay) {
    const win = !!entry.prizeId;
    $("m-emoji").textContent = entry.emoji;
    $("modal-card").classList.toggle("win", win);
    if (win) {
      $("m-title").textContent = replay ? "รางวัลของคุณ" : "ยินดีด้วย! 🎉";
      $("m-desc").innerHTML = `คุณได้รับ <b>${escapeHTML(entry.prizeName)}</b>`;
      $("m-claim").hidden = false;
      $("m-code").textContent = entry.code;
      clearInterval(clockTimer);
      const tick = () => {
        const won = new Date(entry.time).toLocaleString("th-TH");
        $("m-time").textContent = `ได้รับเมื่อ ${won} · เวลาปัจจุบัน ${new Date().toLocaleTimeString("th-TH")}`;
      };
      tick();
      clockTimer = setInterval(tick, 1000);
      if (!replay) {
        confetti();
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, "sine", 0.07), i * 120));
      }
    } else {
      const msg = Prize.THANKS[Math.floor(Math.random() * Prize.THANKS.length)];
      $("m-title").textContent = msg;
      $("m-desc").textContent = "รอบนี้ยังไม่ได้รางวัล แต่ขอบคุณที่มาเที่ยวนครเนกซ์โทเปียนะ แล้วเจอกันที่ CAMT มช.!";
      $("m-claim").hidden = true;
      $("confetti").innerHTML = "";
      beep(330, 0.2, "sine", 0.05);
    }
    $("modal").hidden = false;
  }
  $("btn-modal-ok").addEventListener("click", () => {
    $("modal").hidden = true;
    clearInterval(clockTimer);
  });

  function confetti() {
    const box = $("confetti");
    box.innerHTML = "";
    const colors = ["#ff5a1f", "#ffb800", "#00e5ff", "#ff3df2", "#39ff88"];
    for (let i = 0; i < 80; i++) {
      const s = document.createElement("i");
      s.style.left = Math.random() * 100 + "%";
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = Math.random() * 0.6 + "s";
      s.style.animationDuration = 1.8 + Math.random() * 1.5 + "s";
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      box.appendChild(s);
    }
  }

  /* ---------- ADMIN (แตะโลโก้ 5 ครั้ง) ---------- */
  let taps = 0, tapTimer = null;
  $("brand").addEventListener("click", () => {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => (taps = 0), 1500);
    if (taps >= 5) {
      taps = 0;
      openAdmin();
    }
  });
  if (location.hash === "#staff") setTimeout(openAdmin, 300);

  function openAdmin() {
    $("admin").hidden = false;
    $("admin-lock").hidden = false;
    $("admin-body").hidden = true;
    $("admin-pin").value = "";
    setTimeout(() => $("admin-pin").focus(), 50);
  }
  $("admin-close").addEventListener("click", () => ($("admin").hidden = true));
  $("admin-unlock").addEventListener("click", unlockAdmin);
  $("admin-pin").addEventListener("keydown", (e) => e.key === "Enter" && unlockAdmin());

  async function unlockAdmin() {
    if ($("admin-pin").value !== ADMIN_PIN) {
      $("admin-pin").classList.add("shake");
      setTimeout(() => $("admin-pin").classList.remove("shake"), 400);
      return;
    }
    $("admin-lock").hidden = true;
    $("admin-body").hidden = false;
    await Prize.loadConfig();
    renderAdmin();
  }

  function renderAdmin() {
    $("admin-kiosk").checked = Prize.mode() === "kiosk";
    const ps = Prize.getPrizes();
    $("admin-prizes").innerHTML = ps
      .map(
        (p) => `<tr data-id="${p.id}">
        <td>${p.emoji} ${escapeHTML(p.name)}</td>
        <td><input type="number" min="0" step="1" class="a-stock" value="${p.stock}"></td>
        <td>${p.given}</td>
        <td><b>${p.left}</b></td>
        <td><input type="number" min="0" max="100" step="0.05" class="a-chance" value="${p.chance}"></td>
        <td><input type="checkbox" class="a-enabled" ${p.enabled ? "checked" : ""}></td>
      </tr>`
      )
      .join("");
    const totalWin = ps.reduce((a, p) => a + p.effective, 0);
    $("admin-odds").textContent =
      `โอกาสได้รางวัลรวมต่อการหมุน ≈ ${totalWin.toFixed(2)}% (ประมาณ 1 ใน ${totalWin > 0 ? Math.round(100 / totalWin) : "∞"} คน) · ` +
      `ที่เหลือ ${(100 - totalWin).toFixed(2)}% = ขอบคุณจ้า`;

    const h = Prize.read(Prize.LS.history, []);
    const wins = h.filter((x) => x.prizeId).length;
    $("admin-stats").textContent = `หมุนทั้งหมด ${h.length} ครั้ง · ได้รางวัล ${wins} ครั้ง`;
    $("admin-history").innerHTML =
      h
        .slice(0, 200)
        .map(
          (x) => `<div class="${x.prizeId ? "w" : ""}"><span>${new Date(x.time).toLocaleString("th-TH")}</span>
          <span>${escapeHTML(x.name)}</span><span>${escapeHTML(x.major)}</span>
          <span>${x.emoji} ${escapeHTML(x.prizeName)}</span><span>${escapeHTML(x.code || "")}</span></div>`
        )
        .join("") || `<p class="muted small">ยังไม่มีประวัติ</p>`;
  }

  $("admin-kiosk").addEventListener("change", (e) => {
    Prize.setMode(e.target.checked ? "kiosk" : "personal");
    if (e.target.checked) Prize.resetSpinLock();
    updateSpinButton();
  });
  $("admin-save").addEventListener("click", () => {
    const ov = {};
    document.querySelectorAll("#admin-prizes tr").forEach((tr) => {
      ov[tr.dataset.id] = {
        stock: Math.max(0, parseInt(tr.querySelector(".a-stock").value, 10) || 0),
        chance: Math.min(100, Math.max(0, parseFloat(tr.querySelector(".a-chance").value) || 0)),
        enabled: tr.querySelector(".a-enabled").checked,
      };
    });
    Prize.write(Prize.LS.overrides, ov);
    renderAdmin();
    renderPrizeList();
  });
  $("admin-reset-given").addEventListener("click", () => {
    if (!confirm("รีเซ็ตยอดที่แจกไปแล้วในเครื่องนี้ใช่ไหม?")) return;
    Prize.write(Prize.LS.given, {});
    renderAdmin();
    renderPrizeList();
  });
  $("admin-reset-ov").addEventListener("click", () => {
    Prize.write(Prize.LS.overrides, {});
    renderAdmin();
    renderPrizeList();
  });
  $("admin-unlock-spin").addEventListener("click", () => {
    Prize.resetSpinLock();
    state.canSpinThisRound = true;
    updateSpinButton();
    alert("ปลดล็อกแล้ว เครื่องนี้หมุนได้อีก 1 ครั้ง");
  });
  $("admin-export").addEventListener("click", () => {
    const h = Prize.read(Prize.LS.history, []);
    const rows = [["time", "name", "major", "prize", "code"]].concat(
      h.map((x) => [x.time, x.name, x.major, x.prizeName, x.code])
    );
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `nextopia-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  });

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  window.addEventListener("resize", () => {
    if ($("s-wheel").classList.contains("active")) Prize.drawWheel($("wheel"), state.rotation);
  });
})();
