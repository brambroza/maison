import type { Metadata, Viewport } from "next";
import { Mali, Mitr } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ButlerBar } from "@/components/ButlerBar";
import { BRAND, COLORS, getBaseUrl } from "@/lib/brand";
import "./globals.css";

const mali = Mali({
  variable: "--font-mali",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const mitr = Mitr({
  variable: "--font-mitr",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500"],
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
  themeColor: COLORS.cream,
  // กันการซูมโดยไม่ตั้งใจตอนกดปุ่มรัว ๆ แต่ยังซูมด้วยสองนิ้วได้
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${mali.variable} ${mitr.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <ButlerBar />
        <Analytics />
      </body>
    </html>
  );
}
