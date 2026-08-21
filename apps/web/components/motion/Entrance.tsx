"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { DURATION, EASE, freshLoad, gsap, prefersReducedMotion } from "@/lib/motion/gsap";

type EntranceProps = {
  /** ระยะห่างระหว่างชิ้นที่ไล่กันเข้ามา หน่วยวินาที */
  stagger?: number;
  /** หน่วงก่อนเริ่ม หน่วยวินาที */
  delay?: number;
  /** ระยะที่ชิ้นงานเลื่อนขึ้นมา หน่วยพิกเซล */
  rise?: number;
  /** เลือกเฉพาะบางชิ้นในกลุ่มแทนที่จะเป็นลูกโดยตรงทั้งหมด */
  selector?: string;
  className?: string;
  children: ReactNode;
};

/**
 * ไล่ให้เนื้อหาข้างในทยอยเข้ามาตอนเปิดหน้า
 *
 * ใช้ gsap.from เสมอ ไม่ใช่ .to — ตำแหน่งจริงจึงเป็นสิ่งที่เขียนไว้ใน markup
 * ถ้าสคริปต์ไม่ทำงาน หรือท่านสมาชิกขอให้ลดการเคลื่อนไหว หน้าเว็บก็ยังถูกต้องทุกประการ
 */
export function Entrance({
  stagger = 0.07,
  delay = 0,
  rise = 16,
  selector,
  className,
  children,
}: EntranceProps) {
  const scope = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !freshLoad()) return;

    const context = gsap.context((self) => {
      const targets = selector
        ? self.selector?.(selector)
        : Array.from(self.selector?.(":scope > *") ?? []);
      if (!targets || (targets as Element[]).length === 0) return;

      gsap.from(targets as Element[], {
        opacity: 0,
        y: rise,
        duration: DURATION.base,
        ease: EASE.settle,
        stagger,
        delay,
      });
    }, scope);

    return () => context.revert();
  }, [stagger, delay, rise, selector]);

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
