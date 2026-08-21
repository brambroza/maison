"use client";

import { useLayoutEffect, useRef } from "react";
import { formatCount } from "@/lib/ledger";
import { countedValue } from "@/lib/motion/number";
import { EASE, freshLoad, gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion/gsap";

/**
 * ตัวเลขที่ไต่ขึ้นจากศูนย์เมื่อเลื่อนมาเห็น
 *
 * ค่าที่ถูกต้องถูกเขียนไว้ใน markup ตั้งแต่แรกเสมอ
 * การไต่ขึ้นเป็นเพียงการทับค่าชั่วคราว ถ้าสคริปต์ไม่ทำงานก็ยังเห็นเลขจริง
 */
export function CountUp({ value }: { value: number }) {
  const slot = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const target = slot.current;
    if (!target) return;
    if (prefersReducedMotion() || !freshLoad() || value <= 0) return;

    const counter = { progress: 0 };
    const animation = gsap.to(counter, {
      progress: 1,
      duration: 1.1,
      ease: EASE.quick,
      paused: true,
      onUpdate: () => {
        target.textContent = formatCount(countedValue(value, counter.progress));
      },
      onComplete: () => {
        target.textContent = formatCount(value);
      },
    });

    const trigger = ScrollTrigger.create({
      trigger: target,
      start: "top 95%",
      once: true,
      onEnter: () => animation.play(),
    });

    return () => {
      trigger.kill();
      animation.kill();
      target.textContent = formatCount(value);
    };
  }, [value]);

  return <span ref={slot}>{formatCount(value)}</span>;
}
