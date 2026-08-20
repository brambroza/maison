"use client";

import { useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import type { ShareState } from "@/lib/share";
import { labelFor, logic, scoreMessage, verdictIndexFor } from "./007.logic";
import type { PieceProps } from "./types";

/**
 * Nº 007 · โอเคมิเตอร์
 *
 * กลไก: ท่านสมาชิกวางข้อความที่ได้รับ ระบบประเมินระดับความโอเคให้
 * ข้อความไม่ถูกส่งออกจากเบราว์เซอร์และไม่ติดไปกับลิงก์แชร์
 */
export default function Piece007({ meta, initialState }: PieceProps) {
  const [state, setState] = useState<ShareState | null>(initialState);
  const [message, setMessage] = useState("");

  function handleSubmit() {
    const score = scoreMessage(message);
    setState({ v: verdictIndexFor(score), s: score });
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
          setMessage("");
        }}
      />
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <label htmlFor="message" className="font-body text-center text-sm text-ivory/60">
        โปรดวางถ้อยคำที่ท่านได้รับมา
      </label>

      <textarea
        id="message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
        maxLength={500}
        placeholder="ค่ะ"
        className="font-body w-full resize-none rounded-sm border border-gold-dim/45 bg-noir-soft/70 px-4 py-3 text-sm text-ivory placeholder:text-ivory/25"
      />

      <p className="font-body text-center text-[0.62rem] text-ivory/35">
        สมาคมตรวจสอบภายในเครื่องของท่าน ถ้อยคำไม่ถูกส่งไปยังผู้ใด
      </p>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={message.trim().length === 0}
        className="font-body cursor-pointer rounded-full border border-gold px-7 py-2.5 text-xs tracking-[0.16em] text-gold transition-colors hover:bg-gold hover:text-noir disabled:cursor-not-allowed disabled:border-gold-dim/40 disabled:text-gold-dim/40 disabled:hover:bg-transparent"
      >
        ขอรับการวินิจฉัย
      </button>

      <p className="font-body text-center text-[0.6rem] text-ivory/25">
        {labelFor(2)} คือค่ากลางตามมาตรฐานสมาคม
      </p>
    </div>
  );
}
