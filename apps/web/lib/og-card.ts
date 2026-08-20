/**
 * ตัวสร้าง SVG ของการ์ดแชร์
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
const FONT_DISPLAY = "Trirong";
const FONT_BODY = "Bai Jamjuree";

/** อักขระไทยที่ซ้อนบนหรือใต้พยัญชนะ จึงไม่กินความกว้าง */
const ZERO_WIDTH_MARKS =
  /[ัิีึืฺุู็่้๊๋์ํ๎]/u;

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
  /** ระยะห่างระหว่างตัวอักษร ใช้กับหัวเรื่องแบบราชสำนัก */
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

  // ตราสมาคมรูปข้าวหลามตัด วาดด้วยกล่องหมุน 45 องศา
  parts.push(
    `<rect x="${CARD_WIDTH / 2 - 5}" y="88" width="10" height="10" fill="${COLORS.gold}" transform="rotate(45 ${CARD_WIDTH / 2} 93)"/>`,
  );

  parts.push(
    textBlock([BRAND.name], {
      y: 138,
      fontFamily: FONT_BODY,
      fontSize: 22,
      fontWeight: 400,
      fill: COLORS.goldDim,
      lineHeight: 0,
      letterSpacing: 8,
    }).svg,
  );

  parts.push(
    textBlock([`Nº ${id}`], {
      y: 190,
      fontFamily: FONT_BODY,
      fontSize: 20,
      fontWeight: 400,
      fill: COLORS.gold,
      lineHeight: 0,
      letterSpacing: 6,
    }).svg,
  );

  parts.push(
    textBlock(wrapText(title, 46, 860), {
      y: 240,
      fontFamily: FONT_DISPLAY,
      fontSize: 46,
      fontWeight: 600,
      fill: COLORS.ivory,
      lineHeight: 58,
    }).svg,
  );

  parts.push(
    `<line x1="${CARD_WIDTH / 2 - 110}" y1="282" x2="${CARD_WIDTH / 2 + 110}" y2="282" stroke="${COLORS.goldDim}" stroke-width="1"/>`,
  );

  if (outcome) {
    const headlineLines = wrapText(outcome.headline, 74, 940);
    const headline = textBlock(headlineLines, {
      y: 380,
      fontFamily: FONT_DISPLAY,
      fontSize: 74,
      fontWeight: 600,
      fill: COLORS.gold,
      lineHeight: 84,
    });
    parts.push(headline.svg);

    const verdict = textBlock(wrapText(outcome.verdict, 30, 860), {
      y: headline.lastY + 66,
      fontFamily: FONT_BODY,
      fontSize: 30,
      fontWeight: 400,
      fill: COLORS.ivory,
      lineHeight: 46,
    });
    parts.push(verdict.svg);

    if (outcome.note) {
      parts.push(
        textBlock(wrapText(outcome.note, 20, 820), {
          y: verdict.lastY + 44,
          fontFamily: FONT_BODY,
          fontSize: 20,
          fontWeight: 400,
          fill: "rgb(160,153,140)",
          lineHeight: 30,
        }).svg,
      );
    }
  } else {
    parts.push(
      textBlock(wrapText(tagline, 32, 860), {
        y: 380,
        fontFamily: FONT_BODY,
        fontSize: 32,
        fontWeight: 400,
        fill: COLORS.ivory,
        lineHeight: 48,
      }).svg,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="0%" r="70%">
      <stop offset="0%" stop-color="${COLORS.gold}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${COLORS.gold}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${COLORS.noir}"/>
  <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#glow)"/>
  <rect x="56" y="56" width="${CARD_WIDTH - 112}" height="${CARD_HEIGHT - 112}" fill="none" stroke="${COLORS.goldDim}" stroke-width="1"/>
  ${parts.join("\n  ")}
</svg>`;
}
