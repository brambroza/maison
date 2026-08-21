"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { asideRequested, onAside } from "@/lib/mascot/attention";
import { drawChatter, type ButlerMood } from "@/lib/mascot/chatter";
import { ANSWERS, INQUIRY, INQUIRY_KICKER, SILENCE_RETORT } from "@/lib/mascot/inquiry";
import { createPointerSignal, type MascotReport, type PointerSignal } from "./shared";

/** ฉากสามมิติหนักกว่าหน้าเว็บทั้งหน้า จึงโหลดทีหลังและไม่แตะฝั่งเซิร์ฟเวอร์เลย */
const MascotStage = dynamic(() => import("./MascotStage"), { ssr: false });

/** ระยะเวลาที่ป้ายคำพูดค้างอยู่ก่อนจางหายไปเอง */
const BUBBLE_MS = 5_200;

/** ระยะขอบซ้ายขวาที่ป้ายคำพูดห้ามล้ำออกไป */
const BUBBLE_MARGIN = 116;

/** แตะใกล้ศีรษะบัตเลอร์ไม่เกินระยะนี้ ถือว่าท่านสมาชิกทักทาย (พิกเซล) */
const POKE_RADIUS = 76;

/**
 * บัตเลอร์รอให้ป้ายต้อนรับพูดจบก่อน แล้วจึงเดินมายกคำถามขึ้นถาม
 * นับจากตอนที่บัตเลอร์เข้าฉาก ไม่ใช่ตอนโหลดหน้า
 */
const INQUIRY_DELAY_MS = 4_200;

/** ไม่ตอบภายในเวลานี้ บัตเลอร์จะเลิกรอเอง */
const INQUIRY_PATIENCE_MS = 22_000;

/**
 * บัตเลอร์ยกคำถามขึ้นถามไปแล้วหรือยัง — เก็บในหน่วยความจำเท่านั้น
 * จึงถามครั้งเดียวต่อการเปิดแอปหนึ่งครั้ง และไม่ถามซ้ำตอนกดเปลี่ยนหน้าภายในแอป
 */
let asked = false;

/**
 * บัตเลอร์ถอยไปพักแล้วหรือยัง — เก็บในหน่วยความจำเท่านั้น
 * รีเซ็ตเมื่อโหลดหน้าใหม่ทั้งหน้า ตามกติกาของสมาคมที่ห้ามใช้ localStorage
 */
let resting = false;

/**
 * สถานะการปรากฏตัวของบัตเลอร์
 *
 * waiting = ยังไม่ถึงเวลาเข้าฉาก · attending = อยู่รับใช้ ·
 * resting = ถอยไปพักตามคำสั่ง (มีปุ่มเรียกกลับ) ·
 * excused = ท่านสมาชิกตั้งค่าลดการเคลื่อนไหวไว้ จึงไม่ต้องปรากฏตัวเลย
 */
type Presence = "waiting" | "attending" | "resting" | "excused";

/** บัตเลอร์เว้นจังหวะให้หน้าเว็บวาดเสร็จและให้ป้ายต้อนรับได้พูดก่อน */
const ENTRANCE_DELAY_MS = 900;

/**
 * บัตเลอร์มาสคอตประจำสมาคม — เดินตามเคอร์เซอร์ไปทั่วหน้าจอและคอยสอดส่อง
 *
 * ชั้นนี้ดูแลเฉพาะฝั่ง DOM: รับตำแหน่งเมาส์ ส่งเข้าไปในฉาก
 * แล้วรับตำแหน่งศีรษะกลับออกมาเพื่อวางป้ายคำพูดกับพื้นที่ให้แตะ
 * ตำแหน่งเขียนลง style โดยตรงทุกเฟรม จึงไม่ทำให้หน้าเว็บ re-render ตาม
 */
export function ButlerMascot() {
  const [presence, setPresence] = useState<Presence>("waiting");
  const [line, setLine] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  /** กำลังรอคำตอบอยู่หรือไม่ — ป้ายคำพูดจะมีปุ่มให้เลือกเฉพาะตอนนี้ */
  const [asking, setAsking] = useState(false);

  const pointer = useRef<PointerSignal>(createPointerSignal());
  const frame = useRef<HTMLDivElement>(null);
  const bubbleAnchor = useRef<HTMLDivElement>(null);
  /** ตำแหน่งศีรษะล่าสุดบนจอ ใช้ตัดสินว่าการแตะครั้งนั้นโดนตัวบัตเลอร์หรือไม่ */
  const headAt = useRef({ x: -999, y: -999 });
  const lastLine = useRef<string | null>(null);
  const hideTimer = useRef<number | null>(null);
  /**
   * ป้ายคำพูดหยุดนิ่งขณะแสดงผล
   *
   * ถ้าปล่อยให้วิ่งตามศีรษะตลอด ตัวหนังสือจะสั่นจนอ่านยาก
   * และปุ่มขอให้ถอยไปพักจะกดไม่โดนเมื่อบัตเลอร์เดินหนี
   */
  const bubblePinned = useRef(false);

  useEffect(() => {
    // ท่านสมาชิกที่ตั้งค่าลดการเคลื่อนไหวไว้ ไม่ควรเจอตัวละครเดินไปมาทั้งหน้าจอ
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => {
      if (media.matches) setPresence("excused");
      else setPresence(resting ? "resting" : "attending");
    };

    const timer = window.setTimeout(settle, ENTRANCE_DELAY_MS);
    media.addEventListener("change", settle);

    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", settle);
    };
  }, []);

  // ── คำสั่งให้ถอยไปยืนข้าง เมื่อมีคำวินิจฉัยขึ้นจอ ──────────
  useEffect(() => {
    if (presence !== "attending") return;

    pointer.current.aside = asideRequested();

    return onAside((aside) => {
      pointer.current.aside = aside;
    });
  }, [presence]);

  // ── รับตำแหน่งเมาส์และนิ้ว แล้วแปลงเป็นพิกัดของกล้อง ──────────
  useEffect(() => {
    if (presence !== "attending") return;

    let rect = frame.current?.getBoundingClientRect() ?? null;
    let previous: { x: number; y: number; at: number } | null = null;

    function remeasure() {
      rect = frame.current?.getBoundingClientRect() ?? null;
    }

    function handleMove(event: PointerEvent) {
      if (!rect) remeasure();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const now = performance.now();
      const signal = pointer.current;

      if (previous) {
        const seconds = Math.max(0.016, (now - previous.at) / 1000);
        const travelled = Math.hypot(x - previous.x, y - previous.y) / rect.width;
        // ค่าเฉลี่ยแบบถ่วงน้ำหนัก กันไม่ให้การกระตุกครั้งเดียวนับเป็นความรีบ
        signal.speed += (travelled / seconds - signal.speed) * 0.25;
      }
      previous = { x, y, at: now };

      signal.ndcX = (x / rect.width) * 2 - 1;
      signal.ndcY = -(y / rect.height) * 2 + 1;
      signal.inside = y >= 0 && y <= rect.height;
      signal.movedAt = now;
    }

    function handleLeave() {
      pointer.current.inside = false;
    }

    // ไม่วางปุ่มทับตัวบัตเลอร์ เพราะปุ่มที่ลอยไปทั่วจอจะบังของที่อยู่ข้างล่าง
    // จึงวัดระยะจากจุดที่แตะไปยังศีรษะแทน แล้วปล่อยให้การแตะทะลุลงไปตามปกติ
    function handlePoke(event: PointerEvent) {
      if (!rect) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (Math.hypot(x - headAt.current.x, y - headAt.current.y) <= POKE_RADIUS) {
        pointer.current.pokes += 1;
      }
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerdown", handleMove, { passive: true });
    window.addEventListener("pointerdown", handlePoke, { passive: true });
    document.addEventListener("pointerleave", handleLeave);
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerdown", handleMove);
      window.removeEventListener("pointerdown", handlePoke);
      document.removeEventListener("pointerleave", handleLeave);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure);
    };
  }, [presence]);

  // ── ตำแหน่งศีรษะจากฉาก เขียนลง style ตรง ๆ ทุกเฟรม ──────────
  const handleReport = useCallback((report: MascotReport) => {
    headAt.current.x = report.x;
    headAt.current.y = report.y;

    const bubble = bubbleAnchor.current;
    if (bubble && !bubblePinned.current) {
      const limit = Math.max(BUBBLE_MARGIN, report.width - BUBBLE_MARGIN);
      const x = Math.min(Math.max(report.x, BUBBLE_MARGIN), limit);
      bubble.style.transform = `translate3d(${x}px, ${report.y}px, 0)`;
    }
  }, []);

  /** ยกป้ายคำพูดขึ้นหนึ่งใบ แล้วปล่อยให้จางหายไปเอง */
  const speak = useCallback((text: string) => {
    lastLine.current = text;
    setLine(text);
    setVisible(true);
    bubblePinned.current = true;

    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      bubblePinned.current = false;
      setVisible(false);
    }, BUBBLE_MS);
  }, []);

  /** ท่านสมาชิกตอบแล้ว บัตเลอร์จึงโต้กลับหนึ่งประโยคแล้วกลับไปทำหน้าที่ */
  const answer = useCallback(
    (retort: string) => {
      pointer.current.asking = false;
      setAsking(false);
      speak(retort);
    },
    [speak],
  );

  const say = useCallback((mood: ButlerMood) => {
    speak(drawChatter(mood, lastLine.current));
  }, [speak]);

  // ── คำถามแรกเมื่อเปิดแอป ────────────────────────────
  useEffect(() => {
    if (presence !== "attending" || asked) return;
    asked = true;

    const ask = window.setTimeout(() => {
      pointer.current.asking = true;
      lastLine.current = INQUIRY;
      setLine(INQUIRY);
      setAsking(true);
      setVisible(true);
      bubblePinned.current = true;
    }, INQUIRY_DELAY_MS);

    const giveUp = window.setTimeout(() => {
      // ยังรอคำตอบอยู่หรือไม่ ตรวจจากสัญญาณ เพราะตอบไปแล้วธงจะถูกลดลง
      if (pointer.current.asking) answer(SILENCE_RETORT);
    }, INQUIRY_DELAY_MS + INQUIRY_PATIENCE_MS);

    return () => {
      window.clearTimeout(ask);
      window.clearTimeout(giveUp);
    };
  }, [presence, answer]);

  useEffect(
    () => () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    },
    [],
  );

  // ตรึง element ของฉากไว้ เพื่อไม่ให้ผืนผ้าใบถูกสร้างใหม่ทุกครั้งที่ป้ายคำพูดเปลี่ยน
  const stage = useMemo(
    () => <MascotStage pointer={pointer} onReport={handleReport} onMood={say} />,
    [handleReport, say],
  );

  if (presence === "waiting" || presence === "excused") return null;

  if (presence === "resting") {
    return (
      <button
        type="button"
        onClick={() => {
          resting = false;
          setPresence("attending");
        }}
        className="btn-quiet font-display fixed right-4 bottom-[5.6rem] z-40 flex items-center gap-2 px-4 py-2.5 text-xs font-semibold sm:bottom-5"
      >
        {/* ถาดเสิร์ฟ — ตราเดียวกับปุ่มกลางของแถบบัตเลอร์ */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M4 15a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M2.5 15h19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="12" cy="5.5" r="1.7" fill="currentColor" />
        </svg>
        ขอเรียกบัตเลอร์
      </button>
    );
  }


  return (
    <div
      ref={frame}
      // เว้นที่ให้แถบบัตเลอร์ด้านล่างบนมือถือ บัตเลอร์จึงไม่เดินไปยืนทับปุ่ม
      className="pointer-events-none fixed inset-x-0 top-0 bottom-[4.6rem] z-40 overflow-hidden sm:bottom-0"
    >
      {/* ตัวฉากเป็นของประดับล้วน ไม่ต้องให้โปรแกรมอ่านหน้าจออ่าน */}
      <div className="absolute inset-0" aria-hidden="true">
        {stage}
      </div>

      {/* ป้ายคำพูด ลอยอยู่เหนือหมวก */}
      <div ref={bubbleAnchor} className="absolute top-0 left-0 will-change-transform">
        <div
          className={`pointer-events-none -mt-16 -translate-x-1/2 -translate-y-full transition-opacity duration-300 ${
            asking ? "w-[min(17rem,80vw)]" : "w-[min(15rem,72vw)]"
          } ${visible ? "opacity-100" : "opacity-0"}`}
        >
          {line ? (
            <div className="card-stamp -rotate-1 px-4 py-3" role="status">
              <p className="font-display text-[0.58rem] font-semibold tracking-[0.16em] text-pop uppercase">
                {BRAND.mark} {asking ? INQUIRY_KICKER : "บัตเลอร์กระซิบ"}
              </p>
              <p className="font-display mt-1 text-[0.82rem] leading-snug font-bold text-ink">
                {line}
              </p>

              {asking ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {ANSWERS.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => answer(choice.retort)}
                      className="btn-quiet font-display pointer-events-auto px-2.5 py-1 text-[0.66rem] font-semibold"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  pointer.current.asking = false;
                  setAsking(false);
                  resting = true;
                  setPresence("resting");
                }}
                className="font-body pointer-events-auto mt-2 cursor-pointer text-[0.6rem] font-light text-ink-soft underline underline-offset-2"
              >
                ขอให้บัตเลอร์ถอยไปพัก
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
