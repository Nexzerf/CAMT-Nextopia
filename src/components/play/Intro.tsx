"use client";

import Character from "@/components/Character";
import NextopiaLogo from "@/components/NextopiaLogo";
import PixelIcon from "@/components/PixelIcon";
import { MAJORS, MAJOR_ORDER, QUESTIONS } from "@/lib/majors";
import type { Look } from "@/lib/sprite";

/** ตัวละครตัวอย่างใส่ชุดของแต่ละสาขา */
const CROWD: { look: Look; outfit: number; walk?: boolean }[] = [
  { look: { gender: "f", hair: 11, hairColor: 4, skin: 1 }, outfit: MAJORS.ANI.id, walk: true },
  { look: { gender: "m", hair: 8, hairColor: 9, skin: 0 }, outfit: MAJORS.SE.id },
  { look: { gender: "f", hair: 10, hairColor: 6, skin: 2 }, outfit: MAJORS.MMIT.id, walk: true },
  { look: { gender: "m", hair: 19, hairColor: 7, skin: 0 }, outfit: MAJORS.DG.id },
  { look: { gender: "f", hair: 15, hairColor: 8, skin: 1 }, outfit: MAJORS.DII.id, walk: true },
];

export default function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="fade-in">
      <div className="intro-brand">
        <NextopiaLogo size={40} />
      </div>
      <h1 className="logo">
        CAMT NEXTOPIA
        <small>วิทยาลัยศิลปะ สื่อ และเทคโนโลยี มช.</small>
      </h1>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="scene" style={{ boxShadow: "none", height: 200 }}>
          {CROWD.map((c, i) => (
            <Character key={i} look={c.look} persona={c.outfit} size={2.5} walk={c.walk} />
          ))}
        </div>
      </div>

      <div className="card tabbed">
        <h2 className="tab"><PixelIcon name="bolt" /> ภารกิจใหม่ปลดล็อกแล้ว!</h2>
        <h2>คุณเหมาะกับสาขาไหนใน CAMT?</h2>
        <p>
          สร้างตัวละครของคุณ แล้วผ่าน <b>{QUESTIONS.length} ด่านสถานการณ์</b> ระบบจะบอกว่าคุณเหมาะกับสาขาไหนใน <b>5 สาขาของ CAMT</b> <PixelIcon name="gamepad" />
        </p>
        <div className="major-strip">
          {MAJOR_ORDER.map((k) => (
            <span key={k} className="tag" style={{ ["--persona" as string]: MAJORS[k].color }}>
              <PixelIcon name={MAJORS[k].icon} /> {MAJORS[k].code}
            </span>
          ))}
        </div>
        <p>
          <PixelIcon name="trophy" /> <b>รางวัลภารกิจ:</b> ตอบครบแล้วระบบจะ<b>ลุ้นของรางวัลให้อัตโนมัติ</b> พร้อมการ์ดไว้อวดลงสตอรี่!
        </p>
        <button className="btn" onClick={onStart}>
          ▶ กดเริ่มเกม!
        </button>
      </div>

      <p className="note">
        เราเก็บแค่ชื่อเล่นและผลลัพธ์ เพื่อใช้ยืนยันการรับของรางวัลเท่านั้น
        <br />
        ไม่เก็บชื่อจริง เบอร์โทร หรือข้อมูลติดต่อ
      </p>
    </div>
  );
}
