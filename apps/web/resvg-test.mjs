import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

const lines = [
  "ลำดับที่ 41,003 · ที่นี่ · เมื่อไหร่",
  "เพื่อนร่วมงาน · พลังหมดสิ้น · เปี่ยม",
  "สิทธิ์ · เงื่อนไข · ซื่อสัตย์ · กี่วัน",
];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#141312"/>
  ${lines
    .map(
      (t, i) =>
        `<text x="600" y="${180 + i * 110}" font-family="Trirong" font-size="56" font-weight="600" fill="#F2EBDD" text-anchor="middle">${t}</text>`,
    )
    .join("\n")}
</svg>`;

const png = new Resvg(svg, {
  font: { fontDirs: ["assets/fonts"], defaultFontFamily: "Trirong", loadSystemFonts: false },
}).render().asPng();

writeFileSync(process.argv[2], png);
console.log("rendered", png.length, "bytes");
