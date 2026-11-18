"use client";

import { useEffect, useState } from "react";
import { themeStorageKey } from "./theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // The <head> script already applied the theme before paint; mirror it here.
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      window.localStorage.setItem(themeStorageKey, next);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
    setDark(next === "dark");
  }

  // Fixed name plus aria-pressed: a label that flips with the state would make
  // screen readers announce the opposite of what is on screen.
  return (
    <button
      aria-label="Dark theme"
      aria-pressed={dark}
      className="theme-toggle"
      onClick={toggleTheme}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      type="button"
    >
      {/* CSS picks the glyph from html[data-theme], so it is right on first paint. */}
      <span aria-hidden="true" className="theme-icon-moon">
        {"☾"}
      </span>
      <span aria-hidden="true" className="theme-icon-sun">
        {"☀"}
      </span>
    </button>
  );
}
