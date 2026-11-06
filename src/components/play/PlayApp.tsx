"use client";

import { useEffect, useMemo, useState } from "react";
import Character from "@/components/Character";
import PixelIcon from "@/components/PixelIcon";
import { QUESTIONS } from "@/lib/majors";
import { rankMajors } from "@/lib/scoring";
import { DEFAULT_LOOK, clampLook, type Look } from "@/lib/sprite";
import { cleanNickname } from "@/lib/profanity";
import { drawPrize, kioskPin, type PrizeResult } from "@/lib/prize";
import { isMuted, onMuteChange, setMuted, sfx, startMusic, unlock } from "@/lib/audio";
import Intro from "./Intro";
import ProfileStep from "./ProfileStep";
import QuizStep from "./QuizStep";
import ResultView from "./ResultView";

type Step = "intro" | "profile" | "quiz" | "loading" | "result";

export type PrizeState = { status: "ok"; result: PrizeResult } | { status: "error"; message: string };

interface Session {
  step: Step;
  nickname: string;
  look: Look;
  answers: number[];
  q: number;
  prize?: PrizeState;
}

const KEY = "nextopia.session.v2";
const EMPTY: Session = { step: "intro", nickname: "", look: DEFAULT_LOOK, answers: [], q: 0 };

function load(): Session {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!s || typeof s !== "object") return EMPTY;
    const step: Step = ["intro", "profile", "quiz", "result"].includes(s.step) ? s.step : "intro";
    const answers = Array.isArray(s.answers) ? s.answers.filter((n: unknown) => typeof n === "number") : [];
    const session: Session = {
      step,
      nickname: typeof s.nickname === "string" ? s.nickname : "",
      look: clampLook(s.look),
      answers,
      q: Math.min(Math.max(0, Number(s.q) || 0), QUESTIONS.length - 1),
      prize: s.prize && (s.prize.status === "ok" || s.prize.status === "error") ? s.prize : undefined,
    };
    if (session.step === "result" && answers.length < QUESTIONS.length) session.step = "intro";
    if (session.step !== "intro" && !session.nickname) session.step = "profile";
    return session;
  } catch {
    return EMPTY;
  }
}

function prizeError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/kiosk pin/.test(m)) return "PIN โหมดบูธไม่ถูกต้อง แจ้งพี่สตาฟนะ";
  return "เชื่อมต่อระบบรางวัลไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วกดลองอีกครั้ง";
}

export default function PlayApp() {
  const [s, setS] = useState<Session | null>(null);
  const [muted, setMutedState] = useState(false);

  // เสียงปุ่ม: ทุกปุ่มมีเสียงแตะ ปุ่มที่ระบุ data-sfx ใช้เสียงเฉพาะ
  useEffect(() => {
    setMutedState(isMuted());
    const off = onMuteChange(setMutedState);
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement | null)?.closest("button");
      if (!btn || btn.disabled) return;
      unlock();
      startMusic({ soft: true });
      const kind = btn.dataset.sfx;
      if (kind === "none") return;
      if (kind === "select") sfx.select();
      else if (kind === "back") sfx.back();
      else if (kind === "share") sfx.share();
      else sfx.tap();
    };
    document.addEventListener("click", onClick);
    const onTouch = () => {
      unlock();
      startMusic({ soft: true });
    };
    document.addEventListener("touchend", onTouch);
    return () => {
      off();
      document.removeEventListener("click", onClick);
      document.removeEventListener("touchend", onTouch);
    };
  }, []);

  useEffect(() => setS(load()), []);

  useEffect(() => {
    if (!s) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...s, step: s.step === "loading" ? "quiz" : s.step }));
    } catch {
      /* ignore */
    }
  }, [s]);

  const stepKey = s ? `${s.step}-${s.step === "quiz" ? s.q : ""}` : "";
  useEffect(() => {
    if (stepKey) window.scrollTo({ top: 0 });
  }, [stepKey]);

  const ranking = useMemo(() => (s && s.answers.length >= QUESTIONS.length ? rankMajors(s.answers) : null), [s]);

  if (!s) return <main className="play" />;

  const update = (patch: Partial<Session>) => setS((prev) => (prev ? { ...prev, ...patch } : prev));

  const requestPrize = async (answers: number[]): Promise<PrizeState> => {
    const major = rankMajors(answers)[0].major.code;
    try {
      return { status: "ok", result: await drawPrize(cleanNickname(s.nickname), major) };
    } catch (e) {
      return { status: "error", message: prizeError(e) };
    }
  };

  const finish = async (answers: number[]) => {
    update({ answers, step: "loading", prize: undefined });
    sfx.loading();
    // ลุ้นรางวัลบนเซิร์ฟเวอร์ไปพร้อมกับหน้าโหลด (อย่างน้อย 1.8 วิ ให้รู้สึกลุ้น)
    const [prize] = await Promise.all([requestPrize(answers), new Promise((r) => setTimeout(r, 1800))]);
    update({ step: "result", prize });
    sfx.reveal();
  };

  const retryPrize = async () => {
    update({ prize: undefined });
    const prize = await requestPrize(s.answers);
    update({ prize });
  };

  const replay = () => {
    // เครื่องบูธ: คนถัดไปเริ่มจากหน้าตาใหม่และชื่อว่าง
    if (kioskPin()) update({ step: "profile", nickname: "", look: DEFAULT_LOOK, answers: [], q: 0, prize: undefined });
    else update({ step: "profile", answers: [], q: 0, prize: undefined });
  };

  return (
    <main className="play">
      <button className="sound-toggle" data-sfx="none" onClick={() => setMuted(!muted)} aria-label={muted ? "เปิดเสียง" : "ปิดเสียง"}>
        <PixelIcon name={muted ? "mute" : "sound"} size={22} />
      </button>
      {s.step === "intro" && <Intro onStart={() => update({ step: "profile" })} />}

      {s.step === "profile" && (
        <ProfileStep
          nickname={s.nickname}
          look={s.look}
          onChange={(nickname, look) => update({ nickname, look })}
          onNext={() => update({ step: "quiz", q: 0, answers: [] })}
          onBack={() => update({ step: "intro" })}
        />
      )}

      {s.step === "quiz" && (
        <QuizStep
          index={s.q}
          answers={s.answers}
          look={s.look}
          onAnswer={(choice) => {
            const answers = s.answers.slice(0, s.q);
            answers[s.q] = choice;
            if (s.q + 1 >= QUESTIONS.length) finish(answers);
            else {
              update({ answers, q: s.q + 1 });
              sfx.step(s.q + 1);
            }
          }}
          onBack={() => (s.q === 0 ? update({ step: "profile" }) : update({ q: s.q - 1 }))}
        />
      )}

      {s.step === "loading" && (
        <div className="loading fade-in">
          <div className="logo" style={{ fontSize: 26 }}>
            LOADING...
          </div>
          <div style={{ marginTop: 24 }}>
            <Character look={s.look} persona={0} size={4} walk sticker />
          </div>
          <div className="bar">
            <div />
          </div>
          <p>กำลังหาสาขาที่ใช่ และลุ้นของรางวัลให้ {s.nickname}</p>
        </div>
      )}

      {s.step === "result" && ranking && (
        <ResultView
          nickname={cleanNickname(s.nickname)}
          look={s.look}
          ranking={ranking}
          prize={s.prize}
          onRetryPrize={retryPrize}
          onReplay={replay}
        />
      )}
    </main>
  );
}
