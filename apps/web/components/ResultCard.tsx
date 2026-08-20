"use client";

import { COPY } from "@/lib/brand";
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
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
      <div className="card-stamp relative w-full -rotate-1 px-6 pt-8 pb-7">
        {/* ตราประทับหัวการ์ด วางคร่อมขอบให้เหมือนแปะสติกเกอร์ */}
        <p className="font-display absolute -top-3.5 left-1/2 -translate-x-1/2 rotate-2 rounded-full border-2 border-ink bg-sun px-3.5 py-0.5 text-[0.6rem] font-bold tracking-[0.14em] whitespace-nowrap text-ink">
          คำวินิจฉัยของสมาคม
        </p>

        <p className="font-display text-4xl leading-none font-bold text-pop sm:text-5xl">
          {outcome.headline}
        </p>

        <p className="font-body mt-4 text-sm leading-relaxed text-ink sm:text-base">
          {outcome.verdict}
        </p>

        {outcome.note ? (
          <p className="font-body mt-3 text-[0.72rem] leading-relaxed font-light text-ink-soft">
            {outcome.note}
          </p>
        ) : null}

        {/* มุมการ์ดมีจุดสีเล่น ๆ เหมือนถูกปั๊มพลาด */}
        <span
          className="absolute -right-2 -bottom-2 h-5 w-5 rotate-12 rounded-md border-2 border-ink bg-mint"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
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
