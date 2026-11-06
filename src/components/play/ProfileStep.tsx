"use client";

import { useState } from "react";
import Character from "@/components/Character";
import { NICK_MAX, validateNickname } from "@/lib/profanity";
import { GENDERS, HAIR_COLORS, HAIR_COLOR_NAMES, HAIR_STYLES, SKIN_TONES, randomLook, type Look } from "@/lib/sprite";
import PixelIcon from "@/components/PixelIcon";

interface Props {
  nickname: string;
  look: Look;
  onChange: (nickname: string, look: Look) => void;
  onNext: () => void;
  onBack: () => void;
}

/** หมวดแต่งตัวแบบเกม: เลือกหมวดด้านบน ตัวเลือกด้านล่าง ตัวละครค้างอยู่บนจอให้เห็นผลทันที */
const TABS = [
  { id: "hair", icon: "scissors", label: "ทรงผม" },
  { id: "color", icon: "palette", label: "สีผม" },
  { id: "skin", icon: "hand", label: "สีผิว" },
  { id: "gender", icon: "person", label: "เพศ" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function ProfileStep({ nickname, look, onChange, onNext, onBack }: Props) {
  const [touched, setTouched] = useState(false);
  const [tab, setTab] = useState<Tab>("hair");
  const error = validateNickname(nickname);
  // เปลี่ยนแค่ส่วนที่กด ส่วนอื่นคงเดิม
  const set = (patch: Partial<Look>) => onChange(nickname, { ...look, ...patch });

  return (
    <div className="fade-in">
      <div className="qmeta">
        <button onClick={onBack}>◀ กลับ</button>
        <span>สร้างตัวละคร</span>
      </div>

      {/* ตัวละครติดอยู่ด้านบนตลอด เลื่อนลงไปเลือกก็ยังเห็น */}
      <div className="dress-stage">
        <div className="scene dress-scene">
          <Character look={look} persona={0} size={4.5} walk sticker />
          <span className="dress-name">{nickname.trim() || "ชื่อของคุณ"}</span>
          <button className="btn secondary dice" onClick={() => onChange(nickname, randomLook(look.gender))} aria-label="สุ่มหน้าตา">
            <PixelIcon name="dice" /> สุ่ม
          </button>
        </div>
      </div>

      <div className="card tabbed">
        <h2 className="tab"><PixelIcon name="pencil" /> ชื่อเล่น</h2>
        <input
          id="nick"
          className="input"
          value={nickname}
          maxLength={NICK_MAX * 2}
          placeholder="เช่น มิ้นท์"
          autoComplete="off"
          enterKeyHint="done"
          aria-label="ชื่อเล่น"
          onChange={(e) => onChange(e.target.value, look)}
          onBlur={() => setTouched(true)}
        />
        <div className="error" role="alert">
          {touched && nickname ? error : ""}
        </div>
      </div>

      <div className="card dress-panel">
        <div className="dress-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} data-sfx="select" onClick={() => setTab(t.id)}>
              <PixelIcon name={t.icon} size={22} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="dress-body" role="tabpanel">
          {tab === "hair" && (
            <div className="hairs">
              {HAIR_STYLES.map((h, i) => (
                <button key={h} className="hair-opt" aria-pressed={look.hair === i} onClick={() => set({ hair: i })}>
                  <span className="head">
                    <Character look={{ ...look, hair: i }} persona={0} size={2} />
                  </span>
                  {h}
                </button>
              ))}
            </div>
          )}

          {tab === "color" && (
            <>
              <span className="label">สีผม · {HAIR_COLOR_NAMES[look.hairColor]}</span>
              <div className="chips">
                {HAIR_COLORS.map((c, i) => (
                  <button
                    key={c}
                    className="swatch"
                    style={{ background: c }}
                    aria-label={`สีผม${HAIR_COLOR_NAMES[i]}`}
                    aria-pressed={look.hairColor === i}
                    onClick={() => set({ hairColor: i })}
                  />
                ))}
              </div>
            </>
          )}

          {tab === "skin" && (
            <>
              <span className="label">สีผิว</span>
              <div className="chips">
                {SKIN_TONES.map((c, i) => (
                  <button
                    key={c}
                    className="swatch"
                    style={{ background: c }}
                    aria-label={`สีผิว ${i + 1}`}
                    aria-pressed={look.skin === i}
                    onClick={() => set({ skin: i })}
                  />
                ))}
              </div>
            </>
          )}

          {tab === "gender" && (
            <>
              <span className="label">เพศ (ทรงผมที่เลือกไว้ยังอยู่เหมือนเดิม)</span>
              <div className="chips">
                {GENDERS.map((g) => (
                  <button key={g.id} className="chip" aria-pressed={look.gender === g.id} onClick={() => set({ gender: g.id })}>
                    {g.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <p className="note dress-note">ชุดประจำสาขาจะปลดล็อกหลังตอบคำถามครบ 6 ข้อ</p>
      </div>

      <button
        className="btn"
        disabled={!!error}
        onClick={() => {
          setTouched(true);
          if (!error) onNext();
        }}
      >
        ไปตอบคำถาม ▶
      </button>
      {!!error && nickname && <p className="note">{error}</p>}
    </div>
  );
}
