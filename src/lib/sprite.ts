/**
 * ตัวละคร pixel สไตล์ sprite เดินในเกม RPG ยุค DS (หัวโต ผมฟูหลายทรง ตัวเล็ก ขาสั้น ตาเป็นจุด)
 * มีเส้นขอบเข้มรอบตัว แรเงาอัตโนมัติ (แสงมาจากซ้ายบน) และเดินได้ 4 ทิศ
 * วาดซ้อนชั้น: ผมด้านหลัง → ร่าง/เพศ → ชุด → หน้า → ผมด้านหน้า → หมวก → อุปกรณ์ประจำอาชีพ
 * ใช้ร่วมกันทั้งหน้ามือถือ การ์ดสตอรี่ และจอใหญ่
 *
 * พิกัดภายในใช้ช่วง x 0–21, y 0–27 (ยอดผม y 0, เท้า y 25, เงา y 26–27)
 * ตารางจริงมีขอบเผื่อ 2 px ทุกด้าน สำหรับเส้นขอบเข้มและขอบขาวแบบสติกเกอร์
 */

export type Gender = "m" | "f" | "x";
/** ทิศที่หัน: down = หันหน้า, up = หันหลัง, side = หันขวา (หันซ้ายใช้กลับด้านภาพ) */
export type Dir = "down" | "up" | "side";

export interface Look {
  gender: Gender;
  hair: number; // 0–19 ทรงผม
  hairColor: number; // 0–11
  skin: number; // 0–3
}

const PAD = 2;
const IW = 22;
const IH = 28;
export const SPRITE_W = IW + PAD * 2; // 26
export const SPRITE_H = IH + PAD * 2; // 32
/** แถวของเท้า (ใช้ตั้ง anchor บนจอใหญ่) */
export const FEET_Y = 25 + PAD;
/** ลำดับเฟรมเดิน 4 จังหวะ: ก้าวซ้าย → ยืน → ก้าวขวา → ยืน */
export const WALK_CYCLE = [1, 0, 2, 0];

export const SKIN_TONES = ["#ffe1cc", "#f6c7a1", "#d89a6a", "#a7693f"];
// 6 สีแรกคงลำดับเดิมไว้ ข้อมูลเก่าในฐานข้อมูลจะได้หน้าตาเหมือนเดิม
export const HAIR_COLORS = [
  "#2d2632",
  "#5b3626",
  "#a8693f",
  "#f0c25a",
  "#f08db6",
  "#c9cdda",
  "#f08a3a",
  "#d8343c",
  "#8e5bd8",
  "#3f6fe0",
  "#2fb3a0",
  "#6cc04a",
];
export const HAIR_COLOR_NAMES = ["ดำ", "น้ำตาลเข้ม", "คาราเมล", "บลอนด์", "ชมพู", "เทาเงิน", "ส้ม", "แดง", "ม่วง", "น้ำเงิน", "มิ้นต์", "เขียว"];
export const GENDERS: { id: Gender; label: string }[] = [
  { id: "m", label: "ชาย" },
  { id: "f", label: "หญิง" },
  { id: "x", label: "ไม่ระบุ" },
];

export const DEFAULT_LOOK: Look = { gender: "x", hair: 2, hairColor: 3, skin: 0 };

const OUTLINE = "#241820";
const STICKER = "#ffffff";

// ---------------------------------------------------------------- สี
function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function mixHex(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${((c[0] << 16) | (c[1] << 8) | c[2]).toString(16).padStart(6, "0")}`;
}
interface Tone {
  l: string;
  b: string;
  d: string;
  dd: string;
}
/** 4 ระดับสี: สว่าง / ปกติ / เงา / เงาลึก (เงาอมม่วงเล็กน้อยให้ดูนุ่มแบบเกม) */
const tone = (b: string): Tone => ({
  l: mixHex(b, "#fff6e0", 0.45),
  b,
  d: mixHex(b, "#2a1838", 0.3),
  dd: mixHex(b, "#2a1838", 0.52),
});

// ---------------------------------------------------------------- ตาราง pixel
class Grid {
  readonly px: (string | null)[] = new Array(SPRITE_W * SPRITE_H).fill(null);
  /** เลื่อนชั่วคราว (ใช้วาดชุดที่เขียนด้วยพิกัดลำตัวเดิม และย้ายของถือในท่าหันข้าง) */
  dx = 0;
  dy = 0;
  set(x: number, y: number, c: string | null) {
    const gx = x + PAD + this.dx;
    const gy = y + PAD + this.dy;
    if (gx < 0 || gy < 0 || gx >= SPRITE_W || gy >= SPRITE_H) return;
    this.px[gy * SPRITE_W + gx] = c;
  }
  get(x: number, y: number): string | null {
    const gx = x + PAD + this.dx;
    const gy = y + PAD + this.dy;
    if (gx < 0 || gy < 0 || gx >= SPRITE_W || gy >= SPRITE_H) return null;
    return this.px[gy * SPRITE_W + gx];
  }
  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  row(y: number, x1: number, x2: number, c: string) {
    for (let x = x1; x <= x2; x++) this.set(x, y, c);
  }
  col(x: number, y1: number, y2: number, c: string) {
    for (let y = y1; y <= y2; y++) this.set(x, y, c);
  }
  /** เติมเส้นขอบรอบรูปทรง (เฉพาะช่องว่างที่ติดกับ pixel ทึบ 4 ทิศ) */
  ring(color: string) {
    const src = this.px.slice();
    for (let gy = 0; gy < SPRITE_H; gy++) {
      for (let gx = 0; gx < SPRITE_W; gx++) {
        if (src[gy * SPRITE_W + gx]) continue;
        const n =
          (gx > 0 && src[gy * SPRITE_W + gx - 1]) ||
          (gx < SPRITE_W - 1 && src[gy * SPRITE_W + gx + 1]) ||
          (gy > 0 && src[(gy - 1) * SPRITE_W + gx]) ||
          (gy < SPRITE_H - 1 && src[(gy + 1) * SPRITE_W + gx]);
        if (n) this.px[gy * SPRITE_W + gx] = color;
      }
    }
  }
}

// ---------------------------------------------------------------- ทรงผม (วาดเป็นแม่แบบ pixel)
/*
 * แม่แบบมองจากด้านหน้า กว้าง 22 ช่อง หรือเขียนแค่ครึ่งซ้าย 11 ช่องแล้วสะท้อนเป็นอีกข้าง
 *   .  ว่าง           #  ผม (แรเงาอัตโนมัติ)      l b d k  ผมระบุโทนเอง (สว่าง/ปกติ/เงา/เงาลึก)
 *   %  ผมที่อยู่หลังตัว (เช่น ผมยาวข้างไหล่ หางแกละ)
 *   A  สีเครื่องประดับ/หมวก   a  สีเครื่องประดับโทนเข้ม   X  เครื่องประดับที่อยู่หลังหัว   W  สีขาว
 * มุมมองหลังและข้างสร้างจากแม่แบบหน้า (เติมกะโหลกจนถึงแถว nape) แล้วซ้อนส่วนเสริมเฉพาะทรง
 */
interface HairDef {
  name: string;
  rows: string[];
  /** แถวล่างสุดของผมด้านหลังศีรษะ */
  nape: number;
  /** ผมยาวด้านหลังลงมาถึงแถวนี้ (มองจากหลัง/ข้าง) */
  backLen?: number;
  /** ช่วงกว้างของผมยาวด้านหลัง */
  backW?: [number, number];
  /** มองจากหลังแล้วยังเห็นผมที่อยู่หลังตัว (หางแกละ) */
  backKeep?: boolean;
  backRows?: string[];
  /** แม่แบบด้านหลังวาดเองทั้งหัว (แทนที่ตัวที่สร้างอัตโนมัติ) */
  backFull?: string[];
  sideRows?: string[];
  /** สีเครื่องประดับ/หมวก (ไม่ระบุ = ใช้สีชุด) */
  accent?: string;
  /** ทรงที่เป็นหมวก: ถ้าชุดอาชีพมีหมวกจะใช้ทรงรองทรงแทน */
  hat?: boolean;
}

const HAIRS: HairDef[] = [
  {
    name: "ทูบล็อก",
    nape: 10,
    rows: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "...########",
      "...########",
      "...########",
      "...##.##.##",
      "...#.....#.",
      "...........",
    ],
  },
  {
    name: "แสกกลาง",
    nape: 11,
    rows: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "...#######d",
      "...######d.",
      "...#####...",
      "...####....",
      "...###.....",
      "...##......",
      "...#.......",
    ],
  },
  {
    name: "อนิเมะ",
    nape: 10,
    rows: [
      ".......#...",
      ".....####.#",
      "...########",
      "..#########",
      "..#########",
      "...########",
      "..#########",
      "...##.###.#",
      "...#..#..#.",
      "...#.....#.",
    ],
  },
  {
    name: "ปัดข้าง",
    nape: 11,
    rows: [
      "......................",
      "......##########......",
      "....##############....",
      "...################...",
      "...################...",
      "...##.#############...",
      "...#...####.#######...",
      "...#....##.##d#####...",
      "...#...........####...",
      "...#...........####...",
      "................###...",
      "................##....",
    ],
  },
  {
    name: "ยาวหน้าม้า",
    nape: 14,
    backLen: 19,
    backFull: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "..#########",
      "..#########",
      "..##d######",
      "..##d####d#",
      "..##d####d#",
      "..#d####d##",
      "..#d####d##",
      "..#d####d##",
      "..#d####d##",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "...#d##d##d",
      "....#..#..#",
    ],
    rows: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "...########",
      "..#########",
      "..#########",
      "..###.##.##",
      "..###......",
      "..###......",
      "..#d#......",
      "..#d#......",
      "..###......",
      "..###......",
      "..###......",
      "..%%%......",
      "..%%%......",
      "..%%%......",
      "..%%%......",
      "...%%......",
    ],
  },
  {
    name: "หางม้า",
    nape: 11,
    rows: [
      "......................",
      "......##########......",
      "....##############....",
      "...################XX.",
      "...################%%.",
      "...################%%.",
      "...################.%%",
      "...##.###.###.####.%%.",
      "...#.....#..#...##..%%",
      "...#.............#...%",
      "....................%.",
      "...................%%.",
      "...................%..",
    ],
    backRows: [
      "...........",
      "...........",
      "...........",
      ".........AA",
      "........d##",
      "........d##",
      "........d##",
      "........d##",
      "........d##",
      "........d##",
      "........d##",
      "........d##",
      ".........##",
      ".........##",
      "..........#",
      "..........#",
    ],
    sideRows: [
      "......................",
      "......................",
      "......................",
      "...AA.................",
      "..###.................",
      ".###..................",
      ".###..................",
      ".###..................",
      ".###..................",
      "..##..................",
      "..##..................",
      "..##..................",
      "...#..................",
    ],
  },
  {
    name: "บ๊อบ",
    nape: 13,
    backFull: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "..#########",
      "..#########",
      "..##d######",
      "..##d###d##",
      "..##d###d##",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "..#d##d###d",
      "...#.##.##.",
    ],
    rows: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "..#########",
      "..#########",
      "..#########",
      "..###.##.##",
      "..###......",
      "..###......",
      "..###......",
      "..###......",
      "..###......",
      "...##......",
    ],
  },
  {
    name: "แกละ",
    nape: 11,
    backKeep: true,
    rows: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "..A########",
      ".%%########",
      ".%%########",
      "%%%##.##.##",
      "%%.##......",
      "%%.#.......",
      "%%.........",
      "%%.........",
      "%%.........",
      "%%.........",
      "%%.........",
      ".%.........",
      ".%.........",
    ],
    sideRows: [
      "......................",
      "......................",
      "......................",
      "......................",
      "..AA..................",
      ".##...................",
      "###...................",
      "##....................",
      "##....................",
      "##....................",
      "##....................",
      "##....................",
      "##....................",
      "##....................",
      ".#....................",
      ".#....................",
    ],
  },
  {
    name: "วูล์ฟคัท",
    nape: 11,
    rows: [
      "...........",
      ".....######",
      "....#######",
      "...########",
      "...########",
      "...########",
      "..#########",
      "..##.##.#.#",
      "..##.......",
      "..##.......",
      ".##........",
      "..#........",
    ],
  },
  {
    name: "คอมม่า",
    nape: 10,
    rows: [
      "......................",
      "......##########......",
      "....##############....",
      "...################...",
      "...################...",
      "...################...",
      "...################...",
      "...##.####.#####d##...",
      "...#.##........d##....",
      "...#...........d#.....",
    ],
  },
  {
    name: "ยาวแสกกลาง",
    nape: 14,
    backLen: 20,
    backFull: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "..#########",
      "..#########",
      "..##d######",
      "..##d####d#",
      "..##d####d#",
      "..#d####d##",
      "..#d####d##",
      "..#d####d##",
      "..#d####d##",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "...#d##d##d",
      "....#..#..#",
    ],
    rows: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "...#######d",
      "..#######d.",
      "..######...",
      "..#####....",
      "..####.....",
      "..####.....",
      "..###......",
      "..###......",
      "..###......",
      "..###......",
      "..###......",
      "..%%%......",
      "..%%%......",
      "..%%%......",
      "..%%%......",
      "..%%%......",
      "...%%......",
    ],
  },
  {
    name: "มวยสองข้าง",
    nape: 10,
    sideRows: [
      "....###...............",
      "...#####..............",
      "...##d##..............",
      "....dd................",
    ],
    backFull: [
      "..##.......",
      ".####.#####",
      ".####d#####",
      "..##d######",
      "...########",
      "...#d######",
      "...#d####d#",
      "...#d####d#",
      "...#d###d##",
      "....#d#d###",
      ".....#..#..",
    ],
    rows: [
      "..##.......",
      ".####.#####",
      ".####d#####",
      "..##d######",
      "...########",
      "...########",
      "...########",
      "...##.##.##",
      "...#.....#.",
      "...#.......",
    ],
  },
  {
    name: "มวยบน",
    nape: 10,
    backFull: [
      ".........##",
      "........###",
      "........AAA",
      ".....###d##",
      "...#####d##",
      "...#####d##",
      "...####d###",
      "...####d###",
      "...###d####",
      "....##d####",
      "......d####",
    ],
    rows: [
      ".........##",
      "........###",
      "........AAA",
      ".....######",
      "...########",
      "...########",
      "...#####...",
      "...###.....",
      "...##......",
      "...#.......",
    ],
  },
  {
    name: "อันเดอร์คัท",
    nape: 9,
    rows: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "...########",
      "...d#######",
      "...d###.###",
      "...d.#..#..",
      "...d.......",
    ],
  },
  {
    name: "เสยหลัง",
    nape: 9,
    rows: [
      "...........",
      ".....######",
      "...########",
      "...########",
      "...########",
      "...######..",
      "...##......",
      "...##......",
      "...#.......",
    ],
  },
  {
    name: "ม้าปิดตา",
    nape: 12,
    rows: [
      "......................",
      "......##########......",
      "....##############....",
      "...################...",
      "...################...",
      "...################...",
      "...###.############...",
      "...##....##########...",
      "...#.......########...",
      "...#........#######...",
      "...#.........######...",
      "..............#####...",
      "...............###....",
    ],
  },
  {
    name: "ประบ่า",
    nape: 15,
    backFull: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "..#########",
      "..#########",
      "..##d######",
      "..##d###d##",
      "..##d###d##",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "..#d###d###",
      "..#d##d###d",
      "..#d##d###d",
      "...#.##.##.",
    ],
    rows: [
      "...........",
      "......#####",
      "....#######",
      "...########",
      "..#########",
      "..#########",
      "..#######.#",
      "..#####..##",
      "..###......",
      "..###......",
      "..###......",
      "..###......",
      "..###......",
      "..###......",
      "..###......",
      "...##......",
    ],
  },
  {
    name: "บีนนี่",
    nape: 10,
    hat: true,
    accent: "#d8343c",
    rows: [
      ".........WW",
      "......AAAAA",
      "....AAAAAAA",
      "...AAAAAAAA",
      "...AAAAAAAA",
      "..aAaAaAaAa",
      "..aAaAaAaAa",
      "...##.##.##",
      "...#.....#.",
      "...#.......",
    ],
  },
  {
    name: "แก๊ป",
    nape: 10,
    hat: true,
    accent: "#3f6fe0",
    rows: [
      "...........",
      "......AAAAA",
      "....AAAAAAA",
      "...AAAAAAWW",
      "...AAAAAAWW",
      "...AAAAAAAA",
      ".aaaaaaaaaa",
      "...##.#..#.",
      "...#.......",
      "...#.......",
    ],
  },
  {
    name: "ยาวแสกข้าง",
    nape: 13,
    rows: [
      "......................",
      "......##########......",
      "....##############....",
      "...################...",
      "...################...",
      "...#.##############...",
      "...#..#############...",
      "...#...#####.######...",
      "...#.......#...#####..",
      "...##..........####...",
      "...##...........###...",
      "...##...........###...",
      "...##...........###...",
      "....#............##...",
    ],
  },
];

export const HAIR_STYLES = HAIRS.map((h) => h.name);
export const HAIR_COUNT = HAIRS.length;

type ToneKey = "l" | "b" | "d" | "k";
interface Cell {
  /** 0 = ผม, 1 = เครื่องประดับ, 2 = ขาว */
  m: 0 | 1 | 2;
  t?: ToneKey;
  /** อยู่หลังตัว (วาดก่อนลำตัวในท่าหันหน้า) */
  back?: boolean;
}
type Layer = (Cell | null)[];

const blank = (): Layer => new Array(IW * IH).fill(null);

/** แถวครึ่งซ้าย 11 ช่อง → สะท้อนเป็น 22 ช่อง */
export function expandRow(r: string): string {
  return r.length === IW / 2 ? r + [...r].reverse().join("") : r;
}

function cellOf(ch: string): Cell | null {
  switch (ch) {
    case "#":
      return { m: 0 };
    case "l":
    case "b":
    case "d":
    case "k":
      return { m: 0, t: ch };
    case "%":
      return { m: 0, back: true };
    case "A":
      return { m: 1 };
    case "a":
      return { m: 1, t: "d" };
    case "X":
      return { m: 1, back: true };
    case "W":
      return { m: 2 };
    default:
      return null;
  }
}

function stamp(L: Layer, rows: string[] | undefined) {
  rows?.forEach((r, y) =>
    [...expandRow(r)].forEach((ch, x) => {
      const c = cellOf(ch);
      if (c && y < IH && x < IW) L[y * IW + x] = c;
    }),
  );
}

/** ความกว้างหน้า (ใช้เติมกะโหลกด้านหลังในแถวที่แม่แบบไม่มีผม) */
const FACE_ROWS: [number, number, number][] = [
  [5, 6, 15],
  [6, 5, 16],
  [7, 5, 16],
  [8, 5, 16],
  [9, 5, 16],
  [10, 5, 16],
  [11, 5, 16],
  [12, 6, 15],
  [13, 7, 14],
  [14, 8, 13],
];

interface CompiledHair {
  front: Layer;
  back: Layer;
  side: Layer;
  /** แถวแรกที่เห็นหน้าในท่าหันข้าง */
  faceTop: number;
}

function compileHair(def: HairDef): CompiledHair {
  const front = blank();
  stamp(front, def.rows);

  // ---- ด้านหลัง: ผมหน้า + เติมกะโหลกให้เต็มแต่ละแถวจนถึงท้ายทอย ----
  const base = blank();
  front.forEach((c, i) => {
    if (c && (!c.back || def.backKeep)) base[i] = { ...c, back: false };
  });
  for (let y = 0; y < IH; y++) {
    let lo = IW;
    let hi = -1;
    for (let x = 0; x < IW; x++) {
      const c = front[y * IW + x];
      if (c && !c.back) {
        lo = Math.min(lo, x);
        hi = Math.max(hi, x);
      }
    }
    if (y <= def.nape) {
      const face = FACE_ROWS.find((r) => r[0] === y);
      if (hi < 0 && face) [, lo, hi] = face;
      // ผมยาวมองจากหลัง: ไหล่ลงไปเป็นม่านผมกว้างเท่าศีรษะ
      if (def.backLen && y >= 8) [lo, hi] = def.backW ?? [3, 18];
    } else if (def.backLen && y <= def.backLen) {
      [lo, hi] = def.backW ?? [3, 18];
      // ปลายผมยาวสอบเข้าเล็กน้อย
      if (y === def.backLen) {
        lo++;
        hi--;
      }
    } else continue;
    for (let x = lo; x <= hi; x++) if (!base[y * IW + x]) base[y * IW + x] = { m: 0 };
  }

  // ท้ายทอยสอบเข้าและปลายผมเป็นแฉก ไม่ให้ดูเป็นหมวกกันน็อก
  const skull = (c: Cell | null) => !!c && c.m === 0 && !c.t;
  const endRow = def.backLen ?? def.nape;
  for (let y = 0; y <= endRow; y++) {
    let lo = IW;
    let hi = -1;
    for (let x = 0; x < IW; x++) {
      if (skull(base[y * IW + x])) {
        lo = Math.min(lo, x);
        hi = Math.max(hi, x);
      }
    }
    if (hi < 0) continue;
    const shrink = !def.backLen && y >= def.nape - 2 && hi - lo > 11 ? y - def.nape + 3 : 0;
    for (let x = lo; x <= hi; x++) {
      const i = y * IW + x;
      if (!skull(base[i])) continue;
      if (x < lo + shrink || x > hi - shrink) base[i] = null;
      else if (y === endRow && x > lo && x < hi && x % 3 === 1) base[i] = null;
    }
  }

  // ลายเส้นช่อผม + ประกายวงแหวนบนศีรษะ (มองจากหลัง/ข้าง จะได้ไม่เป็นก้อนเรียบ)
  const texture = (L: Layer, maxX: number) => {
    let topRow = -1;
    for (let y = 0; y <= endRow; y++) {
      let lo = IW;
      let hi = -1;
      for (let x = 0; x <= maxX; x++) {
        if (skull(L[y * IW + x])) {
          lo = Math.min(lo, x);
          hi = Math.max(hi, x);
        }
      }
      if (hi < 0) continue;
      if (topRow < 0) topRow = y;
      if (hi - lo < 6) continue;
      if (y === topRow + 3) {
        for (let x = lo + 2; x <= Math.min(hi - 3, Math.round((lo + hi) / 2) + 1); x++) if (skull(L[y * IW + x])) L[y * IW + x] = { m: 0, t: "l" };
        continue;
      }
      if (y < topRow + 5 || y >= endRow) continue;
      const mid = (lo + hi) / 2;
      const cols = maxX < IW - 1 ? [lo + 2, lo + 5, lo + 8] : [lo + 2, Math.round(mid - 2), Math.round(mid + 2), hi - 2];
      for (const x of cols) if (x < hi && skull(L[y * IW + x])) L[y * IW + x] = { m: 0, t: "d" };
    }
  };

  let back: Layer;
  if (def.backFull) {
    back = blank();
    if (def.backKeep) front.forEach((c, i) => c?.back && (back[i] = { ...c, back: false }));
    stamp(back, def.backFull);
  } else {
    back = base.slice();
    texture(back, IW - 1);
    stamp(back, def.backRows);
  }

  // ---- ด้านข้าง: ตัดช่องหน้าออก (หันขวา) แล้วซ้อนหางผมด้านหลัง ----
  const bangBottom = (x: number) => {
    let y = 0;
    while (y < IH && !front[y * IW + x]) y++;
    while (y < IH && front[y * IW + x] && !front[y * IW + x]!.back) y++;
    return y - 1;
  };
  const faceTop = Math.max(6, Math.min(8, Math.max(bangBottom(13), bangBottom(14)) + 1));
  const side = base.slice();
  for (let y = 0; y < IH; y++) {
    for (let x = 0; x < IW; x++) {
      // หันข้าง: ตัดช่องหน้า และลบมุมหลังศีรษะให้โค้งลงหาท้ายทอย
      const round = !def.backLen && y >= 8 && x < y - 6;
      if (x >= 20 || (x === 19 && y >= 4) || (x >= 11 && y >= faceTop) || round) side[y * IW + x] = null;
    }
  }
  texture(side, 10);
  stamp(side, def.sideRows);
  return { front, back, side, faceTop };
}

const hairCache = new Map<number, CompiledHair>();
function hairFor(i: number): CompiledHair {
  let h = hairCache.get(i);
  if (!h) {
    h = compileHair(HAIRS[i] ?? HAIRS[0]);
    hairCache.set(i, h);
  }
  return h;
}

/** แรเงาผม: ขอบล่าง/ขอบขวาเข้ม แถบประกายโค้งที่ด้านซ้ายบน */
function autoTone(L: Layer, x: number, y: number, ok: (c: Cell, x: number, y: number) => boolean): ToneKey {
  const self = L[y * IW + x]!;
  const at = (xx: number, yy: number) => {
    if (xx < 0 || yy < 0 || xx >= IW || yy >= IH) return false;
    const c = L[yy * IW + xx];
    return !!c && c.m === self.m && ok(c, xx, yy);
  };
  // ขอบล่าง (ปลายผม/รอยต่อกับหน้า) เข้มสุด, เหนือร่องระหว่างช่อผมเป็นเส้นเงา
  if (!at(x, y + 1)) return y > 4 ? "k" : "d";
  if (y > 3 && !at(x, y + 2) && (at(x - 1, y + 2) || at(x + 1, y + 2))) return "d";
  let top = y;
  while (at(x, top - 1)) top--;
  let lo = x;
  while (at(lo - 1, y)) lo--;
  let hi = x;
  while (at(hi + 1, y)) hi++;
  if (x > 10 && (x === hi || (hi - lo > 4 && x === hi - 1))) return "d";
  const dt = y - top;
  if (dt === 1 && x >= lo + 1 && x <= 11) return "l";
  if (dt === 2 && x >= lo + 2 && x <= 8) return "l";
  return "b";
}

// ---------------------------------------------------------------- ชุดประจำอาชีพ
interface Ctx {
  g: Grid;
  frame: number;
  skirt: boolean;
}

/*
 * รายละเอียดชุด/ของถือเขียนด้วยพิกัดลำตัวชุดเดิม (ลำตัว x 6–13, y 16–21, มือ y 21)
 * ตอนวาดจะเลื่อนไป +1, -1 ให้ตรงลำตัวใหม่ (x 7–14, y 15–20) ส่วน head ใช้พิกัดใหม่โดยตรง
 */
interface Outfit {
  top: string;
  sleeve?: string;
  /** แขนสั้น = เห็นแขนท่อนล่าง */
  short?: boolean;
  bottom: string;
  shoes: string;
  /** ผู้หญิงใส่กระโปรงได้ */
  skirt: boolean;
  /** ชุดคลุมยาวถึงต้นขา (โค้ท) */
  coat?: boolean;
  /** สีเสื้อตัวนอก (เสื้อกั๊ก/คาร์ดิแกน) ที่เห็นเป็นหลักตอนหันหลัง/หันข้าง */
  outer?: string;
  /** แถบสะท้อนแสงที่หลัง */
  stripes?: string;
  /** มือที่ถือของ */
  hand?: "l" | "r";
  detail?: (c: Ctx) => void;
  /** หมวก/แว่น/หูฟัง (cap = ซ่อนยอดผม) */
  head?: (c: Ctx, dir: Dir) => void;
  cap?: boolean;
  propBack?: (c: Ctx) => void;
  prop?: (c: Ctx) => void;
}

/** ตำแหน่งมือ (แถว พิกัดชุดเดิม) ตามจังหวะเดิน: แขนข้างหนึ่งแกว่งมาหน้า อีกข้างไปหลัง */
const handY = (frame: number, side: "l" | "r") => 21 + (frame === 1 ? (side === "l" ? 1 : -1) : frame === 2 ? (side === "l" ? -1 : 1) : 0);

const GOLD = "#f2c64e";

/** ตำแหน่งตาในท่าหันหน้า */
/** ตาแบบอนิเมะกว้าง 2 ช่อง: ซ้าย x 7–8, ขวา x 13–14 (แถว 8–10) */
const EYE_L = 7;
const EYE_R = 13;

const OUTFITS: Record<number, Outfit> = {
  // 0 ชุดพลเมือง (ก่อนรู้ผล): เสื้อยืด + ยีนส์
  0: {
    top: "#f4f1ea",
    short: true,
    bottom: "#4d72b0",
    shoes: "#f0f0f0",
    skirt: true,
    detail: ({ g }) => {
      const h = "#e8556a";
      g.row(18, 8, 9, h);
      g.row(18, 11, 12, h);
      g.row(19, 8, 12, h);
      g.row(20, 9, 11, h);
      g.row(16, 9, 10, "#d8cfc0");
    },
  },
  // 1 The Integrator — สูท + กระเป๋าเอกสาร
  1: {
    top: "#2f3d72",
    bottom: "#2f3d72",
    shoes: "#2b2730",
    skirt: true,
    hand: "r",
    detail: ({ g }) => {
      g.row(16, 8, 11, "#ffffff");
      g.col(9, 17, 20, "#d8424e");
      g.col(10, 17, 20, "#b8323e");
      g.set(8, 17, "#1f2a52");
      g.set(11, 17, "#1f2a52");
      g.set(12, 19, GOLD);
    },
    prop: ({ g, frame }) => {
      const y = handY(frame, "r");
      g.row(y + 1, 14, 16, "#4a2e21");
      g.rect(13, y + 2, 5, 3, "#8a5a3b");
      g.row(y + 2, 13, 17, "#a87148");
      g.set(15, y + 3, GOLD);
    },
  },
  // 2 The Builder — ฮู้ดดี้ + แล็ปท็อป
  2: {
    top: "#7a5ae0",
    bottom: "#3d4f73",
    shoes: "#f0f0f0",
    skirt: false,
    detail: ({ g }) => {
      g.row(16, 6, 13, "#5a3fb8");
      g.set(8, 17, "#f4f1ea");
      g.set(8, 18, "#f4f1ea");
      g.set(11, 17, "#f4f1ea");
      g.set(11, 18, "#f4f1ea");
      g.row(20, 7, 12, "#6a4cc9");
    },
    propBack: ({ g }) => {
      g.rect(1, 16, 3, 6, "#c9d2de");
      g.col(1, 16, 21, "#eef2f7");
      g.set(2, 18, "#ffffff");
    },
  },
  // 3 The Keeper — เชิ้ต + บัตรห้องข้อมูล + พวงกุญแจ
  3: {
    top: "#a9d6f0",
    bottom: "#4a4f5c",
    shoes: "#6a4330",
    skirt: true,
    hand: "r",
    detail: ({ g }) => {
      g.row(16, 8, 11, "#ffffff");
      g.set(8, 17, "#139e8b");
      g.set(11, 17, "#139e8b");
      g.rect(8, 18, 4, 3, "#ffffff");
      g.row(18, 8, 11, "#139e8b");
    },
    prop: ({ g, frame }) => {
      const y = handY(frame, "r") + 1;
      g.set(15, y, GOLD);
      g.set(14, y + 1, GOLD);
      g.set(16, y + 1, GOLD);
      g.set(15, y + 2, "#c9a24a");
    },
  },
  // 4 The Guardian — ชุดช่าง + หมวกแก๊ป + กล่องเครื่องมือ
  4: {
    top: "#f08a3c",
    bottom: "#e07a30",
    shoes: "#5a3a2a",
    skirt: false,
    hand: "r",
    detail: ({ g }) => {
      g.rect(7, 18, 2, 2, "#c96a26");
      g.row(21, 6, 13, "#4a3226");
      g.row(21, 9, 10, GOLD);
    },
    cap: true,
    head: ({ g }, dir) => {
      const c = "#3866c8";
      g.row(1, 7, 14, c);
      g.rect(4, 2, 14, 3, c);
      g.row(2, 6, 10, "#5b86de");
      g.row(1, 8, 10, "#5b86de");
      if (dir === "side") {
        g.row(5, 9, 20, "#284f9e");
        g.rect(14, 2, 2, 2, "#ffffff");
      } else {
        g.row(5, 3, 18, "#284f9e");
        if (dir === "down") g.rect(10, 2, 2, 2, "#ffffff");
      }
    },
    prop: ({ g, frame }) => {
      const y = handY(frame, "r");
      g.row(y + 1, 15, 16, "#6b6b75");
      g.rect(13, y + 2, 6, 3, "#d6403a");
      g.row(y + 2, 13, 18, "#ec6a62");
      g.row(y + 3, 15, 16, "#9e2c28");
    },
  },
  // 5 The Connector — เชิ้ต + เน็กไท + เสื้อกั๊ก + แท็บเล็ต
  5: {
    top: "#f6f6fa",
    bottom: "#3b3b48",
    shoes: "#2b2730",
    skirt: true,
    hand: "l",
    outer: "#4a4a5c",
    detail: ({ g }) => {
      g.rect(6, 17, 2, 5, "#4a4a5c");
      g.rect(12, 17, 2, 5, "#4a4a5c");
      g.col(9, 17, 20, "#d81b60");
      g.col(10, 17, 20, "#b3134e");
    },
    prop: ({ g, frame }) => {
      const y = handY(frame, "l") - 3;
      g.rect(0, y, 5, 6, "#2b2b35");
      g.rect(1, y + 1, 3, 4, "#6fc3ff");
      g.row(y + 1, 1, 3, "#a8dcff");
    },
  },
  // 6 The Navigator — เสื้อกั๊กสะท้อนแสง + หมวกนิรภัย + คลิปบอร์ด
  6: {
    top: "#6b7d8c",
    bottom: "#34405a",
    shoes: "#6a4330",
    skirt: false,
    hand: "l",
    outer: "#c8f03c",
    stripes: "#eef3f6",
    detail: ({ g }) => {
      g.rect(6, 16, 3, 6, "#c8f03c");
      g.rect(11, 16, 3, 6, "#c8f03c");
      g.row(19, 6, 8, "#eef3f6");
      g.row(19, 11, 13, "#eef3f6");
    },
    cap: true,
    head: ({ g }, dir) => {
      const y = "#ffd23f";
      g.row(0, 8, 13, y);
      g.row(1, 6, 15, y);
      g.rect(4, 2, 14, 3, y);
      g.row(1, 8, 10, "#fff1a8");
      g.row(2, 6, 8, "#fff1a8");
      g.col(dir === "side" ? 9 : 11, 0, 4, "#f0b81e");
      g.row(5, 3, dir === "side" ? 19 : 18, "#e0a414");
    },
    prop: ({ g, frame }) => {
      const y = handY(frame, "l") - 3;
      g.rect(0, y, 5, 6, "#9a6440");
      g.rect(1, y + 1, 3, 4, "#ffffff");
      g.row(y, 1, 3, "#9aa0a8");
      g.row(y + 2, 1, 3, "#b8c0c8");
    },
  },
  // 7 The Architect — เสื้อกั๊ก + ม้วนพิมพ์เขียว
  7: {
    top: "#ffffff",
    bottom: "#cdb488",
    shoes: "#6a4330",
    skirt: true,
    outer: "#8a5a3c",
    detail: ({ g }) => {
      g.rect(6, 17, 3, 5, "#8a5a3c");
      g.rect(11, 17, 3, 5, "#8a5a3c");
      g.set(8, 19, GOLD);
    },
    propBack: ({ g }) => {
      g.rect(15, 12, 2, 10, "#2f7fd6");
      g.row(12, 15, 16, "#d6e8ff");
      g.row(21, 15, 16, "#d6e8ff");
      g.col(16, 13, 20, "#1f5fa8");
    },
  },
  // 8 The Detective — โค้ทนักสืบ + แว่นกลม + แว่นขยาย
  8: {
    top: "#c49a6c",
    bottom: "#4a3428",
    shoes: "#4a3428",
    skirt: false,
    coat: true,
    hand: "r",
    detail: ({ g }) => {
      g.rect(8, 16, 4, 2, "#f2e6d8");
      g.set(8, 18, "#a37b52");
      g.set(11, 18, "#a37b52");
      g.row(20, 6, 13, "#8f6a45");
      g.set(10, 20, GOLD);
    },
    head: ({ g }, dir) => {
      const f = "#3b2a20";
      const lens = (ex: number) => {
        g.row(7, ex - 1, ex + 2, f);
        g.col(ex - 1, 8, 10, f);
        g.col(ex + 2, 8, 10, f);
        g.row(11, ex - 1, ex + 2, f);
      };
      if (dir === "down") {
        lens(EYE_L);
        lens(EYE_R);
        g.row(9, EYE_L + 3, EYE_R - 2, f);
      } else if (dir === "side") {
        g.row(7, 13, 16, f);
        g.col(13, 8, 10, f);
        g.col(16, 8, 10, f);
        g.row(11, 13, 16, f);
        g.row(9, 11, 12, f);
      }
    },
    prop: ({ g, frame }) => {
      const y = handY(frame, "r");
      g.col(15, y - 1, y, "#6a4330");
      g.row(y - 6, 15, 17, GOLD);
      g.row(y - 2, 15, 17, GOLD);
      g.col(14, y - 5, y - 3, GOLD);
      g.col(18, y - 5, y - 3, GOLD);
      g.rect(15, y - 5, 3, 3, "#bfe6ff");
      g.set(15, y - 5, "#ffffff");
    },
  },
  // 9 The Optimizer — โปโล + นาฬิกาจับเวลา
  9: {
    top: "#3fa65a",
    short: true,
    bottom: "#d4bc8a",
    shoes: "#f0f0f0",
    skirt: true,
    hand: "r",
    detail: ({ g }) => {
      g.set(8, 16, "#ffffff");
      g.set(11, 16, "#ffffff");
      g.rect(9, 16, 2, 3, "#2e8546");
      g.set(9, 17, "#ffffff");
    },
    prop: ({ g, frame }) => {
      const y = handY(frame, "r") + 1;
      g.set(15, y, "#d6403a");
      g.rect(14, y + 1, 3, 3, "#e8ecf0");
      g.set(15, y + 2, OUTLINE);
      g.set(14, y + 1, "#ffffff");
    },
  },
  // 10 The Storyteller — เสื้อสีสด + โทรโข่ง
  10: {
    top: "#ff8a2b",
    short: true,
    bottom: "#3d6fd1",
    shoes: "#e84a4a",
    skirt: true,
    hand: "r",
    detail: ({ g }) => {
      g.row(18, 6, 13, "#ffd23f");
      g.row(20, 6, 13, "#ff5c8a");
    },
    prop: ({ g, frame }) => {
      const y = handY(frame, "r");
      g.set(15, y - 1, "#3b3b48");
      g.rect(15, y - 3, 2, 2, "#f4f1ea");
      g.rect(17, y - 4, 1, 4, "#e84a4a");
      g.rect(18, y - 5, 1, 6, "#e84a4a");
      g.col(19, y - 5, y, "#ff7a7a");
    },
  },
  // 11 The Host — ยูนิฟอร์มต้อนรับ + หูฟัง
  11: {
    top: "#b0284f",
    bottom: "#2b2b35",
    shoes: "#2b2730",
    skirt: true,
    detail: ({ g }) => {
      g.row(16, 8, 11, "#ffffff");
      g.row(17, 9, 10, "#ffffff");
      g.set(8, 17, GOLD);
      g.set(11, 17, GOLD);
      g.set(9, 19, GOLD);
      g.set(9, 21, GOLD);
      g.set(12, 18, GOLD);
    },
    head: ({ g }, dir) => {
      const k = "#2b2b35";
      if (dir === "side") {
        g.col(11, 2, 7, k);
        g.rect(10, 8, 3, 3, k);
        g.row(12, 13, 14, k);
        g.set(15, 12, "#9aa0a8");
        return;
      }
      g.col(3, 3, 7, k);
      g.rect(2, 8, 3, 3, k);
      if (dir === "up") {
        g.col(18, 3, 7, k);
        g.rect(17, 8, 3, 3, k);
        return;
      }
      g.row(12, 5, 8, k);
      g.set(9, 12, "#9aa0a8");
    },
  },
  // 12 The Mentor — คาร์ดิแกน + หนังสือ
  12: {
    top: "#f6ecd6",
    sleeve: "#9b6b4a",
    bottom: "#5c4033",
    shoes: "#6a4330",
    skirt: true,
    hand: "l",
    outer: "#9b6b4a",
    detail: ({ g }) => {
      g.row(16, 5, 7, "#9b6b4a");
      g.row(16, 12, 14, "#9b6b4a");
      g.rect(6, 17, 3, 5, "#9b6b4a");
      g.rect(11, 17, 3, 5, "#9b6b4a");
      g.set(8, 18, "#e9d8bd");
      g.set(8, 20, "#e9d8bd");
    },
    prop: ({ g, frame }) => {
      const y = handY(frame, "l") - 3;
      g.rect(0, y, 5, 6, "#2e7d4f");
      g.col(4, y, y + 5, "#f6ecd6");
      g.row(y + 2, 0, 3, GOLD);
      g.col(0, y, y + 5, "#1f5a37");
    },
  },
};

/** วาดด้วยพิกัดชุดเดิม (เลื่อน +1, -1) บวกการเลื่อนเพิ่ม */
function legacy(g: Grid, fn: (() => void) | undefined, dx = 0) {
  if (!fn) return;
  g.dx = 1 + dx;
  g.dy = -1;
  fn();
  g.dx = 0;
  g.dy = 0;
}

// ---------------------------------------------------------------- ชุดเครื่องมือวาด
interface Kit {
  g: Grid;
  look: Look;
  frame: number;
  skin: Tone;
  hairT: Tone;
  hairAcc: Tone;
  hair: CompiledHair;
  capped: boolean;
  o: Outfit;
  top: Tone;
  outer: Tone;
  sleeve: Tone;
  bottom: Tone;
  shoes: Tone;
  skirt: boolean;
  c: Ctx;
}

/** ม่านตาโทนเดียวกับสีผม (ผมดำ/น้ำตาลได้ตาน้ำตาลเข้ม) */
function eyeColors(k: Kit) {
  const base = mixHex(k.hairT.b, "#5a3428", k.look.hairColor <= 1 ? 0.6 : 0.15);
  return { iris: mixHex(base, "#2a1838", 0.2), irisD: mixHex(base, "#1a1020", 0.6) };
}

function makeKit(g: Grid, look: Look, personaId: number, frame: number): Kit {
  const o = OUTFITS[personaId] ?? OUTFITS[0];
  const skirt = look.gender === "f" && o.skirt;
  const capped = !!o.cap;
  // หมวกประจำอาชีพทับหมวกแฟชั่นไม่ได้ ใช้ผมรองทรงแทน
  const hi = HAIRS[look.hair] ? look.hair : 0;
  const def = capped && HAIRS[hi].hat ? HAIRS[0] : HAIRS[hi];
  const accent = def.accent ?? (o.top === "#f4f1ea" ? "#e8556a" : o.top);
  return {
    g,
    look,
    frame,
    skin: tone(SKIN_TONES[look.skin] ?? SKIN_TONES[0]),
    hairT: tone(HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[0]),
    hairAcc: tone(accent),
    hair: hairFor(HAIRS.indexOf(def)),
    capped,
    o,
    top: tone(o.top),
    outer: tone(o.outer ?? o.top),
    sleeve: tone(o.sleeve ?? o.top),
    bottom: tone(o.bottom),
    shoes: tone(o.shoes),
    skirt,
    c: { g, frame, skirt },
  };
}

/** ระบายชั้นผม: behind = ผมที่อยู่หลังตัว (มืดลงหนึ่งระดับ) */
function paintHair(k: Kit, L: Layer, pick: (c: Cell, x: number, y: number) => boolean, behind = false) {
  const { g, hairT, hairAcc, capped } = k;
  const ok = (c: Cell, x: number, y: number) => pick(c, x, y) && !(capped && y <= 1);
  for (let y = 0; y < IH; y++) {
    for (let x = 0; x < IW; x++) {
      const c = L[y * IW + x];
      if (!c || !ok(c, x, y)) continue;
      const t = c.t ?? autoTone(L, x, y, ok);
      let col: string;
      if (c.m === 2) col = t === "d" || t === "k" ? "#cdc8d4" : "#f6f4ef";
      else {
        const tn = c.m === 1 ? hairAcc : hairT;
        const order = [tn.l, tn.b, tn.d, tn.dd];
        const i = { l: 0, b: 1, d: 2, k: 3 }[t] + (behind ? 1 : 0);
        col = order[Math.min(3, i)];
      }
      g.set(x, y, col);
    }
  }
}

/** ขา รองเท้า สะโพก สำหรับท่าหันหน้า/หันหลัง */
function drawLegsFB(k: Kit) {
  const { g, frame, skin, bottom, shoes, skirt, o, top } = k;
  // ขาที่ยกตอนก้าวจะสั้นลง 1 แถว รองเท้ายกขึ้นตาม
  const lift = (side: "l" | "r") => (frame === 1 ? side === "r" : frame === 2 ? side === "l" : false);
  for (const [side, x] of [
    ["l", 7],
    ["r", 12],
  ] as const) {
    const up = lift(side) ? 1 : 0;
    for (let y = 22; y <= 23 - up; y++) {
      const isSkin = skirt && y >= 23;
      g.row(y, x, x + 2, isSkin ? skin.b : bottom.b);
      g.set(side === "l" ? x : x + 2, y, isSkin ? skin.d : side === "l" ? bottom.b : bottom.d);
    }
    const sy = 24 - up;
    const sx = side === "l" ? x - 1 : x;
    g.row(sy, sx, sx + 3, shoes.b);
    g.row(sy + 1, sx, sx + 3, shoes.d);
    g.set(sx + 1, sy, shoes.l);
  }
  if (skirt) {
    g.row(21, 7, 14, bottom.b);
    g.row(22, 6, 15, bottom.d);
    g.set(7, 21, bottom.l);
  } else {
    g.row(21, 7, 14, bottom.b);
    g.set(7, 21, bottom.l);
    g.set(14, 21, bottom.d);
  }
  if (o.coat) {
    g.row(21, 7, 14, top.b);
    g.row(22, 6, 15, top.d);
    g.set(10, 22, null);
    g.set(11, 22, null);
    g.set(10, 21, top.d);
  }
}

/** ลำตัว + แขนสองข้าง สำหรับท่าหันหน้า/หันหลัง */
function drawTorsoFB(k: Kit, body: Tone) {
  const { g, frame, skin, sleeve, o } = k;
  g.row(15, 6, 15, body.b);
  g.rect(7, 16, 8, 5, body.b);
  g.col(7, 16, 20, body.l);
  g.col(14, 16, 20, body.d);
  g.row(20, 8, 14, body.d);
  const arm = (x: number, side: "l" | "r") => {
    const hy = handY(frame, side) - 1;
    for (let y = 15; y < hy; y++) {
      const exposed = o.short && y >= 17;
      const t = exposed ? skin : sleeve;
      g.set(x, y, side === "l" ? t.b : t.d);
      g.set(x + 1, y, side === "l" ? t.d : t.dd);
    }
    g.row(hy, x, x + 1, skin.b);
    g.set(x + 1, hy, skin.d);
  };
  arm(5, "l");
  arm(15, "r");
}

function drawHeadSkin(k: Kit) {
  const { g, skin } = k;
  for (const [y, a, b] of FACE_ROWS) g.row(y, a, b, skin.b);
  g.col(16, 7, 11, skin.d);
  g.set(15, 12, skin.d);
  g.set(14, 13, skin.d);
  g.row(14, 11, 13, skin.d);
}

// ---------------------------------------------------------------- หันหน้า
function drawFront(k: Kit) {
  const { g, look, skin, hairT, hair, o, top, c } = k;
  paintHair(k, hair.front, (cl) => !!cl.back, true);
  legacy(g, o.propBack && (() => o.propBack!(c)));
  drawLegsFB(k);
  drawTorsoFB(k, top);
  legacy(g, o.detail && (() => o.detail!(c)));

  drawHeadSkin(k);
  // หู
  g.set(4, 9, skin.b);
  g.set(4, 10, skin.d);
  g.set(17, 9, skin.d);
  g.set(17, 10, skin.d);
  // คิ้ว (ส่วนใหญ่ถูกหน้าม้าบัง)
  g.row(6, EYE_L, EYE_L + 1, hairT.d);
  g.row(6, EYE_R, EYE_R + 1, hairT.d);
  // ตาแบบอนิเมะ: ขอบตาบนเข้ม, ประกายขาว, ม่านตาสีเข้ากับผม
  const { iris, irisD } = eyeColors(k);
  for (const ex of [EYE_L, EYE_R]) {
    g.row(8, ex, ex + 1, OUTLINE);
    g.set(ex, 9, "#ffffff");
    g.set(ex + 1, 9, irisD);
    g.set(ex, 10, iris);
    g.set(ex + 1, 10, irisD);
  }
  if (look.gender === "f") {
    g.set(EYE_L - 1, 8, OUTLINE);
    g.set(EYE_L - 1, 7, OUTLINE);
    g.set(EYE_R + 2, 8, OUTLINE);
    g.set(EYE_R + 2, 7, OUTLINE);
  }
  const blush = mixHex(skin.b, "#ff7a8a", look.gender === "f" ? 0.45 : 0.25);
  g.set(EYE_L - 1, 11, blush);
  g.set(EYE_R + 2, 11, blush);
  g.set(10, 12, mixHex(skin.b, "#b8404c", 0.45));
  g.set(11, 12, mixHex(skin.b, "#b8404c", 0.25));

  paintHair(k, hair.front, (cl) => !cl.back);
  o.head?.(c, "down");
  legacy(g, o.prop && (() => o.prop!(c)));
}

// ---------------------------------------------------------------- หันหลัง
function drawBack(k: Kit) {
  const { g, hair, o, outer, skin, c } = k;
  legacy(g, o.propBack && (() => o.propBack!(c)));
  legacy(g, o.prop && (() => o.prop!(c)));

  drawLegsFB(k);
  drawTorsoFB(k, outer);
  legacy(g, () => {
    if (o.stripes) {
      g.row(19, 6, 13, o.stripes);
      g.row(21, 6, 13, o.stripes);
    }
    if (o.coat) g.row(20, 6, 13, outer.d);
    if (o === OUTFITS[2]) {
      g.rect(7, 16, 6, 2, outer.d);
      g.row(18, 8, 11, outer.d);
    }
  });
  drawHeadSkin(k);
  g.set(4, 9, skin.d);
  g.set(17, 9, skin.d);
  paintHair(k, hair.back, () => true);
  if (o.cap || o === OUTFITS[11]) o.head?.(c, "up");
}

// ---------------------------------------------------------------- หันข้าง (หันขวา)
const SIDE_FACE: [number, number, number][] = [
  [5, 10, 16],
  [6, 10, 17],
  [7, 10, 17],
  [8, 10, 17],
  [9, 10, 17],
  [10, 10, 18],
  [11, 10, 17],
  [12, 10, 16],
  [13, 11, 15],
  [14, 12, 14],
];

function drawSide(k: Kit) {
  const { g, look, frame, skin, hairT, hair, o, outer, sleeve, bottom, shoes, skirt, c } = k;

  legacy(g, o.propBack && (() => o.propBack!(c)), o === OUTFITS[7] ? -9 : 4);

  // ---- ขา: ขาหลังเข้มกว่า รองเท้าชี้ไปทางขวา ----
  const legs: { x: number; len: number; back: boolean }[] =
    frame === 1
      ? [
          { x: 7, len: 2, back: true },
          { x: 12, len: 2, back: false },
        ]
      : frame === 2
        ? [
            { x: 9, len: 1, back: true },
            { x: 10, len: 2, back: false },
          ]
        : [
            { x: 9, len: 2, back: true },
            { x: 10, len: 2, back: false },
          ];
  for (const L of legs) {
    const legT = L.back ? tone(bottom.d) : bottom;
    const skinT = L.back ? tone(skin.d) : skin;
    for (let y = 22; y < 22 + L.len; y++) {
      const isSkin = skirt && y >= 23;
      g.row(y, L.x, L.x + 2, isSkin ? skinT.b : legT.b);
      g.set(L.x, y, isSkin ? skinT.d : legT.d);
    }
    const sy = 22 + L.len;
    g.row(sy, L.x, L.x + 3, L.back ? shoes.d : shoes.b);
    g.row(sy + 1, L.x, L.x + 3, L.back ? shoes.dd : shoes.d);
    g.set(L.x + 3, sy, shoes.l);
  }
  if (skirt) {
    g.row(21, 8, 13, bottom.b);
    g.row(22, 7, 14, bottom.d);
  } else {
    g.row(21, 8, 13, bottom.b);
    g.set(8, 21, bottom.d);
  }
  if (o.coat) {
    g.row(21, 8, 13, outer.b);
    g.row(22, 7, 14, outer.d);
  }

  // ---- ลำตัว ----
  g.rect(8, 15, 6, 6, outer.b);
  g.col(8, 15, 20, outer.d);
  g.col(13, 16, 20, outer.l);
  g.row(20, 8, 13, outer.d);
  if (o.stripes) {
    g.row(18, 8, 13, o.stripes);
    g.row(20, 8, 13, o.stripes);
  }
  if (o.coat) g.row(19, 8, 13, outer.d);

  // ---- หัว ----
  for (const [y, a, b] of SIDE_FACE) g.row(y, a, b, skin.b);
  g.col(10, 7, 12, skin.d);
  g.set(11, 9, skin.d);
  g.set(11, 10, skin.d);
  g.set(12, 10, skin.d);
  const se = eyeColors(k);
  g.row(8, 14, 15, OUTLINE);
  g.set(14, 9, "#ffffff");
  g.set(15, 9, se.irisD);
  g.set(15, 10, se.iris);
  if (look.gender === "f") {
    g.set(16, 8, OUTLINE);
    g.set(16, 7, OUTLINE);
  }
  g.row(6, 14, 15, hairT.d);
  g.set(14, 11, mixHex(skin.b, "#ff7a8a", look.gender === "f" ? 0.45 : 0.25));
  g.set(16, 12, mixHex(skin.b, "#b8404c", 0.42));
  g.set(15, 13, skin.d);

  paintHair(k, hair.side, () => true);

  // ---- แขนข้างที่เห็น (อยู่หน้าผมยาว) ----
  const ax = frame === 1 ? 11 : frame === 2 ? 9 : 10;
  const hx = frame === 1 ? 12 : frame === 2 ? 8 : 10;
  for (let y = 16; y <= 19; y++) {
    const exposed = o.short && y >= 18;
    const t = exposed ? skin : sleeve;
    const x = y >= 18 ? hx : ax;
    g.row(y, x, x + 1, t.b);
    g.set(x, y, t.dd);
  }
  g.row(20, hx, hx + 1, skin.b);
  g.set(hx, 20, skin.d);
  g.set(ax, 15, sleeve.d);

  o.head?.(c, "side");
  if (o.prop) legacy(g, () => o.prop!(c), o.hand === "l" ? hx - 5 : hx - 15);
}

function buildGrid(look: Look, personaId: number, frame: number, sticker: boolean, dir: Dir): Grid {
  const g = new Grid();
  const k = makeKit(g, look, personaId, frame);
  if (dir === "up") drawBack(k);
  else if (dir === "side") drawSide(k);
  else drawFront(k);

  g.ring(OUTLINE);
  if (sticker) {
    g.ring(STICKER);
  } else {
    // เงาใต้เท้า
    for (let x = 6; x <= 15; x++) if (!g.get(x, 26)) g.set(x, 26, "rgba(20,10,30,0.28)");
    for (let x = 8; x <= 13; x++) if (!g.get(x, 27)) g.set(x, 27, "rgba(20,10,30,0.14)");
  }
  return g;
}

const gridCache = new Map<string, Grid>();
const lookKey = (l: Look) => `${l.gender}${l.hair}.${l.hairColor}.${l.skin}`;

function gridFor(look: Look, personaId: number, frame: number, sticker: boolean, dir: Dir): Grid {
  const key = `${lookKey(look)}-${personaId}-${frame}-${sticker ? 1 : 0}-${dir}`;
  let g = gridCache.get(key);
  if (!g) {
    g = buildGrid(look, personaId, frame, sticker, dir);
    gridCache.set(key, g);
  }
  return g;
}

export interface DrawOpts {
  /** ขอบขาวแบบสติกเกอร์ (ใช้บน UI) */
  sticker?: boolean;
  /** ทิศที่หัน (ค่าเริ่มต้น down = หันหน้า) */
  dir?: Dir;
}

/** สี pixel ทั้งหมดของตัวละคร (ใช้ทดสอบ/ตรวจงานศิลป์) */
export function spritePixels(look: Look, personaId: number, frame = 0, opts: DrawOpts = {}): (string | null)[] {
  return gridFor(look, personaId, frame, !!opts.sticker, opts.dir ?? "down").px;
}

/**
 * วาดตัวละครลง ctx ที่จุด (ox, oy) ขนาด pixel ละ s
 * frame: 0 = ยืน, 1–2 = ก้าวเท้า (เล่นตาม WALK_CYCLE)
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  look: Look,
  personaId: number,
  frame = 0,
  s = 1,
  ox = 0,
  oy = 0,
  opts: DrawOpts = {},
) {
  const px = spritePixels(look, personaId, frame, opts);
  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      const c = px[y * SPRITE_W + x];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(ox + x * s, oy + y * s, s, s);
    }
  }
}

/** สร้าง canvas ของตัวละคร (ใช้เป็น texture หรือรูปบนหน้าเว็บ) */
export function characterCanvas(look: Look, personaId: number, frame = 0, scale = 1, opts: DrawOpts = {}): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SPRITE_W * scale;
  c.height = SPRITE_H * scale;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  drawCharacter(ctx, look, personaId, frame, scale, 0, 0, opts);
  return c;
}

const urlCache = new Map<string, string>();
export function characterDataUrl(look: Look, personaId: number, frame = 0, scale = 8, opts: DrawOpts = {}): string {
  const key = `${lookKey(look)}-${personaId}-${frame}-${scale}-${opts.sticker ? 1 : 0}-${opts.dir ?? "down"}`;
  let url = urlCache.get(key);
  if (!url) {
    url = characterCanvas(look, personaId, frame, scale, opts).toDataURL();
    urlCache.set(key, url);
  }
  return url;
}

export function clampLook(l: Partial<Look> | undefined): Look {
  const n = (v: unknown, max: number, def: number) => (typeof v === "number" && v >= 0 && v <= max ? Math.floor(v) : def);
  const g = l?.gender;
  return {
    gender: g === "m" || g === "f" || g === "x" ? g : "x",
    hair: n(l?.hair, HAIR_COUNT - 1, DEFAULT_LOOK.hair),
    hairColor: n(l?.hairColor, HAIR_COLORS.length - 1, DEFAULT_LOOK.hairColor),
    skin: n(l?.skin, SKIN_TONES.length - 1, DEFAULT_LOOK.skin),
  };
}

/** ทรงผมที่สุ่มให้แต่ละเพศ (เลือกเองได้ทุกทรง) */
export const HAIR_POOL: Record<Gender, number[]> = {
  m: [0, 1, 2, 3, 8, 9, 13, 14, 15, 17, 18, 19],
  f: [1, 3, 4, 5, 6, 7, 10, 11, 12, 15, 16, 17],
  x: HAIRS.map((_, i) => i),
};

export function randomLook(gender?: Gender): Look {
  const gd = gender ?? GENDERS[Math.floor(Math.random() * 3)].id;
  const pool = HAIR_POOL[gd];
  return {
    gender: gd,
    hair: pool[Math.floor(Math.random() * pool.length)],
    hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
    skin: Math.floor(Math.random() * SKIN_TONES.length),
  };
}
