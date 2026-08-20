/**
 * Nº 007 · โอเคมิเตอร์ — ตรรกะและคำวินิจฉัย
 *
 * ข้อความที่ท่านสมาชิกวางไว้จะถูกวิเคราะห์ในเบราว์เซอร์เท่านั้น
 * และไม่ถูกส่งไปกับลิงก์แชร์ ส่งไปเฉพาะคะแนนกับดัชนีคำวินิจฉัย
 */

import type { Outcome, PieceLogic, ShareState } from "@/lib/share";

type Verdict = { label: string; verdict: string; note: string };

/** คำวินิจฉัยเรียงจากไม่โอเคที่สุดไปโอเคที่สุด ลำดับในอาร์เรย์คือค่า v */
const VERDICTS: readonly Verdict[] = [
  {
    label: "มิได้โอเคแม้แต่น้อย",
    verdict: "สมาคมขอเรียนว่าถ้อยคำนั้นสุภาพมากจนน่ากลัว ท่านสมาชิกโปรดเตรียมตัว",
    note: "แนะนำให้โทรกลับ ไม่ใช่พิมพ์กลับ",
  },
  {
    label: "ค่อนข้างไม่โอเค",
    verdict: "อีกฝ่ายกำลังโอเคแบบผู้ใหญ่ กล่าวคือไม่โอเคแต่จะไม่บอกท่าน",
    note: "สมาคมแนะนำให้ถามซ้ำด้วยถ้อยคำอ่อนโยน",
  },
  {
    label: "โอเคตามมารยาท",
    verdict: "เป็นความโอเคระดับพนักงานต้อนรับ กล่าวคือโอเคตามหน้าที่",
    note: "ยังไม่ถึงขั้นต้องกังวล แต่ยังวางใจไม่ได้",
  },
  {
    label: "โอเคพอสมควร",
    verdict: "อีกฝ่ายโอเคจริงตามสมควรแก่กรณี ท่านสมาชิกนอนหลับได้",
    note: "สมาคมขอแสดงความยินดีอย่างสังเขป",
  },
  {
    label: "โอเคอย่างแท้จริง",
    verdict: "ถ้อยคำนั้นเปี่ยมด้วยความโอเค สมาคมตรวจแล้วไม่พบเงื่อนงำใด",
    note: "กรณีนี้พบได้ยาก โปรดเก็บรักษาไว้ให้ดี",
  },
];

/** ตัวบ่งชี้ที่ทำให้คะแนนความโอเคลดลง พร้อมน้ำหนัก */
const NEGATIVE_SIGNALS: readonly [RegExp, number][] = [
  [/^\s*(ค่ะ|คะ|ครับ|คับ)\s*$/u, -34],
  [/ไม่เป็นไร/u, -22],
  [/อะไรก็ได้/u, -20],
  [/ตามสบาย/u, -18],
  [/แล้วแต่/u, -16],
  [/เออ|อืม|อ่อ|อ้อ/u, -12],
  [/\.\s*$/u, -14],
  [/^\s*(โอเค|ok|okay)\s*[.\s]*$/iu, -12],
  [/ทำไม/u, -10],
  [/จบนะ|พอแล้ว|ไม่ต้อง/u, -18],
];

/** ตัวบ่งชี้ที่ทำให้คะแนนความโอเคเพิ่มขึ้น พร้อมน้ำหนัก */
const POSITIVE_SIGNALS: readonly [RegExp, number][] = [
  [/5{3,}/u, 24],
  [/จ้า|จ๊ะ|น้าา|นะคะ|นะครับ/u, 16],
  [/!/u, 10],
  [/ขอบคุณ|ขอบใจ/u, 14],
  [/(.)\1{2,}/u, 12],
  [/ๆ/u, 8],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, 18],
];

/**
 * ประเมินระดับความโอเคจากข้อความที่ได้รับ
 *
 * เป็น pure function เพื่อให้เขียน unit test ได้ตรงไปตรงมา
 *
 * @param message - ข้อความที่อีกฝ่ายส่งมา
 * @returns คะแนน 0–100 ยิ่งมากยิ่งโอเค
 */
export function scoreMessage(message: string): number {
  const text = message.trim();
  if (text.length === 0) return 50;

  let score = 50;

  for (const [pattern, weight] of NEGATIVE_SIGNALS) {
    if (pattern.test(text)) score += weight;
  }
  for (const [pattern, weight] of POSITIVE_SIGNALS) {
    if (pattern.test(text)) score += weight;
  }

  // ข้อความยาวแปลว่าอีกฝ่ายยังอยากคุยด้วย ข้อความสั้นห้วนแปลว่าตรงข้าม
  if (text.length <= 4) score -= 12;
  else if (text.length >= 60) score += 10;

  return Math.max(0, Math.min(100, score));
}

/** แปลงคะแนนเป็นดัชนีคำวินิจฉัย */
export function verdictIndexFor(score: number): number {
  const index = Math.floor(score / 20);
  return Math.max(0, Math.min(VERDICTS.length - 1, index));
}

/** ป้ายกำกับระดับความโอเค ใช้แสดงในหน้าเว็บ */
export function labelFor(index: number): string {
  return (VERDICTS[index] ?? VERDICTS[0]).label;
}

export const logic: PieceLogic = {
  verdictCount: VERDICTS.length,

  toOutcome(state: ShareState): Outcome {
    const verdict = VERDICTS[state.v] ?? VERDICTS[0];
    return {
      headline: state.s === undefined ? verdict.label : `โอเค ${state.s}%`,
      verdict: verdict.verdict,
      note: verdict.note,
    };
  },
};
