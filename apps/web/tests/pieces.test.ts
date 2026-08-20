import { describe, expect, it } from "vitest";
import { getPieceLogic } from "@/lib/pieces";
import { PIECES } from "@/lib/registry";
import { logic as logic007, scoreMessage, verdictIndexFor as verdict007 } from "@/lib/pieces/007.logic";
import { formatDuration as duration018, verdictIndexFor as verdict018 } from "@/lib/pieces/018.logic";
import { listSpeakers } from "@/lib/pieces/031.logic";
import { DURATION_OPTIONS, formatDuration as duration055, verdictIndexFor as verdict055 } from "@/lib/pieces/055.logic";
import { verdictIndexFor as verdict064 } from "@/lib/pieces/064.logic";
import { FULL_ENERGY, QUESTIONS, energyFrom, verdictIndexFor as verdict077 } from "@/lib/pieces/077.logic";

describe("ทะเบียนชิ้นงาน", () => {
  it("ทุกชิ้นในทะเบียนต้องมีตรรกะที่ลงทะเบียนไว้แล้ว", () => {
    for (const piece of PIECES) {
      expect(getPieceLogic(piece.id), `ชิ้นงาน ${piece.id}`).toBeDefined();
    }
  });

  it("เลขประจำชิ้นงานต้องเป็นตัวเลขสามหลักและห้ามซ้ำ", () => {
    const ids = PIECES.map((piece) => piece.id);

    for (const id of ids) expect(id).toMatch(/^\d{3}$/);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ทุกดัชนีคำวินิจฉัยที่ถูกต้องต้องให้ผลลัพธ์ที่มีเนื้อหา", () => {
    for (const piece of PIECES) {
      const logic = getPieceLogic(piece.id);
      if (!logic) continue;

      for (let v = 0; v < logic.verdictCount; v += 1) {
        const outcome = logic.toOutcome({ v, s: 42 });
        expect(outcome.headline.length, `${piece.id} v=${v}`).toBeGreaterThan(0);
        expect(outcome.verdict.length, `${piece.id} v=${v}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("Nº 007 โอเคมิเตอร์", () => {
  it("คะแนนอยู่ในช่วง 0 ถึง 100 เสมอ", () => {
    for (const message of ["ค่ะ", "", "5555 ขอบคุณมากนะคะ!!", "ไม่เป็นไร อะไรก็ได้ ตามสบาย แล้วแต่."]) {
      const score = scoreMessage(message);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("ถ้อยคำห้วนได้คะแนนน้อยกว่าถ้อยคำที่เป็นมิตร", () => {
    expect(scoreMessage("ค่ะ")).toBeLessThan(scoreMessage("โอเคจ้า ขอบคุณมากนะคะ 5555"));
  });

  it("ข้อความว่างได้ค่ากลาง", () => {
    expect(scoreMessage("   ")).toBe(50);
  });

  it("ดัชนีคำวินิจฉัยอยู่ในช่วงที่ประกาศไว้", () => {
    for (const score of [0, 19, 20, 50, 99, 100]) {
      const index = verdict007(score);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(logic007.verdictCount);
    }
  });
});

describe("Nº 018 นาฬิกาแป๊บนึง", () => {
  it("ระยะเวลายิ่งนานยิ่งได้ระดับสูงขึ้น", () => {
    expect(verdict018(10)).toBe(0);
    expect(verdict018(60)).toBe(1);
    expect(verdict018(300)).toBe(2);
    expect(verdict018(1800)).toBe(3);
    expect(verdict018(7200)).toBe(4);
  });

  it("จัดรูประยะเวลาเป็นภาษาไทยตามหน่วยที่เหมาะสม", () => {
    expect(duration018(45)).toBe("45 วินาที");
    expect(duration018(120)).toBe("2 นาที");
    expect(duration018(135)).toBe("2 นาที 15 วินาที");
    expect(duration018(3600)).toBe("1 ชั่วโมง");
    expect(duration018(5400)).toBe("1 ชั่วโมง 30 นาที");
  });
});

describe("Nº 031 เครื่องแปลคำว่าไม่เป็นไร", () => {
  it("จำนวนผู้กล่าวต้องเท่ากับจำนวนคำแปล", () => {
    expect(listSpeakers()).toHaveLength(getPieceLogic("031")!.verdictCount);
  });
});

describe("Nº 055 ใบรับรองการดองงาน", () => {
  it("ทุกตัวเลือกระยะเวลาให้ดัชนีที่อยู่ในช่วง", () => {
    const count = getPieceLogic("055")!.verdictCount;

    for (const option of DURATION_OPTIONS) {
      const index = verdict055(option.days);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(count);
    }
  });

  it("จัดรูประยะเวลาตามหน่วยที่เหมาะสม", () => {
    expect(duration055(3)).toBe("3 วัน");
    expect(duration055(90)).toBe("3 เดือน");
    expect(duration055(730)).toBe("2 ปี");
  });

  it("ใช้ข้อความแทนเมื่อไม่ได้ระบุชื่องาน", () => {
    expect(getPieceLogic("055")!.toOutcome({ v: 1, s: 14 }).verdict).toContain("มิได้ระบุนาม");
  });
});

describe("Nº 064 ปุ่มต้องห้าม", () => {
  it("ยิ่งกดซ้ำยิ่งได้คำวินิจฉัยที่เข้มขึ้น", () => {
    expect(verdict064(1)).toBe(0);
    expect(verdict064(2)).toBe(1);
    expect(verdict064(5)).toBe(2);
    expect(verdict064(9)).toBe(3);
    expect(verdict064(50)).toBe(4);
  });
});

describe("Nº 077 มาตรวัดพลังสังคม", () => {
  it("ไม่ตอบว่าใช่เลยแปลว่าพลังยังเต็ม", () => {
    expect(energyFrom(QUESTIONS.map(() => false))).toBe(FULL_ENERGY);
  });

  it("พลังไม่ติดลบแม้ตอบว่าใช่ทุกข้อ", () => {
    expect(energyFrom(QUESTIONS.map(() => true))).toBeGreaterThanOrEqual(0);
  });

  it("ดัชนีคำวินิจฉัยอยู่ในช่วงที่ประกาศไว้", () => {
    const count = getPieceLogic("077")!.verdictCount;

    for (const energy of [0, 5, 45, 100]) {
      expect(verdict077(energy)).toBeGreaterThanOrEqual(0);
      expect(verdict077(energy)).toBeLessThan(count);
    }
  });
});
