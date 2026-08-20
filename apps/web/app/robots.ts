import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/brand";

/** เปิดให้เก็บดัชนีได้ทุกหน้า ยกเว้นเส้นทางสร้างการ์ดแชร์ */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
