"use client";

import { useCallback, useEffect, useState } from "react";
import PixelIcon from "@/components/PixelIcon";
import { PRIZE_ICON, kioskPin, setKioskPin, staff } from "@/lib/prize";

interface PrizeRow {
  id: keyof typeof PRIZE_ICON;
  name: string;
  stock: number;
  given: number;
  left: number;
  chance: number;
  enabled: boolean;
}
interface SpinRow {
  time: string;
  name: string | null;
  major: string | null;
  prize_id: string | null;
  prize_name: string | null;
  code: string | null;
  claimed_at: string | null;
}
interface Status {
  prizes: PrizeRow[];
  total_spins: number;
  total_wins: number;
  by_major: Record<string, number>;
  recent: SpinRow[];
}

function errText(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (/invalid pin/.test(m)) return "PIN ไม่ถูกต้อง";
  if (/too many/.test(m)) return "ใส่ PIN ผิดหลายครั้งเกินไป รอ 5 นาที";
  return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: " + m;
}

export default function StaffApp() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Status | null>(null);
  const [rows, setRows] = useState<PrizeRow[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [kiosk, setKiosk] = useState(false);

  useEffect(() => setKiosk(!!kioskPin()), []);

  const run = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      setBusy(true);
      setMsg("");
      try {
        const d = await staff<Status>(pin, action, payload);
        setData(d);
        setRows(d.prizes);
        return d;
      } catch (e) {
        setMsg(errText(e));
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [pin],
  );

  const login = async () => {
    try {
      await run("status");
      setAuthed(true);
    } catch {
      /* msg already set */
    }
  };

  // รีเฟรชตัวเลขทุก 15 วิ ระหว่างเปิดหน้านี้ไว้ที่บูธ
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => run("status").catch(() => undefined), 15000);
    return () => clearInterval(t);
  }, [authed, run]);

  const totalWin = rows.reduce((a, p) => a + (p.enabled && p.left > 0 ? Number(p.chance) : 0), 0);

  const exportCsv = async () => {
    try {
      const d = await staff<Status>(pin, "status", { limit: 20000 });
      const head = ["time", "name", "major", "prize"];
      const lines = [head, ...d.recent.map((x) => [x.time, x.name ?? "", x.major ?? "", x.prize_name ?? "ขอบคุณจ้า"])];
      const csv = "﻿" + lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = `nextopia-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (e) {
      setMsg(errText(e));
    }
  };

  if (!authed) {
    return (
      <main className="play">
        <div className="card tabbed fade-in">
          <h2 className="tab"><PixelIcon name="shield" /> Staff · CAMT Nextopia</h2>
          <p>ใส่ PIN สตาฟเพื่อจัดการของรางวัล</p>
          <input
            className="input"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="PIN"
            aria-label="PIN สตาฟ"
          />
          <div className="error" role="alert">{msg}</div>
          <button className="btn" onClick={login} disabled={busy || !pin}>
            เข้าสู่ระบบ
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="play staff">
      <div className="qmeta">
        <a href="/">◀ หน้าเกม</a>
        <span>{busy ? "กำลังโหลด..." : "Staff Console"}</span>
      </div>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="trophy" /> ของรางวัล</h2>
        <div className="prize-table">
          {rows.map((p, i) => (
            <div className="prize-line" key={p.id}>
              <PixelIcon name={PRIZE_ICON[p.id]} size={28} />
              <b>{p.name}</b>
              <label>
                สต็อก
                <input type="number" min={0} value={p.stock} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, stock: Math.max(0, parseInt(e.target.value, 10) || 0) } : r)))} />
              </label>
              <label>
                โอกาส %
                <input type="number" min={0} max={100} step={0.5} value={p.chance} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, chance: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) } : r)))} />
              </label>
              <label className="chk">
                <input type="checkbox" checked={p.enabled} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, enabled: e.target.checked } : r)))} /> เปิด
              </label>
              <span className="muted">แจกแล้ว {p.given} · เหลือ {p.left}</span>
            </div>
          ))}
        </div>
        <p className="muted">
          โอกาสได้รางวัลรวมตอนนี้ ≈ {totalWin.toFixed(1)}% (ประมาณ {Math.round(totalWin)} คนต่อ 100 คน) · ของหมดแล้วระบบไม่แจกต่อเอง
        </p>
        <button className="btn" onClick={() => run("update_prizes", { prizes: rows }).catch(() => undefined)}>
          บันทึกการตั้งค่า
        </button>
      </section>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="flag" /> รอบอบรม</h2>
        <p>
          ทั้งหมด <b>{data?.total_spins ?? 0}</b> คน · ได้รางวัล <b>{data?.total_wins ?? 0}</b> คน
          {data && Object.keys(data.by_major).length > 0 && (
            <span className="muted"> · {Object.entries(data.by_major).map(([k, v]) => `${k} ${v}`).join(" · ")}</span>
          )}
        </p>
        <button
          className="btn secondary"
          onClick={() => {
            if (!confirm("เริ่มรอบโรงเรียนใหม่?\nระบบจะล้างประวัติผู้เล่นทั้งหมดและคืนสต็อกของรางวัลให้เต็ม")) return;
            if (prompt("พิมพ์คำว่า RESET เพื่อยืนยัน") !== "RESET") return;
            run("reset_all").catch(() => undefined);
          }}
        >
          เริ่มรอบโรงเรียนใหม่ (ล้างข้อมูล + คืนสต็อก)
        </button>
        <label className="chk kiosk">
          <input
            type="checkbox"
            checked={kiosk}
            onChange={(e) => {
              setKioskPin(e.target.checked ? pin : null);
              setKiosk(e.target.checked);
            }}
          />{" "}
          โหมดบูธ: เครื่องนี้ใช้ร่วมกันหลายคน (ทุกคนที่เล่นจบได้ลุ้นรางวัลคนละ 1 ครั้ง)
        </label>
        <div className="error" role="alert">{msg}</div>
      </section>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="clipboard" /> ประวัติล่าสุด</h2>
        <div className="history">
          {(data?.recent ?? []).map((x, i) => (
            <div key={i} className={x.prize_id ? "w" : ""}>
              <span>{new Date(x.time).toLocaleTimeString("th-TH")}</span>
              <span>{x.name ?? "-"}</span>
              <span>{x.major ?? "-"}</span>
              <span>{x.prize_id ? x.prize_name : "ขอบคุณจ้า"}</span>
            </div>
          ))}
          {!data?.recent?.length && <p className="muted">ยังไม่มีผู้เล่น</p>}
        </div>
        <button className="btn ghost" onClick={exportCsv}>
          ดาวน์โหลดประวัติ (CSV)
        </button>
      </section>
    </main>
  );
}
