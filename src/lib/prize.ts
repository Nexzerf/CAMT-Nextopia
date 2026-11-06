import { SUPABASE_KEY, SUPABASE_URL } from "./config";

/**
 * เรียกฟังก์ชันบน Supabase ผ่าน /api/rpc/* (โดเมนเดียวกับเว็บ, vercel.json ส่งต่อให้ Supabase)
 * เครือข่ายโรงเรียนที่บล็อก *.supabase.co ก็ยังใช้ได้; ถ้าไม่มี proxy (รันในเครื่อง) สลับไปเรียกตรง
 */
let base: string | null = null;
const PROXY = "/api/rpc/";
const DIRECT = () => `${SUPABASE_URL}/rest/v1/rpc/`;

async function call(url: string, body: unknown, timeoutMs: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* ไม่ใช่ JSON (เช่นหน้า 404 ของ static server) */
    }
    return { res, data, json: data !== null || text === "" };
  } finally {
    clearTimeout(timer);
  }
}

export async function rpc<T = unknown>(fn: string, body: unknown, timeoutMs = 12000): Promise<T> {
  const order = base ? [base] : [PROXY, DIRECT()];
  let lastErr: unknown = null;
  for (const b of order) {
    try {
      const { res, data, json } = await call(b + fn, body, timeoutMs);
      if (!json || (res.status === 404 && b === PROXY)) {
        lastErr = new Error("proxy unavailable");
        continue;
      }
      if (!res.ok) {
        const d = data as { message?: string; error?: string } | null;
        throw new Error(d?.message || d?.error || `HTTP ${res.status}`);
      }
      base = b;
      return data as T;
    } catch (e) {
      lastErr = e;
      if (e instanceof Error && /HTTP|invalid|already|pin/.test(e.message)) throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("network");
}

export interface PrizeResult {
  prize_id: "clicker1" | "clicker3" | "bag" | "mug" | null;
  prize_name: string | null;
  code: string | null;
  time: string;
  already?: boolean;
}

export const PRIZE_ICON = { clicker1: "clicker1", clicker3: "clicker3", bag: "bag", mug: "mug" } as const;

const DEVICE_KEY = "nextopia.device.v1";
const KIOSK_KEY = "nextopia.kiosk.v1";

export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function kioskPin(): string | null {
  try {
    return localStorage.getItem(KIOSK_KEY);
  } catch {
    return null;
  }
}
export function setKioskPin(pin: string | null) {
  try {
    if (pin) localStorage.setItem(KIOSK_KEY, pin);
    else localStorage.removeItem(KIOSK_KEY);
  } catch {
    /* ignore */
  }
}

/** สุ่มรางวัลบนเซิร์ฟเวอร์ (ตัดสต็อกพร้อมกัน ไม่มีทางแจกเกิน) — มือถือ 1 เครื่องได้ผลเดียว */
export async function drawPrize(nickname: string, major: string): Promise<PrizeResult> {
  const body: Record<string, unknown> = { p_device: deviceId(), p_name: nickname, p_major: major };
  const pin = kioskPin();
  if (pin) body.p_kiosk_pin = pin;
  const r = await rpc<PrizeResult & { error?: string }>("nextopia_spin", body);
  if (r && r.error) throw new Error(r.error);
  return r;
}

export async function staff<T = Record<string, unknown>>(pin: string, action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const r = await rpc<T & { error?: string }>("nextopia_admin", { p_pin: pin, p_action: action, p_payload: payload }, 20000);
  if (r && (r as { error?: string }).error) throw new Error((r as { error?: string }).error);
  return r;
}
