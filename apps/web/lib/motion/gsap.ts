"use client";

/**
 * ศูนย์รวมการตั้งค่า gsap ของสมาคม
 *
 * ทุก component ที่ขยับอะไรต้องเรียกผ่านไฟล์นี้ เพื่อให้จังหวะและความหน่วง
 * เป็นชุดเดียวกันทั้งเว็บ และเพื่อให้ลงทะเบียน plugin ที่เดียว
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * จังหวะประจำแบรนด์ — ดีดเกินนิดหนึ่งแล้วเข้าที่ เหมือนปั๊มตรายางลงกระดาษ
 * ไม่ใช้ ease ที่นุ่มยาว เพราะขัดกับเงาแข็งและขอบหมึกหนาของสมาคม
 */
export const EASE = {
  stamp: "back.out(1.7)",
  settle: "power3.out",
  quick: "power2.out",
} as const;

/** ระยะเวลามาตรฐาน หน่วยวินาที */
export const DURATION = {
  quick: 0.32,
  base: 0.5,
  reveal: 0.65,
} as const;

/**
 * ท่านสมาชิกขอให้ลดการเคลื่อนไหวหรือไม่
 *
 * เมื่อขอไว้ ทุกอย่างต้องปรากฏในตำแหน่งจริงทันที ห้ามมีการเคลื่อนไหวใด
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * หน้าเพิ่งเปิดขึ้นมาจริง ๆ หรือไม่
 *
 * ถ้าเบราว์เซอร์วาดหน้าไปนานแล้วกว่าจะถึงคิวสคริปต์ (เน็ตช้า, เครื่องช้า)
 * การเล่นอนิเมชันเปิดตัวย้อนหลังจะกลายเป็นภาพกระตุกแทนที่จะสวย จึงข้ามไปเลย
 */
export function freshLoad(within = 1_200): boolean {
  return performance.now() < within;
}

export { gsap, ScrollTrigger };
