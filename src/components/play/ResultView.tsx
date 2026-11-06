"use client";

import { useEffect, useRef, useState } from "react";
import Character from "@/components/Character";
import PixelIcon from "@/components/PixelIcon";
import { CAMT_FACTS, CAMT_PERKS } from "@/lib/majors";
import { PRIZE_ICON } from "@/lib/prize";
import type { Ranked } from "@/lib/scoring";
import type { PreparedCard } from "@/lib/share";
import type { Look } from "@/lib/sprite";
import type { PrizeState } from "./PlayApp";

interface Props {
  nickname: string;
  look: Look;
  ranking: Ranked[];
  prize?: PrizeState;
  onRetryPrize: () => void;
  onReplay: () => void;
}

/** ผลลุ้นของรางวัล (ระบบสุ่มให้อัตโนมัติบนเซิร์ฟเวอร์ ไม่ต้องหมุนวงล้อ) */
function PrizeCard({ prize, onRetry }: { prize?: PrizeState; onRetry: () => void }) {
  if (!prize) {
    return (
      <section className="card tabbed prize-card">
        <h2 className="tab"><PixelIcon name="trophy" /> ผลลุ้นของรางวัล</h2>
        <p className="center">กำลังเปิดกล่องรางวัล...</p>
      </section>
    );
  }

  if (prize.status === "error") {
    return (
      <section className="card tabbed prize-card">
        <h2 className="tab"><PixelIcon name="trophy" /> ผลลุ้นของรางวัล</h2>
        <p>{prize.message}</p>
        <button className="btn secondary" onClick={onRetry}>
          ลองลุ้นอีกครั้ง
        </button>
      </section>
    );
  }

  const r = prize.result;
  if (r.prize_id) {
    return (
      <section className="card tabbed prize-card win">
        <h2 className="tab"><PixelIcon name="trophy" /> ได้ของรางวัล!</h2>
        <div className="prize-show">
          <span className="prize-icon big">
            <PixelIcon name={PRIZE_ICON[r.prize_id]} size={112} />
          </span>
          <div className="prize-name">{r.prize_name}</div>
          {r.already && <div className="muted">เครื่องนี้ลุ้นไปแล้ว นี่คือรางวัลเดิมของคุณ</div>}
          <div className="show-staff">แสดงหน้าจอนี้ให้พี่สตาฟ CAMT ดู เพื่อรับของรางวัล</div>
        </div>
      </section>
    );
  }

  return (
    <section className="card tabbed prize-card">
      <h2 className="tab"><PixelIcon name="star" /> ผลลุ้นของรางวัล</h2>
      <div className="prize-row">
        <span className="prize-icon lose">
          <PixelIcon name="party" size={56} />
        </span>
        <div>
          <div className="prize-name">ขอบคุณจ้า</div>
          <div className="muted">
            {r.already ? "เครื่องนี้ลุ้นไปแล้ว รอบนี้ยังไม่ได้ของรางวัลนะ" : "รอบนี้ยังไม่ได้ของรางวัล แต่ขอบคุณที่มาร่วมสนุก เจอกันที่ CAMT มช.!"}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ResultView({ nickname, look, ranking, prize, onRetryPrize, onReplay }: Props) {
  const top = ranking[0];
  const p = top.major;

  // เตรียมการ์ดสตอรี่ล่วงหน้า
  const [card, setCard] = useState<PreparedCard | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const shareLib = useRef<typeof import("@/lib/share") | null>(null);
  useEffect(() => {
    let alive = true;
    let url: string | undefined;
    import("@/lib/share")
      .then(async (lib) => {
        shareLib.current = lib;
        return lib.prepareCard(await lib.renderStoryCard({ nickname, look, persona: p }), p);
      })
      .then((prepared) => {
        url = prepared.url;
        if (alive) setCard(prepared);
        else URL.revokeObjectURL(prepared.url);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [nickname, look, p]);

  const onShare = async () => {
    if (!card || !shareLib.current) return;
    const outcome = await shareLib.current.shareCard(card, p);
    if (outcome === "fallback") setPreview(card.url);
  };

  return (
    <div className="fade-in" style={{ ["--persona" as string]: p.color }}>
      <PrizeCard prize={prize} onRetry={onRetryPrize} />

      <section className="hero">
        <div className="banner">
          <div className="kicker">{nickname} คือ...</div>
          <div className={`pname${p.persona.length > 14 ? " long" : ""}`}>{p.persona}</div>
          <div className="career">สาขาวิชา{p.nameTH}</div>
          <div className="careerTh">{p.nameEN}</div>
        </div>
        <div className="scene">
          <Character look={look} persona={p.id} size={6.5} walk sticker alt={`${nickname} ในชุด ${p.uniform}`} />
        </div>
        <div className="meta">
          ชุดประจำสาขา: <b>{p.uniform}</b>
          <div className="tags">
            <span className="tag">
              <PixelIcon name={p.icon} /> {p.program}
            </span>
            <span className="tag gold">เข้ากัน {top.pct}%</span>
          </div>
        </div>
      </section>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="bulb" /> ทำไมถึงเหมาะกับคุณ</h2>
        <p>
          <b>{p.personaTH}</b> — {p.tagline}
        </p>
        <p>{p.desc}</p>
        {p.highlights.map((h) => (
          <div className="reason" key={h}>
            <span className="pill">จุดเด่น</span>
            <span>{h}</span>
          </div>
        ))}
      </section>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="books" /> วิชาเด่นที่จะได้เรียน</h2>
        <div className="courses">
          {p.subjects.map((c, i) => (
            <div className="course" key={c}>
              <code>{String(i + 1).padStart(2, "0")}</code>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="ladder" /> เส้นทางอาชีพ</h2>
        <ol className="ladder">
          {p.careers.map((title, i) => (
            <li key={title} className={i === 0 ? "you" : ""}>
              <span className="lv">#{i + 1}</span>
              <span>{title}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="medal" /> สาขาที่เหมาะรองลงมา</h2>
        {ranking.slice(1).map((r, i) => (
          <div className="alt" key={r.major.code} style={{ ["--persona" as string]: r.major.color }}>
            <span className="rank">#{i + 2}</span>
            <Character look={look} persona={r.major.id} size={2} />
            <div className="meta">
              <b>{r.major.persona}</b>
              สาขาวิชา{r.major.nameTH}
              <div className="muted">{r.major.nameEN}</div>
            </div>
            <span className="pct">{r.pct}%</span>
          </div>
        ))}
      </section>

      <section className="card tabbed">
        <h2 className="tab"><PixelIcon name="gradcap" /> ทำไมต้อง CAMT</h2>
        <div className="facts">
          {CAMT_FACTS.map((f) => (
            <div key={f.k}>
              <b>{f.k}</b>
              <span>{f.v}</span>
            </div>
          ))}
        </div>
        {CAMT_PERKS.map((t) => (
          <div className="reason" key={t}>
            <span className="pill">CAMT</span>
            <span>{t}</span>
          </div>
        ))}
      </section>

      <button className="btn ghost" onClick={onReplay}>
        ↺ เล่นใหม่อีกครั้ง
      </button>

      <div className="sticky">
        <div className="inner">
          <button className="btn" data-sfx="share" onClick={onShare} disabled={!card}>
            {card ? <><PixelIcon name="camera" /> แชร์ลงสตอรี่</> : "กำลังเตรียมการ์ด..."}
          </button>
        </div>
      </div>

      {preview && (
        <div className="sheet" role="dialog" aria-label="บันทึกรูปการ์ด" onClick={() => setPreview(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="การ์ดสตอรี่ CAMT Nextopia" onClick={(e) => e.stopPropagation()} />
          <div className="inner" onClick={(e) => e.stopPropagation()}>
            <p className="center" style={{ margin: "0 0 10px" }}>
              กดค้างที่รูปเพื่อบันทึก หรือกดปุ่มด้านล่าง แล้วโพสต์ลงสตอรี่ได้เลย
            </p>
            <div className="row">
              <button className="btn" onClick={() => shareLib.current?.downloadUrl(preview, `camt-nextopia-${p.slug}.png`)}>
                บันทึกรูป
              </button>
              <button className="btn secondary" onClick={() => setPreview(null)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
