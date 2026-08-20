"use client";

import { useState } from "react";
import { ResultCard } from "@/components/ResultCard";
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
        <label htmlFor="task" className="font-body text-sm text-ivory/60">
          งานที่ท่านสมาชิกดองไว้
        </label>
        <input
          id="task"
          type="text"
          value={task}
          onChange={(event) => setTask(event.target.value)}
          maxLength={MAX_FREE_TEXT}
          placeholder="ตอบแชทกลุ่มงาน"
          className="font-body w-full rounded-sm border border-gold-dim/45 bg-noir-soft/70 px-4 py-3 text-sm text-ivory placeholder:text-ivory/25"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-body mb-1 text-sm text-ivory/60">ดองมาแล้วเป็นเวลา</legend>

        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => setDays(option.days)}
              aria-pressed={days === option.days}
              className={`font-body cursor-pointer rounded-full border px-4 py-2 text-xs transition-colors ${
                days === option.days
                  ? "border-gold bg-gold text-noir"
                  : "border-gold-dim/40 text-ivory/70 hover:border-gold hover:text-gold"
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
        className="font-body cursor-pointer self-center rounded-full border border-gold px-7 py-2.5 text-xs tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-noir disabled:cursor-not-allowed disabled:border-gold-dim/40 disabled:text-gold-dim/40 disabled:hover:bg-transparent"
      >
        ขอรับใบรับรอง
      </button>
    </div>
  );
}
