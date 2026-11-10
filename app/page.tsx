import { Chakra_Petch, Saira_Condensed } from "next/font/google";
import Link from "next/link";
import { featuredWork } from "@/content/portfolio";
import { site } from "@/content/site";
import LobbyApp from "./_lobby/lobby-app";

const ui = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

const display = Saira_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export default function Home() {
  return (
    <main className={`${ui.variable} ${display.variable} lobby-root`}>
      <div className="sr-only">
        <p>
          {site.name}: {site.headline}. {site.intro}
        </p>
        <p>
          This page is an interactive 3D lobby. For a plain, fully readable
          version, <Link href="/classic">open the classic view</Link>.
        </p>
        <p>Featured work: {featuredWork.summary}</p>
      </div>
      <LobbyApp />
      <noscript>
        <div className="noscript">
          <p>
            The 3D lobby needs JavaScript. <a href="/classic">Open the classic page</a>.
          </p>
        </div>
      </noscript>
    </main>
  );
}
