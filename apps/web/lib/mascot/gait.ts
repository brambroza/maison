/**
 * คณิตศาสตร์การเดินของบัตเลอร์มาสคอต
 *
 * ไฟล์นี้ต้อง pure และห้าม import React หรือ three
 * เพราะทั้งฉากสามมิติและชุดทดสอบเรียกใช้ไฟล์เดียวกัน
 * (กติกาเดียวกับ NNN.logic.ts ของชิ้นงานในคอลเลกชัน)
 */

/** จุดบนพื้นเวที มองจากด้านบน — x คือซ้ายขวา, z คือใกล้ไกลจากผู้ชม */
export type Ground = {
  x: number;
  z: number;
};

/** ขอบเขตพื้นที่ที่บัตเลอร์ได้รับอนุญาตให้เดิน */
export type Stage = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

/**
 * เวทีมาตรฐาน — ครอบคลุมพื้นที่ที่มองเห็นบนจอกว้าง
 *
 * แกน z ลึกกว่าที่คิด เพราะพื้นเอียงเข้าหากล้อง ยิ่งเคอร์เซอร์อยู่สูงบนจอ
 * จุดบนพื้นยิ่งอยู่ไกล บัตเลอร์จึงเดินได้ถึงครึ่งบนของจอและตัวเล็กลงตามระยะ
 */
export const STAGE: Stage = {
  minX: -7.5,
  maxX: 7.5,
  minZ: -9,
  maxZ: 5,
};

/** ความเร็วเดินปกติ หน่วยต่อวินาที */
export const WALK_SPEED = 3.1;

/** ความเร็วในการหมุนตัว เรเดียนต่อวินาที */
export const TURN_RATE = 7.5;

/** ระยะที่บัตเลอร์หยุดห่างจากเป้าหมาย ตามมารยาทของสมาคม */
export const POLITE_DISTANCE = 0.85;

/** ระยะที่ถือว่า "มาถึงแล้ว" — เผื่อไว้เหนือ POLITE_DISTANCE เล็กน้อยกันการสั่น */
export const ARRIVED_DISTANCE = POLITE_DISTANCE + 0.35;

/** ระยะทางระหว่างสองจุดบนพื้น */
export function distance(from: Ground, to: Ground): number {
  return Math.hypot(to.x - from.x, to.z - from.z);
}

/** ดึงจุดที่หลุดขอบเวทีกลับเข้ามาอยู่ในกรอบ */
export function clampToStage(point: Ground, stage: Stage = STAGE): Ground {
  return {
    x: Math.min(Math.max(point.x, stage.minX), stage.maxX),
    z: Math.min(Math.max(point.z, stage.minZ), stage.maxZ),
  };
}

/** พับมุมให้อยู่ในช่วง -π ถึง π เพื่อให้หมุนทางที่สั้นที่สุดเสมอ */
export function wrapAngle(radians: number): number {
  return Math.atan2(Math.sin(radians), Math.cos(radians));
}

/**
 * มุมที่ตัวบัตเลอร์ต้องหันเพื่อให้หน้าตรงไปยังเป้าหมาย
 *
 * ใช้ atan2(dx, dz) ไม่ใช่ (dz, dx) เพราะโมเดลหันหน้าไปทางแกน +z เมื่อมุมเป็นศูนย์
 */
export function facingAngle(from: Ground, to: Ground): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/** หมุนตัวเข้าหามุมเป้าหมายทีละน้อย ไม่หมุนพรวดเดียว */
export function turnToward(
  current: number,
  target: number,
  delta: number,
  rate: number = TURN_RATE,
): number {
  const difference = wrapAngle(target - current);
  const step = Math.min(Math.abs(difference), rate * delta);
  return wrapAngle(current + Math.sign(difference) * step);
}

/** ผลของการก้าวหนึ่งเฟรม */
export type Step = {
  /** ตำแหน่งใหม่หลังก้าว */
  position: Ground;
  /** ระยะที่เดินได้จริงในเฟรมนี้ ใช้ขับจังหวะแกว่งขา */
  travelled: number;
};

/**
 * ก้าวเข้าหาเป้าหมายหนึ่งเฟรม แล้วหยุดเมื่อใกล้พอตามมารยาท
 *
 * ความเร็วลดลงเองในช่วงท้าย เพื่อไม่ให้บัตเลอร์เบรกกะทันหันอย่างเสียมารยาท
 */
export function stepToward(
  from: Ground,
  target: Ground,
  delta: number,
  options: { speed?: number; stopDistance?: number } = {},
): Step {
  const speed = options.speed ?? WALK_SPEED;
  const stopDistance = options.stopDistance ?? POLITE_DISTANCE;
  const gap = distance(from, target);
  const remaining = gap - stopDistance;

  if (delta <= 0 || remaining <= 0.001) return { position: from, travelled: 0 };

  const easing = Math.min(1, remaining / 1.6);
  const travelled = Math.min(remaining, speed * Math.max(0.3, easing) * delta);
  const ratio = travelled / gap;

  return {
    position: {
      x: from.x + (target.x - from.x) * ratio,
      z: from.z + (target.z - from.z) * ratio,
    },
    travelled,
  };
}

/**
 * ระดับความสูงของเท้าข้างหนึ่งในวงจรการเดิน
 *
 * phase เดินหน้าตามระยะทางที่เดินได้จริง ขาจึงหยุดแกว่งเองเมื่อบัตเลอร์หยุด
 * @param offset 0 สำหรับขาซ้าย, π สำหรับขาขวา
 */
export function walkSwing(phase: number, offset: number): number {
  return Math.sin(phase + offset);
}

/** สุ่มจุดเดินเล่นเมื่อไม่มีใครขยับเมาส์ — บัตเลอร์ไม่เคยยืนนิ่งนานเกินควร */
export function pickWanderTarget(
  around: Ground,
  random: () => number = Math.random,
  stage: Stage = STAGE,
): Ground {
  const angle = random() * Math.PI * 2;
  const reach = 1.6 + random() * 2.6;

  return clampToStage(
    { x: around.x + Math.sin(angle) * reach, z: around.z + Math.cos(angle) * reach },
    stage,
  );
}

/** สถานะของสปริงหนึ่งตัว ใช้ทำการเคลื่อนไหวที่ตามหลังตัวหลักอย่างมีน้ำหนัก */
export type Spring = {
  value: number;
  velocity: number;
};

/** สปริงที่ยังไม่ขยับ */
export function restingSpring(value = 0): Spring {
  return { value, velocity: 0 };
}

/**
 * ขยับสปริงเข้าหาเป้าหมายหนึ่งเฟรม
 *
 * ใช้กับชิ้นส่วนที่ควรแกว่งตามหลังตัวหลัก เช่น หางเสื้อกับถาด
 * ค่า damping ต่ำกว่าจุดวิกฤตเล็กน้อย จึงเลยเป้าไปนิดหนึ่งก่อนกลับมา
 */
export function springTo(
  state: Spring,
  target: number,
  delta: number,
  stiffness = 120,
  damping = 13,
): Spring {
  // เฟรมที่กระตุกยาวจะทำให้สปริงแบบนี้ระเบิด จึงตัดช่วงเวลาไว้ที่ 1/30 วินาที
  const step = Math.min(Math.max(delta, 0), 1 / 30);
  const acceleration = (target - state.value) * stiffness - state.velocity * damping;
  const velocity = state.velocity + acceleration * step;

  return { value: state.value + velocity * step, velocity };
}

/**
 * การยืดและบี้ของลำตัวในหนึ่งจังหวะก้าว
 *
 * ช่วงที่ตัวลอยขึ้นจะสูงและผอมลง ช่วงที่เท้ากระแทกพื้นจะเตี้ยและแบะออก
 * เมื่อยืนนิ่ง (stride เป็นศูนย์) ทั้งสองค่าต้องเท่ากับหนึ่งพอดี
 */
export function squashStretch(phase: number, stride: number): { scaleY: number; scaleXZ: number } {
  const lift = Math.abs(Math.sin(phase)) - 0.5;

  return {
    scaleY: 1 + lift * 0.18 * stride,
    scaleXZ: 1 - lift * 0.12 * stride,
  };
}

/**
 * มุมเอนตัวเข้าโค้ง คำนวณจากความเร็วในการหมุนตัว
 *
 * บัตเลอร์เลี้ยวแรงเท่าไรก็เอนเข้าในโค้งมากเท่านั้น เหมือนคนวิ่งเลี้ยว
 */
export function bankAngle(turnRate: number, limit = 0.3): number {
  return Math.min(limit, Math.max(-limit, -turnRate * 0.055));
}
