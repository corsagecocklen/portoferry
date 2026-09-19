import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { socialImage } from "@/lib/site-metadata";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://portoferry.my.id";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Ferry Kurniawan — Web, IT & Video | Portoferry", template: "%s | Portoferry" },
  description: "Website untuk bisnismu, bantuan IT, dan video untuk kontenmu. Kenalan dengan Ferry Kurniawan dan lihat karya di Portoferry.",
  openGraph: {
    title: "Ferry Kurniawan — Website siap. Bisnis jalan.",
    description: "Web Development, IT Consulting, dan Video Editing. Ceritakan idemu, kita kerjakan bareng.",
    locale: "id_ID",
    type: "website",
    siteName: "Portoferry",
    images: [socialImage],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#080c0f" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
