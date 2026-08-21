import { describe, expect, it } from "vitest";
import { CHATTER, drawChatter, type ButlerMood } from "@/lib/mascot/chatter";
import { blendFace, FACES, restingFace } from "@/lib/mascot/face";
import {
  ARRIVED_DISTANCE,
  clampToStage,
  distance,
  facingAngle,
  pickWanderTarget,
  POLITE_DISTANCE,
  STAGE,
  stepToward,
  turnToward,
  walkSwing,
  wrapAngle,
  bankAngle,
  restingSpring,
  springTo,
  squashStretch,
} from "@/lib/mascot/gait";

const MOODS: readonly ButlerMood[] = ["arrive", "idle", "chase", "poke", "lost"];

describe("clampToStage", () => {
  it("ปล่อยจุดที่อยู่ในเวทีไว้ตามเดิม", () => {
    expect(clampToStage({ x: 1, z: -1 })).toEqual({ x: 1, z: -1 });
  });

  it("ดึงจุดที่หลุดขอบกลับเข้ามาทุกด้าน", () => {
    expect(clampToStage({ x: 99, z: -99 })).toEqual({ x: STAGE.maxX, z: STAGE.minZ });
    expect(clampToStage({ x: -99, z: 99 })).toEqual({ x: STAGE.minX, z: STAGE.maxZ });
  });
});

describe("wrapAngle", () => {
  it("พับมุมให้อยู่ในช่วง -π ถึง π", () => {
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 5);
    expect(wrapAngle(-Math.PI * 2.5)).toBeCloseTo(-Math.PI / 2, 5);
  });
});

describe("facingAngle", () => {
  it("หันหน้าไปทางแกน z บวกเมื่อมุมเป็นศูนย์", () => {
    expect(facingAngle({ x: 0, z: 0 }, { x: 0, z: 5 })).toBeCloseTo(0, 5);
  });

  it("หันไปทางขวามือเมื่อเป้าหมายอยู่ทางแกน x บวก", () => {
    expect(facingAngle({ x: 0, z: 0 }, { x: 5, z: 0 })).toBeCloseTo(Math.PI / 2, 5);
  });
});

describe("turnToward", () => {
  it("หมุนทางที่สั้นที่สุดเสมอ แม้ต้องข้ามรอยต่อของมุม", () => {
    // จาก 170 องศาไป -170 องศา ต้องหมุนต่อไปอีก 20 องศา ไม่ใช่ย้อนกลับ 340 องศา
    const turned = turnToward(3.0, -3.0, 1, 0.1);
    expect(turned).toBeGreaterThan(3.0);
  });

  it("ไม่หมุนเกินมุมเป้าหมาย", () => {
    expect(turnToward(0, 0.05, 1, 10)).toBeCloseTo(0.05, 5);
  });
});

describe("stepToward", () => {
  it("ยืนอยู่กับที่เมื่อใกล้พอตามมารยาทแล้ว", () => {
    const here = { x: 0, z: 0 };
    const step = stepToward(here, { x: POLITE_DISTANCE / 2, z: 0 }, 0.016);

    expect(step.position).toBe(here);
    expect(step.travelled).toBe(0);
  });

  it("ไม่เดินทะลุระยะมารยาทแม้ delta ยาวผิดปกติ", () => {
    const step = stepToward({ x: 0, z: 0 }, { x: 10, z: 0 }, 5);

    expect(distance(step.position, { x: 10, z: 0 })).toBeGreaterThanOrEqual(POLITE_DISTANCE - 1e-6);
  });

  it("เดินเข้าใกล้เป้าหมายขึ้นทุกเฟรม", () => {
    let position = { x: -4, z: -2 };
    const target = { x: 3, z: 1.5 };
    let previous = distance(position, target);

    for (let index = 0; index < 60; index += 1) {
      position = stepToward(position, target, 0.016).position;
      const gap = distance(position, target);
      expect(gap).toBeLessThanOrEqual(previous + 1e-9);
      previous = gap;
    }
  });

  it("เดินถึงระยะที่ถือว่ามาถึงภายในเวลาอันควร", () => {
    let position = { x: -5, z: -3 };
    const target = { x: 4, z: 2 };

    // สี่วินาทีที่ 60 เฟรมต่อวินาที เดินข้ามเวทีจากมุมหนึ่งไปอีกมุม
    for (let index = 0; index < 240; index += 1) {
      position = stepToward(position, target, 1 / 60).position;
    }

    expect(distance(position, target)).toBeLessThanOrEqual(ARRIVED_DISTANCE);
  });
});

describe("walkSwing", () => {
  it("ขาสองข้างแกว่งสวนทางกันเสมอ", () => {
    for (const phase of [0.3, 1.1, 2.7, 4.9]) {
      expect(walkSwing(phase, 0)).toBeCloseTo(-walkSwing(phase, Math.PI), 5);
    }
  });
});

describe("pickWanderTarget", () => {
  it("ไม่เคยเลือกจุดที่อยู่นอกเวที", () => {
    for (let index = 0; index < 200; index += 1) {
      const target = pickWanderTarget({ x: STAGE.maxX, z: STAGE.maxZ });

      expect(target.x).toBeGreaterThanOrEqual(STAGE.minX);
      expect(target.x).toBeLessThanOrEqual(STAGE.maxX);
      expect(target.z).toBeGreaterThanOrEqual(STAGE.minZ);
      expect(target.z).toBeLessThanOrEqual(STAGE.maxZ);
    }
  });

  it("เลือกจุดที่ไกลพอจะได้เดินจริง", () => {
    const here = { x: 0, z: 0 };
    const target = pickWanderTarget(here, () => 0.5);

    expect(distance(here, target)).toBeGreaterThan(ARRIVED_DISTANCE);
  });
});

describe("drawChatter", () => {
  it("ให้ถ้อยคำจากคลังของอารมณ์นั้นเสมอ", () => {
    for (const mood of MOODS) {
      for (const value of [0, 0.5, 0.999]) {
        expect(CHATTER[mood]).toContain(drawChatter(mood, null, () => value));
      }
    }
  });

  it("ไม่พูดบรรทัดเดิมซ้ำติดกัน", () => {
    for (const mood of MOODS) {
      const previous = CHATTER[mood][0];
      for (const value of [0, 0.34, 0.67, 0.999]) {
        expect(drawChatter(mood, previous, () => value)).not.toBe(previous);
      }
    }
  });
});

describe("กติกาถ้อยคำของสมาคม", () => {
  const lines = MOODS.flatMap((mood) => CHATTER[mood]);

  it("ไม่มีอิโมจิใด นอกจากตราของสมาคม", () => {
    for (const line of lines) {
      expect(line).toMatch(/^[฀-๿ -~✦’“”—·，]*$/u);
    }
  });

  it("บัตเลอร์ไม่ขอโทษ ทุกบรรทัดคือการรับไว้พิจารณา", () => {
    for (const line of lines) {
      expect(line).not.toMatch(/ขอโทษ|ขออภัย|เสียใจด้วย/);
    }
  });

  it("ไม่เอ่ยถึงกลไกเบื้องหลัง", () => {
    for (const line of lines) {
      expect(line).not.toMatch(/เมาส์|เคอร์เซอร์|คลิก|สามมิติ|เว็บ|ระบบ|โค้ด|แอป/);
    }
  });
});

describe("springTo", () => {
  it("เข้าหาเป้าหมายจนนิ่งในเวลาอันสมควร", () => {
    let spring = restingSpring();
    for (let index = 0; index < 120; index += 1) {
      spring = springTo(spring, 1, 1 / 60);
    }

    expect(spring.value).toBeCloseTo(1, 3);
    expect(Math.abs(spring.velocity)).toBeLessThan(0.01);
  });

  it("เลยเป้าหมายไปเล็กน้อยก่อนกลับมา จึงดูมีน้ำหนัก", () => {
    let spring = restingSpring();
    let peak = 0;
    for (let index = 0; index < 60; index += 1) {
      spring = springTo(spring, 1, 1 / 60);
      peak = Math.max(peak, spring.value);
    }

    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThan(1.5);
  });

  it("ไม่ระเบิดเมื่อเฟรมกระตุกยาว", () => {
    let spring = restingSpring();
    for (let index = 0; index < 40; index += 1) {
      spring = springTo(spring, 1, 3);
    }

    expect(Number.isFinite(spring.value)).toBe(true);
    expect(Math.abs(spring.value)).toBeLessThan(4);
  });
});

describe("squashStretch", () => {
  it("ไม่บิดรูปเลยเมื่อยืนนิ่ง", () => {
    for (const phase of [0, 1.2, 3.4]) {
      expect(squashStretch(phase, 0)).toEqual({ scaleY: 1, scaleXZ: 1 });
    }
  });

  it("สูงขึ้นตอนลอย และเตี้ยลงตอนเท้าถึงพื้น", () => {
    const airborne = squashStretch(Math.PI / 2, 1);
    const grounded = squashStretch(0, 1);

    expect(airborne.scaleY).toBeGreaterThan(1);
    expect(airborne.scaleXZ).toBeLessThan(1);
    expect(grounded.scaleY).toBeLessThan(1);
    expect(grounded.scaleXZ).toBeGreaterThan(1);
  });

  it("ไม่ยุบจนติดลบแม้เดินเต็มฝีเท้า", () => {
    for (let phase = 0; phase < 7; phase += 0.1) {
      const shape = squashStretch(phase, 1);
      expect(shape.scaleY).toBeGreaterThan(0.5);
      expect(shape.scaleXZ).toBeGreaterThan(0.5);
    }
  });
});

describe("bankAngle", () => {
  it("เอนเข้าในโค้ง คือเอนสวนทิศที่หมุน", () => {
    expect(bankAngle(2)).toBeLessThan(0);
    expect(bankAngle(-2)).toBeGreaterThan(0);
  });

  it("ไม่เอนเกินขีดจำกัดแม้หมุนเร็วผิดปกติ", () => {
    expect(Math.abs(bankAngle(999))).toBeLessThanOrEqual(0.3);
  });
});

describe("blendFace", () => {
  it("ทุกอารมณ์ต้องมีสีหน้ากำกับไว้", () => {
    for (const mood of [...MOODS, "neutral" as const]) {
      expect(FACES[mood]).toBeDefined();
    }
  });

  it("อยู่ที่เดิมเมื่อยังไม่เกลี่ย และถึงเป้าหมายเมื่อเกลี่ยเต็ม", () => {
    const from = restingFace();

    expect(blendFace(from, FACES.poke, 0)).toEqual(from);
    expect(blendFace(from, FACES.poke, 1)).toEqual(FACES.poke);
  });

  it("ไม่หลุดกรอบแม้ส่งค่าเกินช่วงมา", () => {
    const blended = blendFace(restingFace(), FACES.chase, 5);

    expect(blended).toEqual(FACES.chase);
  });

  it("ระดับการอ้าปากของทุกอารมณ์อยู่ในช่วงศูนย์ถึงหนึ่ง", () => {
    for (const shape of Object.values(FACES)) {
      expect(shape.mouthOpen).toBeGreaterThanOrEqual(0);
      expect(shape.mouthOpen).toBeLessThanOrEqual(1);
      expect(Math.abs(shape.mouthCurve)).toBeLessThanOrEqual(1);
    }
  });
});
