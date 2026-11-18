import type { Metadata } from "next";
import { EB_Garamond, JetBrains_Mono } from "next/font/google";
import { site } from "@/content/site";
import { defaultTitle, personJsonLd } from "./seo";
import { themeInitScript } from "./theme";
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
  title: {
    default: defaultTitle,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  // No `images` here on purpose: app/opengraph-image.tsx fills them in, and
  // Twitter falls back to them.
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    locale: "en_US",
    title: defaultTitle,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The head script sets data-theme before React hydrates, so <html> differs
    // from the server render by design.
    <html
      lang="en"
      className={`${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLd() }}
        />
        <noscript>
          <style>{`
            .reveal { opacity: 1; transform: none; }
            .theme-toggle { display: none; }
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
