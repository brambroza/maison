import { describe, expect, it } from "vitest";
import { getPieceLogic } from "@/lib/pieces";
import { PIECES } from "@/lib/registry";
import { logic as logic007, scoreMessage, verdictIndexFor as verdict007 } from "@/lib/pieces/007.logic";
import { formatDuration as duration018, verdictIndexFor as verdict018 } from "@/lib/pieces/018.logic";
import { listSpeakers } from "@/lib/pieces/031.logic";
import { DURATION_OPTIONS, formatDuration as duration055, verdictIndexFor as verdict055 } from "@/lib/pieces/055.logic";
import { verdictIndexFor as verdict064 } from "@/lib/pieces/064.logic";
import { logic as logic013 } from "@/lib/pieces/013.logic";
import { STRANGERS, dailyStranger, logic as logic026 } from "@/lib/pieces/026.logic";
import { formatValuation, ideaCountFor, valuationFor, verdictIndexFor as verdict048 } from "@/lib/pieces/048.logic";
import { GOSSIP_LINES, GOSSIP_SCHEDULE, SESSION_SECONDS, verdictIndexFor as verdict083 } from "@/lib/pieces/083.logic";
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

describe("Nº 013 สำนักวินิจฉัยทรงผม", () => {
  it("ตอบว่าก็แล้วแต่ทุกคำวินิจฉัย", () => {
    for (let v = 0; v < logic013.verdictCount; v += 1) {
      expect(logic013.toOutcome({ v }).headline).toBe("ก็แล้วแต่");
    }
  });
});

describe("Nº 026 คนแปลกหน้าประจำวัน", () => {
  it("วันเดียวกันได้คนเดียวกันเสมอ", () => {
    const morning = Date.UTC(2026, 8, 1, 2, 0);
    const evening = Date.UTC(2026, 8, 1, 14, 0);

    expect(dailyStranger(morning)).toEqual(dailyStranger(evening));
  });

  it("ดัชนีอยู่ในช่วงของรายชื่อและคำชมเสมอ", () => {
    for (let day = 0; day < 30; day += 1) {
      const { nameIndex, complimentIndex } = dailyStranger(Date.UTC(2026, 8, 1) + day * 86_400_000);
      expect(nameIndex).toBeGreaterThanOrEqual(0);
      expect(nameIndex).toBeLessThan(STRANGERS.length);
      expect(complimentIndex).toBeGreaterThanOrEqual(0);
      expect(complimentIndex).toBeLessThan(logic026.verdictCount);
    }
  });

  it("s เกินช่วงรายชื่อไม่ทำให้การ์ดพัง (mod กลับเข้าช่วง)", () => {
    expect(logic026.toOutcome({ v: 0, s: 9_999 }).verdict.length).toBeGreaterThan(0);
  });
});

describe("Nº 048 มูลค่าไอเดียในห้องน้ำ", () => {
  it("อาบนานขึ้นมูลค่าสูงขึ้นและจำนวนไอเดียไม่ลดลง", () => {
    expect(valuationFor(600)).toBeGreaterThan(valuationFor(60));
    expect(ideaCountFor(600)).toBeGreaterThanOrEqual(ideaCountFor(60));
  });

  it("มีอย่างน้อยหนึ่งไอเดียเสมอ แม้อาบสั้นมาก", () => {
    expect(ideaCountFor(1)).toBe(1);
  });

  it("มูลค่า deterministic — วินาทีเดิมได้ตัวเลขเดิม (การ์ดที่แชร์ต้องคงที่)", () => {
    expect(formatValuation(754)).toBe(formatValuation(754));
  });

  it("ดัชนีคำวินิจฉัยอยู่ในช่วงทุกระดับเวลา", () => {
    for (const seconds of [1, 179, 180, 479, 899, 1799, 99_999]) {
      const index = verdict048(seconds);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(5);
    }
  });
});

describe("Nº 083 สมาธิสนามจริง", () => {
  it("ไม่เถียงเลยได้ระดับสูงสุด ยิ่งเถียงยิ่งตก", () => {
    expect(verdict083(0)).toBe(0);
    expect(verdict083(2)).toBe(1);
    expect(verdict083(4)).toBe(2);
    expect(verdict083(20)).toBe(3);
  });

  it("ตารางเสียงนินทาอยู่ในช่วงเวลานั่งสมาธิทั้งหมด", () => {
    for (const at of GOSSIP_SCHEDULE) {
      expect(at).toBeGreaterThan(0);
      expect(at).toBeLessThan(SESSION_SECONDS);
    }
    expect(GOSSIP_LINES.length).toBeGreaterThanOrEqual(GOSSIP_SCHEDULE.length);
  });
});
