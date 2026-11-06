"use client";

import { useEffect, useState } from "react";
import { SPRITE_H, SPRITE_W, WALK_CYCLE, characterDataUrl, type Dir, type Look } from "@/lib/sprite";

interface Props {
  look: Look;
  persona: number;
  /** ขนาด pixel ละกี่ px บนจอ */
  size?: number;
  walk?: boolean;
  /** ขอบขาวแบบสติกเกอร์ */
  sticker?: boolean;
  /** ทิศที่หัน; left = หันข้างแล้วกลับด้านภาพ */
  dir?: Dir | "left";
  alt?: string;
  className?: string;
}

export default function Character({ look, persona, size = 6, walk = false, sticker = false, dir = "down", alt = "", className = "" }: Props) {
  const [step, setStep] = useState(0);
  const frame = walk ? WALK_CYCLE[step % WALK_CYCLE.length] : 0;
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (!walk) return;
    // เดิน 4 จังหวะ: ก้าวซ้าย → ยืน → ก้าวขวา → ยืน
    const t = setInterval(() => setStep((s) => s + 1), 170);
    return () => clearInterval(t);
  }, [walk]);

  const { gender, hair, hairColor, skin } = look;
  useEffect(() => {
    setSrc(characterDataUrl({ gender, hair, hairColor, skin }, persona, frame, 6, { sticker, dir: dir === "left" ? "side" : dir }));
  }, [gender, hair, hairColor, skin, persona, frame, sticker, dir]);

  const w = SPRITE_W * size;
  const h = SPRITE_H * size;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`pixel ${className}`}
      src={src}
      width={w}
      height={h}
      alt={alt}
      draggable={false}
      style={{
        // ตัวยุบลงเล็กน้อยตอนก้าวเท้า ให้การเดินดูมีน้ำหนัก
        transform: `${dir === "left" ? "scaleX(-1) " : ""}translateY(${frame !== 0 ? size : 0}px)`,
      }}
    />
  ) : (
    <div className={className} style={{ width: w, height: h }} aria-hidden />
  );
}
