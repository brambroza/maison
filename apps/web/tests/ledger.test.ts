import { describe, expect, it } from "vitest";
import { formatCount, getCount, increment } from "@/lib/ledger";

/** เที่ยงวันตามเวลาไทยของวันที่กำหนด ใช้เลี่ยงความกำกวมตอนข้ามเที่ยงคืน */
function bangkokNoon(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day, 5, 0, 0);
}

describe("getCount", () => {
  it("ให้ค่าเดิมเสมอเมื่อเป็นวันเดียวกัน", () => {
    const morning = bangkokNoon(2026, 9, 1);
    const evening = morning + 6 * 60 * 60 * 1000;

    expect(getCount("064", morning)).toBe(getCount("064", evening));
  });

  it("เพิ่มขึ้นเมื่อวันเปลี่ยน", () => {
    const today = getCount("064", bangkokNoon(2026, 9, 1));
    const tomorrow = getCount("064", bangkokNoon(2026, 9, 2));

    expect(tomorrow).toBeGreaterThan(today);
  });

  it("แยกยอดของแต่ละชิ้นงานออกจากกัน", () => {
    const now = bangkokNoon(2026, 9, 1);

    expect(getCount("064", now)).not.toBe(getCount("090", now));
  });

  it("ไม่ติดลบแม้เวลาอ้างอิงอยู่ก่อนวันตั้งสมาคม", () => {
    expect(getCount("064", bangkokNoon(2020, 1, 1))).toBeGreaterThan(0);
  });
});

describe("increment", () => {
  it("บวกยอดเพิ่มทีละหนึ่ง", async () => {
    await expect(increment(41_002)).resolves.toBe(41_003);
  });
});

describe("formatCount", () => {
  it("ใส่เครื่องหมายคั่นหลักพัน", () => {
    expect(formatCount(41003)).toBe("41,003");
  });
});
