import { describe, expect, it } from "vitest";
import { CARD_HEIGHT, CARD_WIDTH, estimateWidth, renderCardSvg, wrapText } from "@/lib/og-card";

describe("estimateWidth", () => {
  it("ไม่นับความกว้างของวรรณยุกต์และสระที่ซ้อนอยู่", () => {
    expect(estimateWidth("ที", 100)).toBe(estimateWidth("ที่", 100));
  });

  it("ยิ่งข้อความยาวยิ่งกว้างขึ้น", () => {
    expect(estimateWidth("สมาคมความไร้สาระ", 30)).toBeGreaterThan(estimateWidth("สมาคม", 30));
  });
});

describe("wrapText", () => {
  it("คืนบรรทัดเดียวเมื่อข้อความสั้นพอ", () => {
    expect(wrapText("ปุ่มต้องห้าม", 46, 860)).toEqual(["ปุ่มต้องห้าม"]);
  });

  it("ตัดเป็นหลายบรรทัดเมื่อข้อความยาวเกินความกว้าง", () => {
    const lines = wrapText("สมาคมขอเรียนตามตรงว่าไม่เคยพบผู้ใดกดมากเท่าท่าน และสมาคมก่อตั้งมานานพอสมควร", 30, 400);

    expect(lines.length).toBeGreaterThan(1);
  });

  it("ทุกบรรทัดต้องไม่กว้างเกินที่กำหนด", () => {
    const lines = wrapText("ท่านสมาชิกได้รับการเสนอนามเข้าสู่ตำแหน่งผู้ฝ่าฝืนอาวุโสประจำปี", 30, 400);

    for (const line of lines) {
      expect(estimateWidth(line, 30)).toBeLessThanOrEqual(400);
    }
  });

  it("ห้ามแยกวรรณยุกต์ออกจากพยัญชนะ", () => {
    const lines = wrapText("ที่".repeat(60), 30, 300);

    for (const line of lines) {
      expect(line.startsWith("่")).toBe(false);
      expect(line.startsWith("ี")).toBe(false);
    }
  });

  it("รวมกลับแล้วต้องได้อักขระครบเท่าเดิม", () => {
    const text = "สมาคมขอเรียนว่าท่านสมาชิกไม่อยู่ในสภาพที่จะรับสายผู้ใดได้อีก";
    const joined = wrapText(text, 30, 260).join("");

    expect(joined.replace(/\s/g, "")).toBe(text.replace(/\s/g, ""));
  });
});

describe("renderCardSvg", () => {
  it("สร้าง SVG ขนาดมาตรฐานของการ์ดแชร์", () => {
    const svg = renderCardSvg({
      id: "064",
      title: "ปุ่มต้องห้าม",
      outcome: null,
      tagline: "สมาคมได้ขอไว้แล้วว่าอย่ากด",
    });

    expect(svg).toContain(`width="${CARD_WIDTH}"`);
    expect(svg).toContain(`height="${CARD_HEIGHT}"`);
    expect(svg).toContain("สมาคมได้ขอไว้แล้วว่าอย่ากด");
  });

  it("แสดงผลลัพธ์เมื่อมี outcome", () => {
    const svg = renderCardSvg({
      id: "064",
      title: "ปุ่มต้องห้าม",
      outcome: { headline: "ลำดับที่ 41,003", verdict: "คำวินิจฉัย", note: "หมายเหตุ" },
      tagline: "ไม่ควรปรากฏ",
    });

    expect(svg).toContain("ลำดับที่ 41,003");
    expect(svg).not.toContain("ไม่ควรปรากฏ");
  });

  it("แทนอักขระพิเศษของ XML เพื่อไม่ให้ SVG เสีย", () => {
    const svg = renderCardSvg({
      id: "055",
      title: "ใบรับรองการดองงาน",
      outcome: { headline: "ดองแล้ว", verdict: "งาน & <script>", note: "" },
      tagline: "",
    });

    expect(svg).toContain("&amp;");
    expect(svg).not.toContain("<script>");
  });
});
