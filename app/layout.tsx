import type { Metadata } from "next";
import { EB_Garamond, JetBrains_Mono } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const serif = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name}, ${site.headline}`,
  description: site.description,
  openGraph: {
    title: `${site.name}, ${site.headline}`,
    description: site.description,
    url: site.url,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}, ${site.headline}`,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <body>
        <noscript>
          <style>{`
            .reveal { opacity: 1; transform: none; }
            .feature .tabs { display: none; }
            .feature .panel[hidden] { display: grid; }
            .feature .panel + .panel { margin-top: 30px; }
            .feature .flow-detail[hidden] { display: block; }
          `}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
