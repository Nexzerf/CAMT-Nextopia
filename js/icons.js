/* ==========================================================
   CAMT NEXTOPIA — ชุดไอคอน (วาดเอง, เส้น 2px บนกริด 24×24)
   ใช้ได้ทั้งเป็น <svg> ใน HTML และวาดลง canvas ผ่าน Path2D
   ========================================================== */
const ICONS = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 18l-6-6 6-6",
  // ของรางวัล
  clicker1: "M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 7.5a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM10.5 17h3",
  clicker3: "M9 2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 5.5v.01M12 9.5v.01M12 13.5v.01M10.5 18h3",
  bag: "M4.5 8h15l-1.2 13H5.7L4.5 8zM9 11V6a3 3 0 0 1 6 0v5",
  mug: "M6 4h12l-1.6 17H7.6L6 4zM6.6 9.5h10.8M14 4l1.5-2.5",
  heart: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z",
  gift: "M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7C9 7 7.5 6 7.5 4.6S9.5 2.4 12 7zM12 7c3 0 4.5-1 4.5-2.4S14.5 2.4 12 7z",
  // สาขา
  code: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16",
  chart: "M3 21h18M6 17v-5M11 17V7M16 17v-8M21 4l-5 4-5-3-6 4",
  film: "M3 8h18v12H3zM3 8l3-4h3L6 8M10 8l3-4h3l-3 4M17 8l3-4M10 12l5 2.5-5 2.5z",
  gamepad: "M7 8h10a5 5 0 0 1 5 5v1.5a2.5 2.5 0 0 1-4.6 1.4L16 14H8l-1.4 1.9A2.5 2.5 0 0 1 2 14.5V13a5 5 0 0 1 5-5zM7.5 10.5v4M5.5 12.5h4M16 11.5v.01M18 13.5v.01",
  robot: "M5 9h14v11H5zM12 4v5M12 3.5v.01M9 13.5v.01M15 13.5v.01M9.5 17h5M2.5 13v3M21.5 13v3",
  // UI
  share: "M12 15V3M7.5 7.5L12 3l4.5 4.5M5 12v8h14v-8",
  download: "M12 3v12M7.5 10.5L12 15l4.5-4.5M5 20h14",
  dice: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 8.5v.01M15.5 15.5v.01M15.5 8.5v.01M8.5 15.5v.01M12 12v.01",
  city: "M3 21h18M5 21V9l5-3v15M10 21V11h9v10M7.5 11v.01M7.5 15v.01M13 14h3M13 17.5h3M14.5 11V7",
  check: "M5 12.5l4.5 4.5L19 7",
  x: "M6 6l12 12M18 6L6 18",
  alert: "M12 9v4.5M12 17v.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  wifi: "M2 8.5a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16.2a5 5 0 0 1 6 0M12 19.5v.01",
  user: "M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8zM4 21a8 8 0 0 1 16 0",
  pin: "M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 1 0 0 5z",
  lock: "M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  refresh: "M20 11a8 8 0 0 0-14.3-4.3L4 9M4 4v5h5M4 13a8 8 0 0 0 14.3 4.3L20 15M20 20v-5h-5",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14",
  eye_off: "M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c5.5 0 9 6 9 6a16 16 0 0 1-2.6 3.3M6.6 6.6C4 8.3 3 12 3 12s3.5 6 9 6a9 9 0 0 0 4.4-1.1M9.9 10a3 3 0 0 0 4.2 4.2",
  sound: "M4 9v6h4l5 4V5L8 9H4zM16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11",
};

/* <svg> สำหรับใส่ใน HTML */
function icon(name, size = 20, cls = "") {
  const d = ICONS[name] || ICONS.x;
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}

/* วาดไอคอนลง canvas: (cx, cy) = จุดกึ่งกลาง, size = ความกว้างเป็น px */
function drawIcon(ctx, name, cx, cy, size, color, lineWidth = 2) {
  const d = ICONS[name];
  if (!d || typeof Path2D === "undefined") return;
  const s = size / 24;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(d));
  ctx.restore();
}

/* แทน <i data-ic="name"> ทั้งหน้าเป็น svg */
function hydrateIcons(root = document) {
  root.querySelectorAll("[data-ic]").forEach((el) => {
    el.outerHTML = icon(el.dataset.ic, Number(el.dataset.size) || 20, el.className || "");
  });
}
