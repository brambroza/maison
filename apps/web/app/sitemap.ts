import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/brand";
import { getReleasedPieces } from "@/lib/registry";

/** แผนผังเว็บ ครอบคลุมหน้าตู้โชว์และทุกชิ้นงานที่เปิดให้ใช้บริการแล้ว */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...getReleasedPieces().map((piece) => ({
      url: `${base}/n/${piece.id}`,
      lastModified: new Date(piece.releasedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
