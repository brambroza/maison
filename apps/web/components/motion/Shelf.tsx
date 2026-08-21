"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import {
  DURATION,
  EASE,
  freshLoad,
  gsap,
  prefersReducedMotion,
  ScrollTrigger,
} from "@/lib/motion/gsap";

/** ถ้าการเปิดตัวไม่ทำงานภายในเวลานี้ ให้บังคับแสดงทุกชิ้นทันที */
const SAFETY_MS = 2_500;

/**
 * ชั้นวางชิ้นงาน — แต่ละชิ้นทยอยลอยขึ้นมาเมื่อเลื่อนถึง
 *
 * ชิ้นที่อยู่ในสายตาตั้งแต่แรกจะไล่กันขึ้นมาทันที ที่เหลือรอจนเลื่อนถึง
 * มีตัวกันพลาดบังคับแสดงทั้งหมด เพราะรายการชิ้นงานหายไปไม่ได้เด็ดขาด
 */
export function Shelf({ className, children }: { className?: string; children: ReactNode }) {
  const scope = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !freshLoad()) return;

    let safety: number | undefined;

    const context = gsap.context((self) => {
      const items = self.selector?.(":scope > li") as HTMLElement[] | undefined;
      if (!items || items.length === 0) return;

      gsap.set(items, { opacity: 0, y: 26 });

      ScrollTrigger.batch(items, {
        start: "top 92%",
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: DURATION.reveal,
            ease: EASE.settle,
            stagger: 0.08,
            overwrite: true,
          });
        },
      });

      safety = window.setTimeout(() => {
        gsap.to(items, { opacity: 1, y: 0, duration: 0.25, overwrite: "auto" });
      }, SAFETY_MS);
    }, scope);

    return () => {
      if (safety !== undefined) window.clearTimeout(safety);
      context.revert();
    };
  }, []);

  return (
    <ul ref={scope} className={className}>
      {children}
    </ul>
  );
}
