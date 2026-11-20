import type { Metadata } from "next";
import { Chakra_Petch, Geist, Share_Tech_Mono } from "next/font/google";
import Link from "next/link";
import { currentRole, resume } from "@/content/resume";
import LobbyApp from "./_lobby/lobby-app";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const ui = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

const num = Share_Tech_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-num",
  display: "swap",
});

const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export default function Home() {
  return (
    <main className={`${ui.variable} ${num.variable} ${display.variable} lobby-root`}>
      <div className="sr-only">
        <p>
          {resume.name}, {resume.headline}, {resume.location}. {currentRole.title} at {currentRole.org}.
        </p>
        <p>
          This page is an interactive 3D lobby. For a plain, fully readable
          version, <Link href="/classic">open the classic view</Link>.
        </p>
      </div>
      <LobbyApp />
      {/* Shown by CSS only when the scene could not start WebGL. */}
      <Link className="lobby-escape" href="/classic">
        Open the classic page instead
      </Link>
      <noscript>
        <div className="noscript">
          <p>
            The 3D lobby needs JavaScript.{" "}
            <a href="/classic">Open the classic page</a>.
          </p>
        </div>
      </noscript>
    </main>
  );
}
