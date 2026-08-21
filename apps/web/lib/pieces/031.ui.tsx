"use client";

import { useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { recordPlay } from "@/lib/ledger-client";
import type { ShareState } from "@/lib/share";
import { listSpeakers, logic } from "./031.logic";
import type { PieceProps } from "./types";

/**
 * Nº 031 · สำนักแปลคำว่าไม่เป็นไร
 *
 * กลไก: เลือกว่าผู้ใดเป็นผู้กล่าว แล้วสำนักแปลจะถอดความหมายให้ทันที
 */
export default function Piece031({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const speakers = listSpeakers();

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

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <p className="font-body text-center text-sm leading-relaxed text-ink-soft">
        ผู้ใดเป็นผู้กล่าวคำว่า “ไม่เป็นไร” แก่ท่าน
      </p>

      <ul className="flex w-full flex-col gap-2.5">
        {speakers.map((speaker, index) => (
          <li key={speaker}>
            <button
              type="button"
              onClick={() => {
                setState({ v: index });
                recordPlay(meta.id);
              }}
              className="btn-quiet font-body w-full px-5 py-3 text-sm"
            >
              {speaker}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
