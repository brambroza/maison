"use client";

import { useLayoutEffect, useRef } from "react";
import { EASE, freshLoad, gsap, prefersReducedMotion } from "@/lib/motion/gsap";

type SquiggleProps = {
  /** ความกว้างของเส้นหยักตามคลาส tailwind ที่ส่งเข้ามา */
  className?: string;
  /** เส้นทางของลูกคลื่น */
  path: string;
  /** กรอบพิกัดของ svg */
  viewBox: string;
  /** หน่วงก่อนเริ่มลากเส้น หน่วยวินาที */
  delay?: number;
};

/**
 * เส้นหยักลูกคลื่นที่ลากตัวเองออกมาทีละนิดตอนเปิดหน้า
 *
 * ใช้ระยะประ (stroke-dash) ซึ่งไม่กระทบการจัดวางเลย
 * เมื่อไม่มีการเคลื่อนไหว เส้นจะอยู่ครบเต็มความยาวเหมือนเดิม
 */
export function Squiggle({ className, path, viewBox, delay = 0.25 }: SquiggleProps) {
  const line = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const target = line.current;
    if (!target) return;
    if (prefersReducedMotion() || !freshLoad()) return;

    const length = target.getTotalLength();
    const animation = gsap.fromTo(
      target,
      { strokeDasharray: length, strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        duration: 0.85,
        ease: EASE.quick,
        delay,
        onComplete: () => gsap.set(target, { clearProps: "strokeDasharray,strokeDashoffset" }),
      },
    );

    return () => {
      animation.kill();
      gsap.set(target, { clearProps: "strokeDasharray,strokeDashoffset" });
    };
  }, [delay]);

  return (
    <svg className={className} viewBox={viewBox} fill="none" aria-hidden="true">
      <path ref={line} d={path} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
