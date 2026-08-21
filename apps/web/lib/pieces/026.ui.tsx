"use client";

import { useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { recordPlay } from "@/lib/ledger-client";
import type { ShareState } from "@/lib/share";
import { dailyStranger, logic } from "./026.logic";
import type { PieceProps } from "./types";

/**
 * Nº 026 · คนแปลกหน้าประจำวัน
 *
 * กลไก: กดรับคำชมหนึ่งครั้ง คนแปลกหน้าประจำวันจะกล่าวคำชมแล้วจากไป
 * คนแปลกหน้าเป็นคนเดียวกันทั้งประเทศในวันนั้น และจะเปลี่ยนเวรตอนเที่ยงคืน
 */
export default function Piece026({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);

  function handleReceive() {
    const { nameIndex, complimentIndex } = dailyStranger();
    setState({ v: complimentIndex, s: nameIndex });
    recordPlay(meta.id);
  }

  if (state) {
    return (
      <div className="flex flex-col items-center gap-5">
        <ResultCard
          pieceId={meta.id}
          pieceTitle={meta.title}
          outcome={logic.toOutcome(state)}
          state={state}
        />
        <p className="font-body max-w-xs text-center text-[0.68rem] leading-relaxed font-light text-ink-soft/80">
          ท่านไม่ต้องตอบกลับ คนแปลกหน้าออกจากพื้นที่ไปแล้ว
          <br />
          คนแปลกหน้าท่านถัดไปจะเข้าเวรเที่ยงคืนตรง
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <p className="font-body max-w-xs text-sm leading-relaxed text-ink-soft">
        สมาคมจัดสรรคนแปลกหน้าหนึ่งท่านต่อวัน มากล่าวคำชมแก่ท่านสมาชิกหนึ่งประโยค
        โดยไม่ต้องสนทนาต่อ
      </p>

      <div className="card-stamp rotate-2 px-8 py-5" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-ink" fill="currentColor">
          {/* เงาคนแปลกหน้าสวมหมวก — วาดเองตามกติกาห้ามอิโมจิ */}
          <rect x="7" y="3" width="10" height="2.2" rx="1" />
          <rect x="9" y="0.5" width="6" height="3" rx="1" />
          <circle cx="12" cy="8.5" r="3" />
          <path d="M12 12c-3.3 0-6 2.2-6 5v6h12v-6c0-2.8-2.7-5-6-5Z" />
        </svg>
      </div>

      <button
        type="button"
        onClick={handleReceive}
        className="btn-stamp btn-stamp-hover font-display px-8 py-3 text-sm font-semibold sm:text-base"
      >
        ขอรับคำชมประจำวัน
      </button>

      <p className="font-body text-[0.66rem] font-light text-ink-soft/70">
        คนแปลกหน้าผ่านการอบรมหลักสูตรการชมโดยไม่ถามต่อ รุ่นที่ 12
      </p>
    </div>
  );
}
