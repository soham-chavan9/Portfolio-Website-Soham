"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Catches a crash in any page, the 3D lobby included, and always offers the
// plain page so a visitor is never left on a dead screen.
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="frame">
      <section className="status-page">
        <p className="eyebrow">Something broke</p>
        <h1>This page failed to load.</h1>
        <p>Try again, or read the same portfolio on the plain page.</p>
        <div className="btns">
          {/* A full page load, not a client navigation, in case the client bundle is what failed. */}
          <a className="btn primary" href="/classic">
            Open the classic page
          </a>
          <button className="btn" onClick={() => retry()} type="button">
            Try again
          </button>
        </div>
      </section>
    </main>
  );
}
