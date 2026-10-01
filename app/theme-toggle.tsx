"use client";

import { useEffect, useState } from "react";

const storageKey = "portfolio-theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let next = window.matchMedia("(prefers-color-scheme: dark)").matches;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) next = saved === "dark";
    } catch {
      // Fall back to the operating-system preference.
    }

    document.documentElement.dataset.theme = next ? "dark" : "light";
    setDark(next);
  }, []);

  function toggleTheme() {
    setDark((current) => {
      const next = !current;
      const theme = next ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      try {
        window.localStorage.setItem(storageKey, theme);
      } catch {
        // The selected theme still applies when storage is unavailable.
      }
      return next;
    });
  }

  const label = dark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      aria-label={label}
      aria-pressed={dark}
      className="theme-toggle"
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      <span aria-hidden="true">{dark ? "\u2600" : "\u263e"}</span>
    </button>
  );
}
