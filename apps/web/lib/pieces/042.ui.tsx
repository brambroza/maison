"use client";

import { useEffect, useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import type { ShareState } from "@/lib/share";
import { DELIBERATION_SECONDS, drawResolutionIndex, logic } from "./042.logic";
import type { PieceProps } from "./types";

/** ถ้อยแถลงระหว่างการประชุม แสดงเรียงไปตามเวลาเพื่อให้ดูสมจริง */
const AGENDA: readonly string[] = [
  "ตรวจสอบองค์ประชุม",
  "รับรองรายงานการประชุมครั้งก่อน",
  "อภิปรายวาระอาหารประเภทเส้น",
  "อภิปรายวาระอาหารประเภทข้าว",
  "รับฟังความเห็นของกรรมการเสียงข้างน้อย",
  "ลงมติ",
];

/**
 * Nº 042 · สภาตัดสินใจว่ากินอะไรดี
 *
 * กลไก: กดขอมติ คณะกรรมการประชุม 12 วินาทีตามระเบียบ แล้วลงมติ
 */
export default function Piece042({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(DELIBERATION_SECONDS);

  useEffect(() => {
    if (deadline === null) return;

    const timer = window.setInterval(() => {
      const left = Math.ceil((deadline - Date.now()) / 1000);

      if (left > 0) {
        setRemaining(left);
        return;
      }

      window.clearInterval(timer);
      setDeadline(null);
      setState({ v: drawResolutionIndex() });
    }, 250);

    return () => window.clearInterval(timer);
  }, [deadline]);

  function handleRequest() {
    setRemaining(DELIBERATION_SECONDS);
    setDeadline(Date.now() + DELIBERATION_SECONDS * 1000);
  }

  if (state) {
    return (
      <ResultCard
        pieceId={meta.id}
        pieceTitle={meta.title}
        outcome={logic.toOutcome(state)}
        state={state}
        onRestart={() => setState(null)}
      />
    );
  }

  if (deadline !== null) {
    const elapsed = DELIBERATION_SECONDS - remaining;
    const agendaIndex = Math.min(
      AGENDA.length - 1,
      Math.floor((elapsed / DELIBERATION_SECONDS) * AGENDA.length),
    );

    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="font-display text-[0.68rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">
          ที่ประชุมกำลังพิจารณา
        </p>

        <p className="font-display text-2xl font-bold text-pop sm:text-3xl" aria-live="polite">
          {AGENDA[agendaIndex]}
        </p>

        <p className="font-body text-sm font-light text-ink-soft tabular-nums">
          เหลืออีก {remaining} วินาที
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <p className="font-body max-w-xs text-sm leading-relaxed text-ink-soft">
        โปรดยื่นวาระต่อคณะกรรมการ ระเบียบสมาคมกำหนดให้ประชุมอย่างน้อย{" "}
        {DELIBERATION_SECONDS} วินาที
      </p>

      <button
        type="button"
        onClick={handleRequest}
        className="btn-stamp btn-stamp-hover font-display px-8 py-3 text-sm font-semibold sm:text-base"
      >
        ขอมติที่ประชุม
      </button>
    </div>
  );
}
