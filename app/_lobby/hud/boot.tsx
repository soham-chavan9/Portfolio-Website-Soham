"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bootLines, tips } from "@/content/scene";
import { resume } from "@/content/resume";
import { setSound, skipIntro, start } from "../actions";
import { lobby, useLobby } from "../store";
import { Emblem, IconMute, IconSound } from "./icons";

const MIN_BOOT_MS = 1900;
/** After this long without a ready scene, offer the plain page. */
const SLOW_BOOT_MS = 9000;

/** Keys that should never count as "press any key" (and keep their default). */
const PASSIVE_KEYS = new Set([
  "Tab",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "Escape",
  "ContextMenu",
  "Fn",
  "Dead",
  "Unidentified",
  "AudioVolumeUp",
  "AudioVolumeDown",
  "AudioVolumeMute",
]);

export function BootScreen() {
  const phase = useLobby((s) => s.phase);
  const ready = useLobby((s) => s.sceneReady);
  const [progress, setProgress] = useState(0);
  const [line, setLine] = useState(0);
  const [tip, setTip] = useState(0);
  const [slow, setSlow] = useState(false);

  // Random tip after hydration so server and client markup agree.
  useEffect(() => {
    if (tips.length > 1) setTip(Math.floor(Math.random() * tips.length));
  }, []);

  useEffect(() => {
    if (phase !== "boot") return;
    const startedAt = performance.now();
    let p = 0;
    let handoff = 0;
    const slowId = window.setTimeout(() => setSlow(true), SLOW_BOOT_MS);
    const id = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const isReady = lobby.get().sceneReady;
      const target = isReady ? 1 : Math.min(0.88, elapsed / 3200);
      p += (target - p) * (isReady ? 0.2 : 0.08);
      setProgress(p);
      setLine(Math.min(Math.max(0, bootLines.length - 1), Math.floor(elapsed / 520)));
      if (isReady && elapsed > MIN_BOOT_MS) {
        window.clearInterval(id);
        // Fill the bar before handing off, instead of cutting away mid-way.
        setProgress(1);
        handoff = window.setTimeout(() => {
          let returning = false;
          try {
            returning = window.sessionStorage.getItem("lobby:started") === "1";
          } catch {
            /* fine */
          }
          lobby.set({ phase: returning ? "lobby" : "title" });
        }, 240);
      }
    }, 50);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(slowId);
      window.clearTimeout(handoff);
    };
  }, [phase]);

  if (phase !== "boot") return null;
  const pct = Math.round(progress * 100);
  return (
    <div className="boot" aria-busy={!ready}>
      <div className="boot-center">
        <Emblem className="boot-emblem" />
        <p className="boot-name">{resume.name}</p>
        <div
          className="boot-bar"
          role="progressbar"
          aria-label="Loading the 3D lobby"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <p className="boot-line" aria-hidden>
          <span>{ready ? "Ready" : (bootLines[line] ?? "Loading")}</span>
          <b>{pct}%</b>
        </p>
        <p className="sr-only" role="status">
          {ready ? "Lobby ready" : "Loading the 3D lobby"}
        </p>
        {slow && !ready && (
          <p className="boot-slow">
            Taking a while? <Link href="/classic">Open the classic page</Link>
          </p>
        )}
      </div>
      {tips[tip] && (
        <p className="boot-tip">
          <span>Tip</span>
          {tips[tip]}
        </p>
      )}
    </div>
  );
}

export function TitleScreen() {
  const phase = useLobby((s) => s.phase);
  const sound = useLobby((s) => s.sound);
  const touch = useLobby((s) => s.touch);

  useEffect(() => {
    if (phase !== "title") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.repeat) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Autofill can dispatch keydown without a key; F-keys keep reload, devtools, etc.
      if (typeof e.key !== "string" || PASSIVE_KEYS.has(e.key) || /^F\d{1,2}$/.test(e.key)) return;
      const t = e.target instanceof Element ? e.target : null;
      // Links (the skip link, Classic view) and title controls act on their own.
      if (t?.closest("a, input, select, textarea, [data-title-control]")) return;
      // A focused button already clicks on Enter / Space.
      if (t?.closest("button") && (e.key === "Enter" || e.key === " ")) return;
      e.preventDefault();
      start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  if (phase !== "title") return null;
  return (
    <div className="title" onClick={() => start()}>
      {/* Keeps the title grid's first row; the location line that lived here was removed. */}
      <div className="title-top" aria-hidden />
      <div className="title-main">
        <p className="title-kicker">Portfolio</p>
        <h1 className="title-name">{resume.name}</h1>
        <p className="title-role">
          {resume.headline} · {resume.location}
        </p>
        <button
          type="button"
          className="title-start"
          onClick={(e) => {
            e.stopPropagation();
            start();
          }}
        >
          {touch ? "Tap to start" : "Press any key to start"}
        </button>
      </div>
      <div className="title-foot" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          data-title-control
          className="title-chip"
          aria-pressed={sound}
          onClick={() => setSound(!sound)}
        >
          {sound ? <IconSound /> : <IconMute />}
          Sound {sound ? "on" : "off"}
        </button>
        <Link data-title-control className="title-chip" href="/classic">
          Classic view
        </Link>
        <span className="title-legal">Built with three.js · every sound is synthesized live</span>
      </div>
    </div>
  );
}

export function IntroOverlay() {
  const phase = useLobby((s) => s.phase);
  useEffect(() => {
    if (phase !== "intro") return;
    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.metaKey || e.ctrlKey || e.altKey || PASSIVE_KEYS.has(e.key))) return;
      skipIntro();
    };
    const id = window.setTimeout(() => {
      window.addEventListener("keydown", skip);
      window.addEventListener("pointerdown", skip);
    }, 400);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [phase]);

  if (phase !== "intro") return null;
  return (
    <div className="intro" aria-hidden>
      <div className="intro-bar top" />
      <div className="intro-bar bottom" />
      <div className="intro-caption">
        <p>{resume.name}</p>
        <p>{resume.headline}</p>
      </div>
      <p className="intro-skip">Press any key to skip</p>
    </div>
  );
}
