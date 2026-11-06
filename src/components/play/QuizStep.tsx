"use client";

import { useEffect, useState } from "react";
import Character from "@/components/Character";
import { QUESTIONS } from "@/lib/majors";
import type { Look } from "@/lib/sprite";
import PixelIcon from "@/components/PixelIcon";

interface Props {
  index: number;
  answers: number[];
  look: Look;
  onAnswer: (choice: number) => void;
  onBack: () => void;
}

const KEYS = ["A", "B", "C", "D", "E"];

export default function QuizStep({ index, answers, look, onAnswer, onBack }: Props) {
  const q = QUESTIONS[index];
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => setPicked(null), [index]);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    // หน่วงนิดหนึ่งให้เห็นว่าเลือกอะไร
    setTimeout(() => onAnswer(i), 220);
  };

  const selected = picked ?? answers[index];
  const pct = (index / QUESTIONS.length) * 100;

  return (
    <div>
      <div className="qmeta">
        <button data-sfx="back" onClick={onBack}>
          ◀ ย้อนกลับ
        </button>
        <span>
          ข้อ {index + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* ตัวละครเดินไปตามทางสู่ธงเส้นชัย */}
      <div className="trail" aria-hidden>
        <div className="path" />
        <div className="done" style={{ width: `calc(${pct}% + 8px)` }} />
        <span className="flag"><PixelIcon name="flag" size={24} /></span>
        <div className="walker" style={{ left: `${pct}%` }}>
          <Character look={look} persona={0} size={1.75} walk />
        </div>
      </div>

      <div key={index} className="fade-in">
        <div className="qcard">
          <div className="qzone">ZONE {String(index + 1).padStart(2, "0")} · {q.zone}</div>
          <div className="qemoji" aria-hidden>
            <PixelIcon name={q.icon} />
          </div>
          <h2 className="qtext">{q.text}</h2>
        </div>

        {q.options.map((o, i) => (
          <button key={i} className="option" data-sfx="select" aria-pressed={selected === i} onClick={() => choose(i)}>
            <span className="key">{KEYS[i]}</span>
            <span>{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
