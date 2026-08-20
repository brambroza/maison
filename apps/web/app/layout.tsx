import type { Metadata, Viewport } from "next";
import { Trirong, Bai_Jamjuree } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { BRAND, COLORS, getBaseUrl } from "@/lib/brand";
import "./globals.css";

const trirong = Trirong({
  variable: "--font-trirong",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "600"],
  display: "swap",
});

const baiJamjuree = Bai_Jamjuree({
  variable: "--font-bai-jamjuree",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: `${BRAND.name} ${BRAND.mark}`,
    template: `%s · ${BRAND.name}`,
  },
  description: `${BRAND.tagline} — ${BRAND.motto}`,
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: BRAND.name,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: COLORS.noir,
  // กันการซูมโดยไม่ตั้งใจตอนกดปุ่มรัว ๆ แต่ยังซูมด้วยสองนิ้วได้
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${trirong.variable} ${baiJamjuree.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
