import { ICONS, ICON_SIZE, PAL, type IconName } from "@/lib/icons";

const pathCache = new Map<IconName, { fill: string; d: string }[]>();

/** รวมพิกเซลสีเดียวกันที่ติดกันในแถวเป็นเส้นเดียว ให้ SVG เล็กและคม */
function paths(name: IconName) {
  let p = pathCache.get(name);
  if (p) return p;
  const byColor = new Map<string, string[]>();
  ICONS[name].forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (PAL[ch]) {
        const list = byColor.get(PAL[ch]) ?? [];
        list.push(`M${x} ${y}h${end - x}v1h${x - end}z`);
        byColor.set(PAL[ch], list);
      }
      x = end;
    }
  });
  p = [...byColor].map(([fill, d]) => ({ fill, d: d.join("") }));
  pathCache.set(name, p);
  return p;
}

/** ไอคอนพิกเซลวาดเอง (แทนอิโมจิ) ขนาดเริ่มต้นเท่าตัวอักษร */
export default function PixelIcon({ name, size, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={`pxi${className ? ` ${className}` : ""}`}
      viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}
      style={size ? { width: size, height: size } : undefined}
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
    >
      {paths(name).map((p) => (
        <path key={p.fill} fill={p.fill} d={p.d} />
      ))}
    </svg>
  );
}
