"use client";

import { useCallback, useEffect, useState } from "react";
import PixelIcon from "@/components/PixelIcon";
import { PRIZE_ICON_CHOICES, kioskPin, prizeIcon, setKioskPin, staff } from "@/lib/prize";

interface PrizeRow {
  id: string;
  name: string;
  icon: string;
  stock: number;
  given: number;
  left: number;
  chance: number;
  enabled: boolean;
  /** โอกาส (%) ของการสุ่มครั้งถัดไป ตามโหมดที่ตั้งไว้ */
  now: number;
}
interface SpinRow {
  time: string;
  name: string | null;
  major: string | null;
  prize_id: string | null;
  prize_name: string | null;
}
interface Status {
  note: string | null;
  plan: { auto: boolean; expected: number; played: number; remain: number };
  plan_settings: { auto: boolean; expected: number };
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
  if (/name required/.test(m)) return "ใส่ชื่อของรางวัลก่อน";
  return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: " + m;
}

const fmtPct = (n: number) => (n >= 10 ? n.toFixed(0) : n >= 1 ? n.toFixed(1) : n.toFixed(2));

export default function StaffApp() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Status | null>(null);
  const [rows, setRows] = useState<PrizeRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [kiosk, setKiosk] = useState(false);
  // แผนวันนี้
  const [expected, setExpected] = useState(100);
  const [auto, setAuto] = useState(true);
  // ฟอร์มเพิ่มของรางวัล
  const [newName, setNewName] = useState("");
  const [newStock, setNewStock] = useState(1);
  const [newIcon, setNewIcon] = useState("trophy");

  useEffect(() => setKiosk(!!kioskPin()), []);

  const apply = (d: Status, keepEdits = false) => {
    setData(d);
    if (!keepEdits) {
      setRows(d.prizes);
      setDirty(false);
      setExpected(d.plan_settings?.expected ?? 0);
      setAuto(!!d.plan_settings?.auto);
    }
  };

  const run = useCallback(
    async (action: string, payload: Record<string, unknown> = {}, opts: { keepEdits?: boolean; done?: string } = {}) => {
      setBusy(true);
      setMsg("");
      setOk("");
      try {
        const d = await staff<Status>(pin, action, payload);
        apply(d, opts.keepEdits);
        if (opts.done) setOk(opts.done);
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

  // รีเฟรชตัวเลขทุก 15 วิ (ไม่ทับสิ่งที่กำลังแก้อยู่)
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => {
      staff<Status>(pin, "status")
        .then((d) => apply(d, dirty))
        .catch(() => undefined);
    }, 15000);
    return () => clearInterval(t);
  }, [authed, pin, dirty]);

  const edit = (i: number, patch: Partial<PrizeRow>) => {
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const savePrizes = () =>
    run(
      "update_prizes",
      { prizes: rows.map((r) => ({ id: r.id, name: r.name, icon: r.icon, stock: r.stock, chance: r.chance, enabled: r.enabled })) },
      { done: "บันทึกของรางวัลแล้ว" },
    ).catch(() => undefined);

  const savePlan = () => run("set_plan", { expected, auto }, { keepEdits: dirty, done: "บันทึกแผนวันนี้แล้ว" }).catch(() => undefined);

  const addPrize = async () => {
    if (!newName.trim()) {
      setMsg("ใส่ชื่อของรางวัลก่อน");
      return;
    }
    try {
      await run("add_prize", { name: newName.trim(), stock: newStock, icon: newIcon, chance: 1 }, { done: `เพิ่ม "${newName.trim()}" แล้ว` });
      setNewName("");
      setNewStock(1);
      setNewIcon("trophy");
    } catch {
      /* msg already set */
    }
  };

  const removePrize = async (p: PrizeRow) => {
    if (!confirm(`ลบ "${p.name}" ออกจากรายการของรางวัล?`)) return;
    try {
      const d = await run("delete_prize", { id: p.id });
      if (d.note === "disabled") setOk(`"${p.name}" มีคนได้ไปแล้ว จึงปิดไว้แทนการลบ (ประวัติยังอยู่ครบ)`);
      else setOk(`ลบ "${p.name}" แล้ว`);
    } catch {
      /* msg already set */
    }
  };

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

  const plan = data?.plan;
  const totalLeft = rows.filter((r) => r.enabled).reduce((a, r) => a + r.left, 0);
  const totalNow = (data?.prizes ?? []).reduce((a, p) => a + Number(p.now), 0);

  return (
    <main className="play staff">
      <div className="qmeta">
        <a href="/">◀ หน้าเกม</a>
        <span>{busy ? "กำลังโหลด..." : "Staff Console"}</span>
      </div>

      {(msg || ok) && (
        <div className={`staff-msg ${msg ? "bad" : "good"}`} role="status">
          {msg || ok}
        </div>
      )}

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="flag" /> แผนวันนี้</h2>
        <label className="field-row">
          <span>จำนวนคนที่คาดว่าจะมาเล่นวันนี้</span>
          <input className="input" type="number" min={0} max={100000} value={expected} onChange={(e) => setExpected(Math.max(0, parseInt(e.target.value, 10) || 0))} />
        </label>
        <label className="chk">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> ให้ระบบคำนวณโอกาสอัตโนมัติจากจำนวนของรางวัลและจำนวนคน
        </label>
        <p className="muted">
          {auto
            ? "ทุกครั้งที่สุ่ม โอกาสได้แต่ละรางวัล = จำนวนที่เหลือ ÷ จำนวนคนที่ยังไม่ได้เล่น ของจะทยอยออกทั้งวันและหมดพอดีเมื่อคนเล่นครบ (ถ้าคนมาเกินที่คาด ของที่เหลือจะแจกให้คนถัดไปจนหมด)"
            : "โหมดกำหนดเอง: ใช้ % โอกาสที่ตั้งไว้ในแต่ละรางวัลด้านล่าง"}
        </p>
        <button className="btn" onClick={savePlan} disabled={busy}>
          บันทึกแผนวันนี้
        </button>
        {plan && (
          <div className="plan-stats">
            <div>
              <b>{plan.played}</b>
              <span>เล่นไปแล้ว</span>
            </div>
            <div>
              <b>{plan.auto ? Math.max(plan.expected - plan.played, 0) : "–"}</b>
              <span>ยังไม่ได้เล่น</span>
            </div>
            <div>
              <b>{totalLeft}</b>
              <span>ของรางวัลเหลือ</span>
            </div>
            <div>
              <b>{fmtPct(totalNow)}%</b>
              <span>โอกาสได้รางวัลตอนนี้</span>
            </div>
          </div>
        )}
      </section>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="trophy" /> ของรางวัล</h2>
        <div className="prize-table">
          {rows.map((p, i) => {
            const live = data?.prizes.find((x) => x.id === p.id);
            return (
              <div className={`prize-line${p.enabled ? "" : " off"}`} key={p.id}>
                <div className="prize-head">
                  <PixelIcon name={prizeIcon(p.icon)} size={30} />
                  <input className="name-input" value={p.name} maxLength={40} onChange={(e) => edit(i, { name: e.target.value })} aria-label="ชื่อของรางวัล" />
                  <button className="del" onClick={() => removePrize(p)} aria-label={`ลบ ${p.name}`} title="ลบ">
                    ✕
                  </button>
                </div>
                <div className="prize-fields">
                  <label>
                    รูป
                    <select value={p.icon} onChange={(e) => edit(i, { icon: e.target.value })}>
                      {PRIZE_ICON_CHOICES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    จำนวนทั้งหมด
                    <input type="number" min={0} value={p.stock} onChange={(e) => edit(i, { stock: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                  </label>
                  {!auto && (
                    <label>
                      โอกาส %
                      <input type="number" min={0} max={100} step={0.5} value={p.chance} onChange={(e) => edit(i, { chance: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })} />
                    </label>
                  )}
                  <label className="chk inline">
                    <input type="checkbox" checked={p.enabled} onChange={(e) => edit(i, { enabled: e.target.checked })} /> เปิดแจก
                  </label>
                </div>
                <div className="prize-meta">
                  <span>แจกแล้ว {p.given}</span>
                  <span>เหลือ {Math.max(p.stock - p.given, 0)}</span>
                  <span className="odds">โอกาสตอนนี้ {live ? fmtPct(Number(live.now)) : "–"}%</span>
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn" onClick={savePrizes} disabled={busy || !dirty}>
          {dirty ? "บันทึกการแก้ไขของรางวัล" : "ยังไม่มีการแก้ไข"}
        </button>

        <div className="add-prize">
          <h3>
            <PixelIcon name="star" /> เพิ่มของรางวัลใหม่
          </h3>
          <div className="prize-fields">
            <label className="grow">
              ชื่อ
              <input value={newName} maxLength={40} placeholder="เช่น สติกเกอร์ CAMT" onChange={(e) => setNewName(e.target.value)} />
            </label>
            <label>
              จำนวน
              <input type="number" min={0} value={newStock} onChange={(e) => setNewStock(Math.max(0, parseInt(e.target.value, 10) || 0))} />
            </label>
            <label>
              รูป
              <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)}>
                {PRIZE_ICON_CHOICES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <PixelIcon name={prizeIcon(newIcon)} size={34} />
          </div>
          <button className="btn secondary" onClick={addPrize} disabled={busy}>
            + เพิ่มของรางวัล
          </button>
        </div>
      </section>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="team" /> รอบอบรม</h2>
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
            run("reset_all", {}, { done: "เริ่มรอบใหม่แล้ว อย่าลืมกรอกจำนวนคนของโรงเรียนนี้ในแผนวันนี้" }).catch(() => undefined);
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
