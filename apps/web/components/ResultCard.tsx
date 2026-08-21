"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { COPY } from "@/lib/brand";
import { requestAside } from "@/lib/mascot/attention";
import { DURATION, EASE, gsap, prefersReducedMotion } from "@/lib/motion/gsap";
import { countedValue, splitCountable } from "@/lib/motion/number";
import type { Outcome, ShareState } from "@/lib/share";
import { ShareButton } from "./ShareButton";

type ResultCardProps = {
  pieceId: string;
  pieceTitle: string;
  /** เนื้อหาผลลัพธ์ที่จะแสดง ต้องตรงกับที่วาดบนการ์ดแชร์ */
  outcome: Outcome;
  /** state เดียวกับที่ใช้สร้าง outcome ใช้ประกอบลิงก์แชร์ */
  state: ShareState;
  /** เรียกเมื่อท่านสมาชิกขอรับบริการอีกครั้ง ถ้าไม่ส่งมาจะไม่แสดงปุ่ม */
  onRestart?: () => void;
};

/**
 * การ์ดผลลัพธ์มาตรฐานของสมาคม (ฉบับขี้เล่น)
 *
 * ต้องมีหน้าตาสอดคล้องกับการ์ดแชร์ที่ /api/og วาด
 * เมื่อแก้ที่ใดที่หนึ่งให้แก้อีกที่ให้ตรงกันเสมอ
 */
export function ResultCard({
  pieceId,
  pieceTitle,
  outcome,
  state,
  onRestart,
}: ResultCardProps) {
  const scope = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLParagraphElement>(null);

  // ระหว่างที่คำวินิจฉัยอยู่บนจอ บัตเลอร์ต้องถอยไปยืนข้าง ห้ามยืนบังของที่ท่านมาอ่าน
  useEffect(() => {
    requestAside(true);
    return () => requestAside(false);
  }, []);

  // คำวินิจฉัยคือช่วงเวลาสำคัญที่สุดของทุกชิ้นงาน จึงปั๊มลงกระดาษให้เห็นกันจะ ๆ
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const context = gsap.context((self) => {
      const pick = (name: string) => self.selector?.(`[data-reveal="${name}"]`) ?? [];
      const timeline = gsap.timeline();

      timeline
        .from(scope.current, {
          scale: 1.14,
          opacity: 0,
          rotation: -7,
          duration: DURATION.reveal,
          ease: EASE.stamp,
          clearProps: "transform,opacity",
        })
        .from(
          pick("stamp"),
          { scale: 0, rotation: -24, duration: DURATION.base, ease: EASE.stamp, clearProps: "transform" },
          "-=0.34",
        )
        .from(
          pick("headline"),
          { scale: 0.55, opacity: 0, duration: DURATION.base, ease: EASE.stamp, clearProps: "transform,opacity" },
          "-=0.4",
        )
        .from(
          pick("line"),
          { y: 14, opacity: 0, duration: DURATION.quick, ease: EASE.settle, stagger: 0.08, clearProps: "transform,opacity" },
          "-=0.24",
        )
        .from(
          pick("dot"),
          { scale: 0, rotation: -120, duration: DURATION.quick, ease: EASE.stamp, clearProps: "transform" },
          "-=0.2",
        )
        .from(
          pick("actions"),
          { y: 16, opacity: 0, duration: DURATION.base, ease: EASE.settle, clearProps: "transform,opacity" },
          "-=0.18",
        );

      // ตัวเลขในคำวินิจฉัยไต่ขึ้นจากศูนย์ ถ้าถ้อยคำนั้นมีตัวเลขอยู่กลุ่มเดียว
      const slot = headline.current;
      const countable = slot ? splitCountable(outcome.headline) : null;

      if (slot && countable) {
        const counter = { progress: 0 };
        timeline.to(
          counter,
          {
            progress: 1,
            duration: 0.9,
            ease: EASE.quick,
            onUpdate: () => {
              const shown = countedValue(countable.value, counter.progress);
              slot.textContent = `${countable.prefix}${shown}${countable.suffix}`;
            },
            onComplete: () => {
              slot.textContent = outcome.headline;
            },
          },
          "-=0.55",
        );
      }

      return () => {
        if (slot) slot.textContent = outcome.headline;
      };
    }, scope);

    return () => context.revert();
  }, [outcome.headline]);

  return (
    <div ref={scope} className="flex w-full max-w-md flex-col items-center gap-5 text-center">
      <div className="card-stamp relative w-full -rotate-1 px-6 pt-8 pb-7">
        {/* ตราประทับหัวการ์ด วางคร่อมขอบให้เหมือนแปะสติกเกอร์ */}
        <p
          data-reveal="stamp"
          className="font-display absolute -top-3.5 left-1/2 -translate-x-1/2 rotate-2 rounded-full border-2 border-ink bg-sun px-3.5 py-0.5 text-[0.6rem] font-bold tracking-[0.14em] whitespace-nowrap text-ink"
        >
          คำวินิจฉัยของสมาคม
        </p>

        <p
          ref={headline}
          data-reveal="headline"
          className="font-display text-4xl leading-none font-bold text-pop sm:text-5xl"
        >
          {outcome.headline}
        </p>

        <p data-reveal="line" className="font-body mt-4 text-sm leading-relaxed text-ink sm:text-base">
          {outcome.verdict}
        </p>

        {outcome.note ? (
          <p data-reveal="line" className="font-body mt-3 text-[0.72rem] leading-relaxed font-light text-ink-soft">
            {outcome.note}
          </p>
        ) : null}

        {/* มุมการ์ดมีจุดสีเล่น ๆ เหมือนถูกปั๊มพลาด */}
        <span
          data-reveal="dot"
          className="absolute -right-2 -bottom-2 h-5 w-5 rotate-12 rounded-md border-2 border-ink bg-mint"
          aria-hidden="true"
        />
      </div>

      <div data-reveal="actions" className="flex flex-wrap items-center justify-center gap-3">
        <ShareButton pieceId={pieceId} pieceTitle={pieceTitle} state={state} />

        {onRestart ? (
          <button
            type="button"
            onClick={onRestart}
            className="font-body cursor-pointer px-3 py-2 text-[0.72rem] text-ink-soft underline decoration-wavy decoration-pop/60 underline-offset-4 transition-colors hover:text-ink"
          >
            {COPY.restart}
          </button>
        ) : null}
      </div>
    </div>
  );
}
