"use client";

import { useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { recordPlay } from "@/lib/ledger-client";
import { MAX_FREE_TEXT, sanitizeFreeText, type ShareState } from "@/lib/share";
import { DURATION_OPTIONS, logic, verdictIndexFor } from "./055.logic";
import type { PieceProps } from "./types";

/**
 * Nº 055 · ใบรับรองการดองงาน
 *
 * กลไก: ระบุงานที่ดองไว้และระยะเวลา สมาคมออกใบรับรองให้ทันที
 */
export default function Piece055({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [task, setTask] = useState("");
  const [days, setDays] = useState(DURATION_OPTIONS[1].days);

  function handleSubmit() {
    const cleanTask = sanitizeFreeText(task);
    setState({
      v: verdictIndexFor(days),
      s: days,
      ...(cleanTask ? { t: cleanTask } : {}),
    });
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
          setTask("");
        }}
      />
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="task" className="font-body text-sm text-ink-soft">
          งานที่ท่านสมาชิกดองไว้
        </label>
        <input
          id="task"
          type="text"
          value={task}
          onChange={(event) => setTask(event.target.value)}
          maxLength={MAX_FREE_TEXT}
          placeholder="ตอบแชทกลุ่มงาน"
          className="font-body w-full rounded-xl border-[3px] border-ink bg-paper px-4 py-3 text-sm text-ink shadow-[3px_3px_0_0_var(--color-ink)] placeholder:text-ink-soft/50"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-body mb-1 text-sm text-ink-soft">ดองมาแล้วเป็นเวลา</legend>

        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => setDays(option.days)}
              aria-pressed={days === option.days}
              className={`font-body cursor-pointer rounded-full border-[3px] border-ink px-4 py-2 text-xs transition-all ${
                days === option.days
                  ? "-rotate-2 bg-sun font-medium text-ink shadow-[2px_2px_0_0_var(--color-ink)]"
                  : "bg-paper text-ink-soft hover:bg-sun/40 hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={task.trim().length === 0}
        className="btn-stamp btn-stamp-hover font-display px-7 py-2.5 text-sm font-semibold self-center disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-0 disabled:hover:shadow-[4px_4px_0_0_var(--color-ink)]"
      >
        ขอรับใบรับรอง
      </button>
    </div>
  );
}
