/* ==========================================================
   CAMT NEXTOPIA — การ์ดแชร์ลงสตอรี่ (1080×1920)
   มือถือ: เปิดแผ่นแชร์ของระบบ (เลือก Instagram / Facebook Story ได้)
   คอม / เบราว์เซอร์ที่แชร์ไฟล์ไม่ได้: ดาวน์โหลดเป็น PNG
   ========================================================== */
const ShareCard = (function () {
  const W = 1080, H = 1920;
  const PAPER = "#F4F1EC", INK = "#161616", ORANGE = "#F15A24";

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxW) {
    // ตัดบรรทัดภาษาไทย: ใช้ Intl.Segmenter ถ้ามี ไม่งั้นตัดตามช่องว่าง
    const words = typeof Intl !== "undefined" && Intl.Segmenter
      ? [...new Intl.Segmenter("th", { granularity: "word" }).segment(text)].map((s) => s.segment)
      : text.split(/(\s+)/);
    const lines = [];
    let cur = "";
    for (const w of words) {
      if (ctx.measureText(cur + w).width > maxW && cur) { lines.push(cur.trim()); cur = w.trimStart(); }
      else cur += w;
    }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
  }

  async function render({ nickname, major, look }) {
    const m = MAJORS[major];
    try {
      await Promise.all([
        document.fonts.load('700 80px "Prompt"'),
        document.fonts.load('400 40px "IBM Plex Sans Thai"'),
        document.fonts.load('600 40px "IBM Plex Sans Thai"'),
        document.fonts.load('32px "Silkscreen"'),
      ]);
    } catch (e) { /* ใช้ฟอนต์สำรอง */ }

    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    // พื้นหลัง
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);

    // หัว: ป้ายดำแบบเดียวกับเว็บ
    ctx.fillStyle = INK;
    rr(ctx, 70, 90, 600, 92, 46); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(116, 136, 30, 0, Math.PI * 2); ctx.fill();
    drawIcon(ctx, "arrow", 116, 136, 34, INK, 2.4);
    ctx.font = '32px "Silkscreen", monospace';
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("CAMT NEXTOPIA 2099", 166, 138);

    ctx.fillStyle = INK;
    ctx.font = '600 40px "IBM Plex Sans Thai", sans-serif';
    ctx.fillText("พลเมืองหมายเลขใหม่ของเมือง", 72, 270);

    // การ์ดสีประจำเขต
    const cardY = 330, cardH = 1000;
    ctx.fillStyle = m.color;
    rr(ctx, 60, cardY, W - 120, cardH, 48); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();

    // ลายพิกเซลเมืองด้านล่างการ์ด
    ctx.save();
    rr(ctx, 60, cardY, W - 120, cardH, 48); ctx.clip();
    ctx.fillStyle = Avatar.shade(m.color, 0.82);
    const blocks = [120, 260, 180, 320, 140, 230, 300, 160, 210];
    blocks.forEach((h, i) => ctx.fillRect(60 + i * 110, cardY + cardH - h, 96, h));
    ctx.fillStyle = INK;
    ctx.fillRect(60, cardY + cardH - 40, W - 120, 40);
    ctx.restore();

    // ตัวละคร
    const scale = 26;
    const aw = Avatar.W * scale, ah = Avatar.H * scale;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(Avatar.sprite(look, 0, m.color === "#E9A319" ? "#B67A00" : m.color), (W - aw) / 2, cardY + cardH - 40 - ah, aw, ah);
    ctx.imageSmoothingEnabled = true;

    // ไอคอนสาขามุมบน
    ctx.fillStyle = PAPER;
    ctx.beginPath(); ctx.arc(170, cardY + 110, 62, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    drawIcon(ctx, m.icon, 170, cardY + 110, 70, INK, 2);
    ctx.textAlign = "right";
    ctx.fillStyle = m.ink;
    ctx.font = '40px "Silkscreen", monospace';
    ctx.fillText(m.district, W - 110, cardY + 112);

    // ชื่อ + persona
    ctx.textAlign = "left";
    ctx.fillStyle = INK;
    let y = cardY + cardH + 110;
    ctx.font = '700 92px "Prompt", sans-serif';
    ctx.fillText(nickname, 72, y);
    y += 92;
    ctx.font = '600 44px "IBM Plex Sans Thai", sans-serif';
    ctx.fillStyle = ORANGE;
    ctx.fillText(`${m.persona} · ${m.personaTH}`, 72, y);

    // สาขา
    y += 86;
    ctx.fillStyle = INK;
    ctx.font = '400 36px "IBM Plex Sans Thai", sans-serif';
    ctx.fillText("สาขาที่ใช่", 72, y);
    y += 62;
    ctx.font = '700 52px "Prompt", sans-serif';
    for (const line of wrapText(ctx, `สาขาวิชา${m.nameTH}`, W - 150).slice(0, 2)) { ctx.fillText(line, 72, y); y += 66; }

    // ท้าย
    ctx.fillStyle = INK;
    ctx.fillRect(0, H - 120, W, 120);
    ctx.fillStyle = "#fff";
    ctx.font = '600 34px "IBM Plex Sans Thai", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("วิทยาลัยศิลปะ สื่อ และเทคโนโลยี มช.", 72, H - 60);
    ctx.textAlign = "right";
    ctx.fillStyle = ORANGE;
    ctx.font = '30px "Silkscreen", monospace';
    ctx.fillText(location.host || "CAMT", W - 72, H - 58);

    return c;
  }

  function toBlob(canvas) {
    return new Promise((res) => canvas.toBlob(res, "image/png"));
  }

  /* คืน "shared" | "downloaded" | "cancelled" */
  async function share(data) {
    const canvas = await render(data);
    const blob = await toBlob(canvas);
    const file = new File([blob], `nextopia-${data.major.toLowerCase()}.png`, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "CAMT NEXTOPIA", text: "ฉันคือพลเมือง CAMT NEXTOPIA แล้วคุณล่ะ?" });
        return "shared";
      } catch (e) {
        if (e && e.name === "AbortError") return "cancelled";
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "downloaded";
  }

  return { render, share };
})();
