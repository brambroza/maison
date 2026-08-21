"use client";

import { useEffect, useRef, useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { recordPlay } from "@/lib/ledger-client";
import type { ShareState } from "@/lib/share";
import { formatValuation, logic, verdictIndexFor } from "./048.logic";
import type { PieceProps } from "./types";

/**
 * Nº 048 · สำนักประเมินมูลค่าไอเดียในห้องน้ำ
 *
 * กลไก: กดเริ่มก่อนเข้าอาบ กดจบเมื่ออาบเสร็จ
 * สมาคมประเมินมูลค่ารวมของไอเดียธุรกิจที่เกิดขึ้นระหว่างนั้นแบบเรียลไทม์
 */
export default function Piece048({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (startedAt === null) return;

    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);

    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [startedAt]);

  function handleStart() {
    setElapsed(0);
    setStartedAt(Date.now());
  }

  function handleStop() {
    if (startedAt === null) return;

    const seconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    setStartedAt(null);
    setState({ v: verdictIndexFor(seconds), s: seconds });
    recordPlay(meta.id);
  }

  if (state) {
    return (
      <ResultCard
        pieceId={meta.id}
        pieceTitle={meta.title}
        outcome={logic.toOutcome(state)}
        state={state}
        onRestart={() => {
          setState(null);
          setElapsed(0);
        }}
      />
    );
  }

  const running = startedAt !== null;

  return (
    <div className="flex flex-col items-center gap-7 text-center">
      <p className="font-body max-w-xs text-sm leading-relaxed text-ink-soft">
        {running
          ? "สมาคมกำลังประเมินมูลค่าไอเดียของท่านแบบเรียลไทม์ โปรดอาบตามปกติ"
          : "โปรดกดเริ่มก่อนเข้าอาบน้ำ สมาคมจะประเมินมูลค่าไอเดียธุรกิจที่เกิดขึ้นระหว่างนั้น"}
      </p>

      {running ? (
        <div className="card-stamp -rotate-1 px-7 py-4">
          <p className="font-display text-[0.62rem] font-semibold tracking-[0.18em] text-ink-soft uppercase">
            มูลค่าสะสมขณะนี้
          </p>
          <p className="font-display mt-1 text-3xl font-bold text-pop tabular-nums sm:text-4xl" aria-live="polite">
            {formatValuation(elapsed)}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={running ? handleStop : handleStart}
        className="btn-stamp btn-stamp-hover font-display px-8 py-3 text-sm font-semibold sm:text-base"
      >
        {running ? "อาบเสร็จแล้ว ขอใบประเมิน" : "เริ่มการอาบเชิงยุทธศาสตร์"}
      </button>

      <p className="font-body max-w-xs text-[0.66rem] leading-relaxed font-light text-ink-soft/70">
        มูลค่าจะระเหยเมื่อเช็ดตัวเสร็จ สมาคมไม่รับผิดชอบไอเดียที่ไหลลงท่อ
      </p>
    </div>
  );
}
