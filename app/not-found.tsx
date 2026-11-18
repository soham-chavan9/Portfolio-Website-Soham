import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="frame">
      <section className="status-page">
        <p className="eyebrow">404</p>
        <h1>That page does not exist.</h1>
        <p>The link may be old, or the address has a typo.</p>
        <div className="btns">
          <Link className="btn primary" href="/classic">
            Open the classic page
          </Link>
          <Link className="btn" href="/">
            Go to the 3D lobby
          </Link>
        </div>
      </section>
    </main>
  );
}
