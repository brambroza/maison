import { describe, expect, it } from "vitest";
import { countedValue, splitCountable } from "@/lib/motion/number";

describe("splitCountable", () => {
  it("แยกถ้อยคำที่มีตัวเลขกลุ่มเดียวออกเป็นสามส่วน", () => {
    expect(splitCountable("โอเค 68%")).toEqual({ prefix: "โอเค ", value: 68, suffix: "%" });
    expect(splitCountable("41003")).toEqual({ prefix: "", value: 41003, suffix: "" });
  });

  it("ไม่แตะถ้อยคำที่ไม่มีตัวเลข", () => {
    expect(splitCountable("ก็แล้วแต่")).toBeNull();
    expect(splitCountable("อะไรก็ได้")).toBeNull();
  });

  it("ไม่แตะถ้อยคำที่มีตัวเลขหลายกลุ่ม เพราะไต่ขึ้นพร้อมกันแล้วอ่านไม่รู้เรื่อง", () => {
    expect(splitCountable("3 นาที 12 วินาที")).toBeNull();
  });

  it("ไม่ไต่ตัวเลขที่ใหญ่เกินกว่าจะมีความหมาย", () => {
    expect(splitCountable("มูลค่า 9999999 บาท")).toBeNull();
    expect(splitCountable("มูลค่า 9999999 บาท", 10_000_000)).not.toBeNull();
  });
});

describe("countedValue", () => {
  it("เริ่มที่ศูนย์และจบที่ค่าจริงพอดี", () => {
    expect(countedValue(68, 0)).toBe(0);
    expect(countedValue(68, 1)).toBe(68);
  });

  it("ไม่เกินค่าจริงระหว่างทาง", () => {
    for (let progress = 0; progress <= 1; progress += 0.05) {
      expect(countedValue(68, progress)).toBeLessThanOrEqual(68);
    }
  });

  it("ไม่หลุดกรอบแม้ได้ค่าความคืบหน้าที่เกินช่วง", () => {
    expect(countedValue(68, -3)).toBe(0);
    expect(countedValue(68, 9)).toBe(68);
  });
});
