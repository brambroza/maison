/**
 * สีหน้าของบัตเลอร์ตามอารมณ์
 *
 * ไฟล์นี้ต้อง pure และห้าม import React หรือ three — ชุดทดสอบเรียกใช้ตรง ๆ
 * ค่าทุกตัวเป็นหน่วยของโมเดล ตัวเลขบวกลบมีความหมายตามที่กำกับไว้
 */

import type { ButlerMood } from "./chatter";

/** อารมณ์ที่ใช้กับใบหน้า รวมสีหน้าปกติที่บัตเลอร์กลับมาใช้เมื่อเรื่องผ่านไปแล้ว */
export type FaceMood = ButlerMood | "neutral";

/** ชุดค่าที่บรรยายสีหน้าหนึ่งแบบ */
export type FaceShape = {
  /** ยกคิ้วขึ้นลงพร้อมกันทั้งสองข้าง */
  browLift: number;
  /** บวกคือขมวดคิ้ว (ปลายด้านในตกลง) ลบคือเลิกคิ้วอย่างสงสัย */
  browAngle: number;
  /** ยกคิ้วขวาข้างเดียว ใช้ตอนงุนงง */
  browSkew: number;
  /** 1 คือยิ้มเต็มที่ -1 คือเบ้ปาก 0 คือปากเรียบ */
  mouthCurve: number;
  /** 0 ถึง 1 ระดับการอ้าปาก */
  mouthOpen: number;
};

/** สีหน้าประจำแต่ละอารมณ์ */
export const FACES: Record<FaceMood, FaceShape> = {
  /** สีหน้าปกติของผู้ที่ผ่านการอบรมมารยาทมาอย่างดี */
  neutral: { browLift: 0, browAngle: 0.06, browSkew: 0, mouthCurve: 0.34, mouthOpen: 0 },
  /** เดินมาถึงแล้ว ยิ้มรับพร้อมเลิกคิ้วอย่างสนใจ */
  arrive: { browLift: 0.05, browAngle: -0.06, browSkew: 0.015, mouthCurve: 0.85, mouthOpen: 0.14 },
  /** ท่านสมาชิกวางมือ บัตเลอร์จึงเข้าสู่ภาวะครุ่นคิด */
  idle: { browLift: -0.012, browAngle: 0.2, browSkew: 0, mouthCurve: 0.1, mouthOpen: 0 },
  /** เดินตามแทบไม่ทัน ขมวดคิ้วและหอบ */
  chase: { browLift: -0.022, browAngle: 0.34, browSkew: 0, mouthCurve: -0.5, mouthOpen: 0.55 },
  /** ถูกแตะ สะดุ้งอย่างมีระเบียบ */
  poke: { browLift: 0.075, browAngle: -0.14, browSkew: 0, mouthCurve: 0.2, mouthOpen: 0.9 },
  /** ตามหาท่านไม่พบ คิ้วข้างหนึ่งยกขึ้นด้วยความงุนงง */
  lost: { browLift: 0.03, browAngle: 0.04, browSkew: 0.055, mouthCurve: -0.14, mouthOpen: 0.2 },
} as const;

/** สีหน้าเริ่มต้นก่อนมีเหตุใดเกิดขึ้น */
export function restingFace(): FaceShape {
  return { ...FACES.neutral };
}

/**
 * เกลี่ยสีหน้าปัจจุบันเข้าหาสีหน้าเป้าหมาย
 *
 * @param amount สัดส่วนที่ขยับเข้าหาเป้าหมายในเฟรมนี้ 0 ถึง 1
 */
export function blendFace(current: FaceShape, target: FaceShape, amount: number): FaceShape {
  const ratio = Math.min(1, Math.max(0, amount));

  return {
    browLift: current.browLift + (target.browLift - current.browLift) * ratio,
    browAngle: current.browAngle + (target.browAngle - current.browAngle) * ratio,
    browSkew: current.browSkew + (target.browSkew - current.browSkew) * ratio,
    mouthCurve: current.mouthCurve + (target.mouthCurve - current.mouthCurve) * ratio,
    mouthOpen: current.mouthOpen + (target.mouthOpen - current.mouthOpen) * ratio,
  };
}
