import { MAJORS, MAJOR_ORDER, QUESTIONS, type Major, type MajorCode } from "./majors";

export type Scores = Record<MajorCode, number>;

export function computeScores(answers: number[]): Scores {
  const s: Scores = { SE: 0, MMIT: 0, ANI: 0, DG: 0, DII: 0 };
  answers.forEach((choice, i) => {
    const opt = QUESTIONS[i]?.options[choice];
    if (!opt) return;
    for (const k of Object.keys(opt.score) as MajorCode[]) s[k] += opt.score[k] ?? 0;
  });
  return s;
}

export interface Ranked {
  major: Major;
  score: number;
  /** % ของคะแนนรวม */
  pct: number;
}

/** เรียงสาขาจากเข้ากันมากไปน้อย; เสมอกันให้ดูคำตอบข้อหลัง ๆ (ความฝันในอนาคต) เป็นตัวตัดสิน */
export function rankMajors(answers: number[]): Ranked[] {
  const s = computeScores(answers);
  const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
  const tieBreak = (code: MajorCode) => {
    for (let i = answers.length - 1; i >= 0; i--) {
      const pts = QUESTIONS[i]?.options[answers[i]]?.score[code] ?? 0;
      if (pts >= 3) return i;
    }
    return -1;
  };
  return MAJOR_ORDER.map((code) => ({ major: MAJORS[code], score: s[code], pct: Math.round((s[code] / total) * 100) })).sort(
    (a, b) => b.score - a.score || tieBreak(b.major.code) - tieBreak(a.major.code),
  );
}
