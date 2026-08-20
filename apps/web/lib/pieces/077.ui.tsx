"use client";

import { useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import type { ShareState } from "@/lib/share";
import { QUESTIONS, energyFrom, logic, verdictIndexFor } from "./077.logic";
import type { PieceProps } from "./types";

/**
 * Nº 077 · มาตรวัดพลังสังคม
 *
 * กลไก: ตอบคำถามทีละข้อ ระบบหักพลังตามน้ำหนักของแต่ละเหตุการณ์
 */
export default function Piece077({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [answers, setAnswers] = useState<boolean[]>([]);

  function answer(value: boolean) {
    const next = [...answers, value];

    if (next.length < QUESTIONS.length) {
      setAnswers(next);
      return;
    }

    const energy = energyFrom(next);
    setState({ v: verdictIndexFor(energy), s: energy });
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
          setAnswers([]);
        }}
      />
    );
  }

  const current = QUESTIONS[answers.length];

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
      <p className="font-body text-[0.6rem] tracking-[0.28em] text-gold-dim uppercase">
        ข้อ {answers.length + 1} จาก {QUESTIONS.length}
      </p>

      <p className="font-display min-h-24 text-xl leading-relaxed text-ivory sm:text-2xl">
        {current.text}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => answer(true)}
          className="font-body cursor-pointer rounded-full border border-gold px-8 py-2.5 text-sm tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-noir"
        >
          ใช่
        </button>

        <button
          type="button"
          onClick={() => answer(false)}
          className="font-body cursor-pointer rounded-full border border-gold-dim/50 px-8 py-2.5 text-sm tracking-[0.16em] text-ivory/70 transition-colors hover:border-gold hover:text-gold"
        >
          ไม่ใช่
        </button>
      </div>

      <div className="flex gap-1.5" aria-hidden="true">
        {QUESTIONS.map((question, index) => (
          <span
            key={question.text}
            className={`h-1 w-6 rounded-full ${
              index < answers.length ? "bg-gold" : "bg-gold-dim/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
