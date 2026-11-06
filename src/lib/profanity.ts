import BANNED from "./banned-words.json";

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i" };

/**
 * ทำให้ชื่ออยู่ในรูปมาตรฐานก่อนเทียบคำหยาบ — ต้องตรงกับ public.normalize_nickname() ใน supabase/migrations
 * 1) ตัวพิมพ์เล็ก 2) ตัดวรรณยุกต์/ไม้ไต่คู้/การันต์ 3) แปลง leet 4) ตัดอักขระที่ไม่ใช่ตัวอักษร 5) ยุบตัวซ้ำ
 */
export function normalizeNickname(s: string): string {
  let t = s.toLowerCase().normalize("NFC");
  t = t.replace(/[็-์]/g, "");
  t = t.replace(/[013457@$!]/g, (c) => LEET[c] ?? c);
  t = t.replace(/[^a-z0-9฀-๿]/g, "");
  t = t.replace(/(.)\1+/g, "$1");
  return t;
}

const NORMALIZED = (BANNED as string[]).map(normalizeNickname).filter(Boolean);

export function isProfane(name: string): boolean {
  const n = normalizeNickname(name);
  return NORMALIZED.some((w) => n.includes(w));
}

export const NICK_MAX = 12;

/** อักขระควบคุม/ล่องหน/สลับทิศ (ต้องตรงกับ trigger ใน supabase/migrations/20261029000000_hardening.sql) */
const INVISIBLE = /[\p{Cc}\p{Cf}\u034F\u115F\u1160\u17B4\u17B5\u180E\u3164\uFE00-\uFE0F\uFFA0]/gu;
/** เครื่องหมายกำกับที่ไม่ใช่สระ/วรรณยุกต์ไทย (ซ้อนกันแล้วชื่อสูงทะลุจอ) */
const FOREIGN_MARKS = /(?![\u0E31\u0E34-\u0E3A\u0E47-\u0E4E])\p{M}/gu;
/** สระ/วรรณยุกต์ไทยซ้อนกันได้ไม่เกิน 2 ตัว */
const THAI_STACK = /([\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]{2})[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]+/gu;

/** ทำความสะอาดชื่อเล่นแบบเดียวกับฝั่งฐานข้อมูล */
export function cleanNickname(raw: string): string {
  return raw.replace(INVISIBLE, "").replace(FOREIGN_MARKS, "").replace(THAI_STACK, "$1").trim().replace(/\s+/g, " ");
}

/** คืนข้อความ error ภาษาไทย หรือ null ถ้าใช้ได้ */
export function validateNickname(raw: string): string | null {
  const name = cleanNickname(raw);
  if (!name) return "ตั้งชื่อเล่นก่อนนะ";
  if ([...name].length > NICK_MAX) return `ชื่อยาวได้ไม่เกิน ${NICK_MAX} ตัวอักษร`;
  if (!/[\p{L}\p{N}]/u.test(name)) return "ชื่อต้องมีตัวอักษรอย่างน้อย 1 ตัว";
  if (isProfane(name)) return "ชื่อนี้ใช้ไม่ได้นะ ลองชื่ออื่นดู";
  return null;
}

