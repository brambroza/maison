"use client";

import { BRAND, COPY } from "@/lib/brand";
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
 * การ์ดผลลัพธ์มาตรฐานของสมาคม
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
      <div className="w-full rounded-sm border border-gold-dim/45 bg-noir-soft/70 px-6 py-7 shadow-[0_0_60px_-25px_rgba(201,169,106,0.5)]">
        <p className="font-body text-[0.55rem] tracking-[0.3em] text-gold-dim uppercase">
          {BRAND.mark} คำวินิจฉัยของสมาคม
        </p>

        <p className="font-display mt-3 text-4xl leading-none font-semibold text-gold sm:text-5xl">
          {outcome.headline}
        </p>

        <p className="font-body mt-4 text-sm leading-relaxed text-ivory sm:text-base">
          {outcome.verdict}
        </p>

        {outcome.note ? (
          <p className="font-body mt-3 text-[0.7rem] leading-relaxed text-ivory/45">
            {outcome.note}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <ShareButton pieceId={pieceId} pieceTitle={pieceTitle} state={state} />

        {onRestart ? (
          <button
            type="button"
            onClick={onRestart}
            className="font-body cursor-pointer px-3 py-2 text-[0.7rem] tracking-[0.14em] text-ivory/45 underline-offset-4 transition-colors hover:text-ivory hover:underline"
          >
            {COPY.restart}
          </button>
        ) : null}
      </div>
    </div>
  );
}
