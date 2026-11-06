/**
 * Supabase (project "Project2", schema nextopia)
 * publishable key ใส่ในเว็บได้: เว็บเรียกได้แค่ฟังก์ชัน nextopia_* เท่านั้น การสุ่มรางวัลทำบนเซิร์ฟเวอร์ทั้งหมด
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://wgpumjrmowscxckqxshi.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_CN6yOsSi3ax8uMB17JqsDg_9zgUxsK0";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";
export const SHORT_LINK = process.env.NEXT_PUBLIC_SHORT_LINK ?? "";
export const CAMT_TAG = process.env.NEXT_PUBLIC_CAMT_TAG ?? "@camtcmu";

/** URL ฝั่งมือถือ ใช้ทำ QR (ถ้าไม่ได้ตั้งค่า ใช้ origin ของหน้าที่เปิดอยู่) */
export function playUrl(): string {
  if (SITE_URL) return SITE_URL;
  if (typeof window !== "undefined") return window.location.origin + "/";
  return "";
}

export function shortLinkLabel(): string {
  return (SHORT_LINK || playUrl()).replace(/^https?:\/\//, "").replace(/\/$/, "");
}
