"use client";

import { useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { COPY } from "@/lib/brand";
import { formatCount, increment } from "@/lib/ledger";
import type { ShareState } from "@/lib/share";
import { logic, verdictIndexFor } from "./064.logic";
import type { PieceProps } from "./types";

/**
 * Nº 064 · ปุ่มต้องห้าม
 *
 * กลไก: มีปุ่มเดียวกลางจอ พร้อมคำขอร้องอย่างสุภาพว่าอย่ากด
 * ยิ่งกดซ้ำ คำวินิจฉัยยิ่งเข้มข้นขึ้นตามลำดับ
 */
export default function Piece064({ meta, initialState, ledgerCount }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [presses, setPresses] = useState(0);
  const [count, setCount] = useState(ledgerCount);

  async function handlePress() {
    const nextPresses = presses + 1;
    const nextCount = await increment(count);

    setPresses(nextPresses);
    setCount(nextCount);
    setState({ v: verdictIndexFor(nextPresses), s: nextCount });
  }

  if (state) {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <ResultCard
          pieceId={meta.id}
          pieceTitle={meta.title}
          outcome={logic.toOutcome(state)}
          state={state}
          onRestart={() => setState(null)}
        />

        <button
          type="button"
          onClick={handlePress}
          className="font-body cursor-pointer text-[0.72rem] text-ink-soft underline decoration-wavy decoration-pop/60 underline-offset-4 transition-colors hover:text-ink"
        >
          กดอีกครั้ง (สมาคมยังคงขอร้องว่าอย่ากด)
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <p className="font-body max-w-xs text-center text-sm leading-relaxed text-ink-soft">
        สมาคมขอความกรุณาท่านสมาชิกอย่ากดปุ่มนี้
      </p>

      <button
        type="button"
        onClick={handlePress}
        aria-label="ปุ่มต้องห้าม"
        className="font-display h-36 w-36 cursor-pointer rounded-full border-4 border-ink bg-pop text-lg font-bold text-paper shadow-[6px_6px_0_0_var(--color-ink)] transition-all duration-150 hover:-translate-y-0.5 hover:rotate-2 hover:shadow-[8px_8px_0_0_var(--color-ink)] active:translate-y-1 active:shadow-[2px_2px_0_0_var(--color-ink)] sm:h-44 sm:w-44 sm:text-xl"
      >
        อย่ากด
      </button>

      <p className="font-body text-center text-[0.68rem] leading-relaxed font-light text-ink-soft/80">
        มีผู้ฝ่าฝืนแล้ว {formatCount(count)} ท่าน
        <br />
        {COPY.ledgerNote}
      </p>
    </div>
  );
}
