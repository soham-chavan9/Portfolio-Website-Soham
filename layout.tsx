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
  title: `${site.name} — mobile and backend engineer`,
  description:
    "Engineer working on React Native release infrastructure, iOS native modules, and NestJS backends. Writeups on shipping and hardening a production mobile app.",
  openGraph: {
    title: `${site.name} — mobile and backend engineer`,
    description:
      "Writeups on release pipelines, on-device moderation, and store compliance for a production React Native app.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
