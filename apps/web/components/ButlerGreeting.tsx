"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";

/** คำชมต้อนรับของบัตเลอร์ สุ่มหนึ่งประโยคต่อการเปิดแอป */
const GREETINGS: readonly string[] = [
  "วันนี้ท่านเก่งมากแล้ว",
  "แค่มาถึงตรงนี้ได้ ก็ถือว่าเก่งมากแล้ววันนี้",
  "ท่านทำดีที่สุดแล้ววันนี้ ที่เหลือให้สมาคมดูแล",
  "สมาคมเห็นความพยายามของท่านตลอด แม้วันนี้ท่านยังไม่ได้ทำอะไร",
  "ท่านมาได้ถูกเวลา และถูกที่ อย่างยิ่ง",
];

/** ระยะเวลาแสดงคำชมก่อนบัตเลอร์ถอยออกไปเอง (มิลลิวินาที) */
const VISIBLE_MS = 4_500;

/**
 * ชมหนึ่งครั้งต่อการเปิดแอป — ตัวแปรระดับโมดูลอยู่ในหน่วยความจำเท่านั้น
 * รีเซ็ตเมื่อโหลดหน้าใหม่ทั้งหน้า และคงอยู่ระหว่างการกดเปลี่ยนหน้าภายในแอป
 * (ไม่ใช้ localStorage/cookie ตามกติกาของสมาคม)
 */
let alreadyGreeted = false;

/** สุ่มคำชม — แยกออกนอก component ตามกติกา purity ของ React */
function drawGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

/**
 * บัตเลอร์ต้อนรับ — ป้ายคำชมเลื่อนลงมาจากขอบบนทันทีที่เปิดแอป
 * แสดงครู่เดียวแล้วถอยออกไปเอง หรือแตะเพื่อรับทราบ
 */
export function ButlerGreeting() {
  const [message, setMessage] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (alreadyGreeted) return;
    alreadyGreeted = true;

    // บัตเลอร์เว้นจังหวะครู่หนึ่งก่อนเข้ามาชม (และให้ setState อยู่ใน callback ของ timer)
    const enterTimer = window.setTimeout(() => setMessage(drawGreeting()), 350);
    const hideTimer = window.setTimeout(() => setLeaving(true), 350 + VISIBLE_MS);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  // ถอยจบแล้วค่อยถอดออกจาก DOM (รอ transition 300ms)
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setMessage(null), 300);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  if (!message) return null;

  return (
    <button
      type="button"
      role="status"
      aria-live="polite"
      onClick={() => setLeaving(true)}
      className={`fixed top-3 inset-x-4 z-[60] mx-auto block max-w-sm cursor-pointer transition-all duration-300 ${
        leaving ? "-translate-y-24 opacity-0" : "animate-greet-in"
      }`}
    >
      <span className="card-stamp block -rotate-1 px-5 py-3.5 text-center">
        <span className="font-display block text-[0.6rem] font-semibold tracking-[0.18em] text-pop uppercase">
          {BRAND.mark} สารจากบัตเลอร์
        </span>
        <span className="font-display mt-1 block text-base leading-snug font-bold text-ink">
          {message}
        </span>
        <span className="font-body mt-1 block text-[0.62rem] font-light text-ink-soft">
          — บัตเลอร์ประจำสมาคม (แตะเพื่อรับทราบ)
        </span>
      </span>
    </button>
  );
}
