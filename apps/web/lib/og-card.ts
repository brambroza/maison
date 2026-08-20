/**
 * ตัวสร้าง SVG ของการ์ดแชร์ (ฉบับขี้เล่น)
 *
 * ทำไมจึงเขียน SVG เอง: next/og (satori) ยังวางวรรณยุกต์ที่ตามหลังสระบนผิดตำแหน่ง
 * คำว่า "ที่" จะถูกวาดเป็น "ที" ดู https://github.com/vercel/satori/issues/668
 * สมาคมจึงประกอบ SVG เองแล้วให้ resvg (ซึ่งใช้ rustybuzz) เป็นผู้เรนเดอร์
 * เพราะทำ shaping ภาษาไทยได้ถูกต้องครบถ้วน แลกกับการที่ต้องจัดวางตำแหน่งเอง
 */

import { BRAND, COLORS } from "@/lib/brand";
import type { Outcome } from "@/lib/share";

/** ขนาดการ์ดมาตรฐานของทุกแพลตฟอร์ม */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/** ชื่อตระกูลฟอนต์ตามที่ระบุไว้ในไฟล์ฟอนต์ */
const FONT_DISPLAY = "Mali";
const FONT_BODY = "Mitr";

/** อักขระไทยที่ซ้อนบนหรือใต้พยัญชนะ จึงไม่กินความกว้าง */
const ZERO_WIDTH_MARKS =
  /[ัิีึืฺุู็่้๊๋์ํ๎]/u;

/**
 * ประมาณความกว้างของข้อความเป็นพิกเซล
 *
 * ใช้ค่าประมาณต่ออักขระแทนการอ่านตารางความกว้างจริงจากไฟล์ฟอนต์
 * เพราะการ์ดจัดข้อความไว้กึ่งกลางอยู่แล้ว ความคลาดเคลื่อนเล็กน้อยจึงไม่มีผล
 *
 * @param text - ข้อความที่จะวัด
 * @param fontSize - ขนาดตัวอักษรเป็นพิกเซล
 */
export function estimateWidth(text: string, fontSize: number): number {
  let em = 0;

  for (const char of text) {
    if (ZERO_WIDTH_MARKS.test(char)) continue;
    if (char === " ") em += 0.26;
    else if (/[0-9]/.test(char)) em += 0.55;
    else if (/[A-Z]/.test(char)) em += 0.64;
    else if (/[a-z]/.test(char)) em += 0.5;
    else if (/[.,!?·:;'"()–—]/.test(char)) em += 0.32;
    else em += 0.53; // อักษรไทยและอื่น ๆ
  }

  return em * fontSize;
}

/**
 * ตัดข้อความเป็นบรรทัดให้พอดีความกว้างที่กำหนด
 *
 * ภาษาไทยไม่มีช่องว่างระหว่างคำ จึงตัดที่ช่องว่างก่อนเป็นอันดับแรก
 * ถ้าไม่มีช่องว่างจึงตัดตามความกว้าง โดยไม่แยกวรรณยุกต์ออกจากพยัญชนะ
 *
 * @param text - ข้อความต้นฉบับ
 * @param fontSize - ขนาดตัวอักษรเป็นพิกเซล
 * @param maxWidth - ความกว้างสูงสุดของหนึ่งบรรทัด
 */
export function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  const clusters = toClusters(text);
  const lines: string[] = [];

  let line = "";
  let lineWidth = 0;
  let lastSpaceIndex = -1;

  for (const cluster of clusters) {
    const clusterWidth = estimateWidth(cluster, fontSize);

    if (lineWidth + clusterWidth > maxWidth && line.length > 0) {
      if (lastSpaceIndex > 0) {
        // ตัดที่ช่องว่างล่าสุด แล้วยกส่วนที่เหลือไปบรรทัดถัดไป
        lines.push(line.slice(0, lastSpaceIndex).trimEnd());
        line = line.slice(lastSpaceIndex + 1);
        lineWidth = estimateWidth(line, fontSize);
      } else {
        lines.push(line);
        line = "";
        lineWidth = 0;
      }
      lastSpaceIndex = -1;
    }

    if (cluster === " ") lastSpaceIndex = line.length;
    line += cluster;
    lineWidth += clusterWidth;
  }

  if (line.trim().length > 0) lines.push(line.trim());

  return lines.length > 0 ? lines : [""];
}

/** รวมพยัญชนะกับวรรณยุกต์และสระที่ซ้อนอยู่ให้เป็นหน่วยเดียว ห้ามตัดแยกจากกัน */
function toClusters(text: string): string[] {
  const clusters: string[] = [];

  for (const char of text) {
    if (clusters.length > 0 && ZERO_WIDTH_MARKS.test(char)) {
      clusters[clusters.length - 1] += char;
    } else {
      clusters.push(char);
    }
  }

  return clusters;
}

/** แทนอักขระที่มีความหมายพิเศษใน XML */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type TextBlockOptions = {
  /** ตำแหน่งเส้นฐานของบรรทัดแรก */
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fill: string;
  /** ระยะห่างระหว่างบรรทัด */
  lineHeight: number;
  /** ระยะห่างระหว่างตัวอักษร */
  letterSpacing?: number;
};

/** วาดข้อความหลายบรรทัดกึ่งกลางการ์ด คืนทั้ง SVG และตำแหน่งเส้นฐานของบรรทัดสุดท้าย */
function textBlock(
  lines: readonly string[],
  options: TextBlockOptions,
): { svg: string; lastY: number } {
  const spacing = options.letterSpacing
    ? ` letter-spacing="${options.letterSpacing}"`
    : "";

  const svg = lines
    .map((line, index) => {
      const y = options.y + index * options.lineHeight;
      return `<text x="${CARD_WIDTH / 2}" y="${y}" text-anchor="middle" font-family="${options.fontFamily}" font-size="${options.fontSize}" font-weight="${options.fontWeight}" fill="${options.fill}"${spacing}>${escapeXml(line)}</text>`;
    })
    .join("");

  return { svg, lastY: options.y + (lines.length - 1) * options.lineHeight };
}

/** จุดลูกกวาดโปรยตามมุมการ์ด ตำแหน่งคงที่เพื่อให้การ์ดเดิมหน้าตาเดิมเสมอ */
function confetti(): string {
  const dots: readonly [number, number, number, string, number][] = [
    // [x, y, ขนาด, สี, องศาหมุน]
    [128, 130, 13, COLORS.pop, 18],
    [176, 96, 9, COLORS.sun, -12],
    [1058, 118, 13, COLORS.mint, 30],
    [1016, 168, 9, COLORS.lilac, -20],
    [140, 508, 10, COLORS.lilac, 45],
    [188, 546, 8, COLORS.mint, 10],
    [1052, 512, 11, COLORS.sun, -30],
    [1004, 552, 8, COLORS.pop, 15],
  ];

  return dots
    .map(
      ([x, y, size, fill, deg]) =>
        `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2.5" fill="${fill}" stroke="${COLORS.ink}" stroke-width="2.5" transform="rotate(${deg} ${x + size / 2} ${y + size / 2})"/>`,
    )
    .join("\n  ");
}

export type CardInput = {
  /** เลขประจำชิ้นงาน */
  id: string;
  /** ชื่อชิ้นงาน */
  title: string;
  /** ผลลัพธ์ที่แชร์มา ถ้าเป็น null จะแสดงคำเชิญชวนแทน */
  outcome: Outcome | null;
  /** คำเชิญชวนประจำชิ้นงาน ใช้เมื่อยังไม่มีผลลัพธ์ */
  tagline: string;
};

/**
 * ประกอบ SVG ของการ์ดแชร์ขนาด 1200×630
 *
 * หน้าตาต้องสอดคล้องกับ components/ResultCard.tsx
 * เมื่อแก้ที่ใดที่หนึ่งให้แก้อีกที่ให้ตรงกันเสมอ
 */
export function renderCardSvg({ id, title, outcome, tagline }: CardInput): string {
  const parts: string[] = [];

  // ป้ายชื่อสมาคมเอียงเล็กน้อยเหมือนสติกเกอร์
  // ตรา ✦ วาดเป็นข้าวหลามตัดเอง เพราะฟอนต์ Mali ไม่มีอักขระนี้ (จะกลายเป็นกล่องเปล่า)
  const brandWidth = estimateWidth(BRAND.name, 24) + 108;
  const markX = CARD_WIDTH / 2 - brandWidth / 2 + 28;
  parts.push(
    `<g transform="rotate(-2 ${CARD_WIDTH / 2} 118)">
    <rect x="${CARD_WIDTH / 2 - brandWidth / 2}" y="94" width="${brandWidth}" height="48" rx="24" fill="${COLORS.sun}" stroke="${COLORS.ink}" stroke-width="4"/>
    <rect x="${markX - 6}" y="112" width="12" height="12" rx="2" fill="${COLORS.pop}" stroke="${COLORS.ink}" stroke-width="2.5" transform="rotate(45 ${markX} 118)"/>
    <text x="${CARD_WIDTH / 2 + 16}" y="127" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="24" font-weight="700" fill="${COLORS.ink}" letter-spacing="2">${escapeXml(BRAND.name)}</text>
  </g>`,
  );

  // ป้ายเลขชิ้นงานสีชมพู
  parts.push(
    `<g transform="rotate(2 ${CARD_WIDTH / 2} 184)">
    <rect x="${CARD_WIDTH / 2 - 62}" y="164" width="124" height="40" rx="10" fill="${COLORS.pop}" stroke="${COLORS.ink}" stroke-width="3.5"/>
    <text x="${CARD_WIDTH / 2}" y="192" text-anchor="middle" font-family="${FONT_DISPLAY}" font-size="22" font-weight="700" fill="${COLORS.paper}" letter-spacing="3">${escapeXml(`Nº ${id}`)}</text>
  </g>`,
  );

  parts.push(
    textBlock(wrapText(title, 46, 860), {
      y: 262,
      fontFamily: FONT_DISPLAY,
      fontSize: 46,
      fontWeight: 700,
      fill: COLORS.ink,
      lineHeight: 58,
    }).svg,
  );

  // เส้นหยักลูกคลื่นคั่นกลาง
  const waveY = 296;
  const wave = Array.from({ length: 8 }, (_, i) => {
    const x = CARD_WIDTH / 2 - 112 + i * 28;
    return `Q ${x + 14} ${waveY - 12}, ${x + 28} ${waveY}`;
  }).join(" ");
  parts.push(
    `<path d="M ${CARD_WIDTH / 2 - 112} ${waveY} ${wave}" stroke="${COLORS.pop}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  );

  if (outcome) {
    const headlineLines = wrapText(outcome.headline, 74, 940);
    const headline = textBlock(headlineLines, {
      y: 396,
      fontFamily: FONT_DISPLAY,
      fontSize: 74,
      fontWeight: 700,
      fill: COLORS.pop,
      lineHeight: 84,
    });
    parts.push(headline.svg);

    const verdict = textBlock(wrapText(outcome.verdict, 30, 860), {
      y: headline.lastY + 64,
      fontFamily: FONT_BODY,
      fontSize: 30,
      fontWeight: 400,
      fill: COLORS.ink,
      lineHeight: 46,
    });
    parts.push(verdict.svg);

    if (outcome.note) {
      parts.push(
        textBlock(wrapText(outcome.note, 20, 820), {
          y: verdict.lastY + 42,
          fontFamily: FONT_BODY,
          fontSize: 20,
          fontWeight: 400,
          fill: COLORS.inkSoft,
          lineHeight: 30,
        }).svg,
      );
    }
  } else {
    parts.push(
      textBlock(wrapText(tagline, 32, 860), {
        y: 396,
        fontFamily: FONT_BODY,
        fontSize: 32,
        fontWeight: 400,
        fill: COLORS.ink,
        lineHeight: 48,
      }).svg,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${COLORS.cream}"/>
  <!-- เงาแข็งของกรอบ วางก่อนกรอบจริงให้ดูนูน -->
  <rect x="52" y="56" width="${CARD_WIDTH - 96}" height="${CARD_HEIGHT - 104}" rx="28" fill="${COLORS.ink}"/>
  <rect x="40" y="44" width="${CARD_WIDTH - 96}" height="${CARD_HEIGHT - 104}" rx="28" fill="${COLORS.paper}" stroke="${COLORS.ink}" stroke-width="4"/>
  ${confetti()}
  ${parts.join("\n  ")}
</svg>`;
}
