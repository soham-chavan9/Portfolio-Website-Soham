"use client";

import { useEffect, useRef, useState } from "react";

// Fades a block in when it first enters view. Bails out entirely if the
// visitor has asked for reduced motion — then the content is just there.
export default function Reveal({
  children,
  delay = 0,
  as = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "li";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | HTMLLIElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const classes = [shown ? "reveal is-in" : "reveal", className]
    .filter(Boolean)
    .join(" ");

  if (as === "li") {
    return (
      <li
        ref={ref as React.RefObject<HTMLLIElement>}
        className={classes}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {children}
      </li>
    );
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={classes}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
