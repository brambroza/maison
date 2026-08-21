import { describe, expect, it } from "vitest";
import {
  ANSWERS,
  INQUIRY,
  INQUIRY_KICKER,
  SILENCE_RETORT,
  retortFor,
} from "@/lib/mascot/inquiry";

/** ทุกถ้อยคำที่ท่านสมาชิกจะได้เห็นจากบทถาม-ตอบนี้ */
const LINES = [
  INQUIRY,
  INQUIRY_KICKER,
  SILENCE_RETORT,
  ...ANSWERS.map((answer) => answer.label),
  ...ANSWERS.map((answer) => answer.retort),
];

describe("บทถาม-ตอบแรกของบัตเลอร์", () => {
  it("มีตัวเลือกให้ตอบมากกว่าหนึ่งข้อ และรหัสไม่ซ้ำกัน", () => {
    expect(ANSWERS.length).toBeGreaterThan(1);
    expect(new Set(ANSWERS.map((answer) => answer.id)).size).toBe(ANSWERS.length);
  });

  it("ทุกตัวเลือกมีคำโต้เตรียมไว้แล้ว", () => {
    for (const choice of ANSWERS) {
      expect(retortFor(choice.id)).toBe(choice.retort);
      expect(choice.retort.length).toBeGreaterThan(0);
    }
  });

  it("ไม่มีคำโต้ให้กับตัวเลือกที่ไม่มีอยู่จริง", () => {
    expect(retortFor("ไม่มีข้อนี้")).toBeNull();
  });

  it("ปุ่มต้องสั้นพอจะอยู่ในป้ายคำพูดได้", () => {
    for (const choice of ANSWERS) {
      expect(choice.label.length).toBeLessThanOrEqual(16);
    }
  });
});

describe("กติกาถ้อยคำของสมาคม", () => {
  it("ไม่มีอิโมจิใด นอกจากตราของสมาคม", () => {
    for (const line of LINES) {
      expect(line).toMatch(/^[฀-๿ -~✦’“”—·]*$/u);
    }
  });

  it("บัตเลอร์ไม่ขอโทษ แม้ตอนเหวี่ยง", () => {
    for (const line of LINES) {
      expect(line).not.toMatch(/ขอโทษ|ขออภัย|เสียใจด้วย/);
    }
  });

  it("ไม่เอ่ยถึงกลไกเบื้องหลัง", () => {
    for (const line of LINES) {
      expect(line).not.toMatch(/เมาส์|เคอร์เซอร์|คลิก|สามมิติ|เว็บ|ระบบ|โค้ด|แอป/);
    }
  });

  it("เรียกผู้ใช้ว่าท่านเสมอ ไม่มีคำว่าคุณหรือเธอ", () => {
    for (const line of LINES) {
      expect(line).not.toMatch(/คุณ|เธอ/);
    }
  });
});
