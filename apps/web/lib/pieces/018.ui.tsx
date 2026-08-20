"use client";

import { useEffect, useRef, useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import type { ShareState } from "@/lib/share";
import { formatDuration, logic, verdictIndexFor } from "./018.logic";
import type { PieceProps } from "./types";

/**
 * Nº 018 · นาฬิกาแป๊บนึง
 *
 * กลไก: กดเริ่มตอนกล่าวคำว่า "แป๊บนึง" แล้วกดหยุดเมื่อกลับมา
 * ระบบออกใบวินิจฉัยตามระยะเวลาที่วัดได้จริง
 */
export default function Piece018({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (startedAt === null) return;

    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);

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
    <div className="flex flex-col items-center gap-8">
      <p className="font-body max-w-xs text-center text-sm leading-relaxed text-ink-soft">
        {running
          ? "สมาคมกำลังจับเวลาอยู่ โปรดกดหยุดเมื่อท่านกลับมา"
          : "โปรดกดเมื่อท่านสมาชิกกล่าวคำว่า แป๊บนึง"}
      </p>

      <p
        className="card-stamp font-display rotate-1 px-7 py-4 text-4xl font-bold text-pop tabular-nums sm:text-5xl"
        aria-live="polite"
      >
        {formatDuration(elapsed)}
      </p>

      <button
        type="button"
        onClick={running ? handleStop : handleStart}
        className="btn-stamp btn-stamp-hover font-display px-8 py-3 text-sm font-semibold sm:text-base"
      >
        {running ? "กลับมาแล้ว" : "เริ่มจับเวลา"}
      </button>
    </div>
  );
}
