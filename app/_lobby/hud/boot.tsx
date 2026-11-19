"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { resume } from "@/content/resume";
import { setSound, skipIntro, start } from "../actions";
import { getBoot, isSettled, reportBoot, useBoot, type BootTask, type TaskState } from "../boot-progress";
import { lobby, useLobby } from "../store";
import { IconMute, IconSound } from "./icons";

/** Shortest the checklist stays up, so a cached load doesn't flash. */
const MIN_BOOT_MS = 800;
/** After this long without a finished load, offer the plain page. */
const SLOW_BOOT_MS = 9000;
/** The scene is up but an asset is still out: enter anyway; it appears when it lands. */
const GIVE_UP_MS = 15000;

const CHECKS: { id: BootTask; label: string }[] = [
  { id: "scene", label: "Scene" },
  { id: "character", label: "Character" },
  { id: "textures", label: "Textures" },
  { id: "fonts", label: "Fonts" },
];

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

function readout(t: TaskState, state: "off" | "done" | "loading") {
  if (state === "off") return "Off";
  if (state === "loading" && t.progress === 0 && t.bytes) return `${(t.bytes / 1e6).toFixed(1)} MB`;
  return `${Math.round(t.progress * 100)}%`;
}

export function BootScreen() {
  const phase = useLobby((s) => s.phase);
  const boot = useBoot();
  const [slow, setSlow] = useState(false);

  // Fonts: the browser's own font set says when every face in use has loaded.
  useEffect(() => {
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts) {
      reportBoot("fonts", 1);
      return;
    }
    fonts.ready.then(
      () => reportBoot("fonts", 1),
      () => reportBoot("fonts", 1),
    );
  }, []);

  useEffect(() => {
    if (phase !== "boot") return;
    const startedAt = performance.now();
    let handoff = 0;
    const slowId = window.setTimeout(() => setSlow(true), SLOW_BOOT_MS);
    const id = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const s = getBoot();
      const done = CHECKS.every((c) => isSettled(s[c.id]));
      const stuck = lobby.get().sceneReady && elapsed > GIVE_UP_MS;
      if (!(done && elapsed >= MIN_BOOT_MS) && !stuck) return;
      window.clearInterval(id);
      // A beat on the finished list before cutting away.
      handoff = window.setTimeout(() => {
        let returning = false;
        try {
          returning = window.sessionStorage.getItem("lobby:started") === "1";
        } catch {
          /* fine */
        }
        lobby.set({ phase: returning ? "lobby" : "title" });
      }, 240);
    }, 100);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(slowId);
      window.clearTimeout(handoff);
    };
  }, [phase]);

  if (phase !== "boot") return null;
  const done = CHECKS.every((c) => isSettled(boot[c.id]));
  const overall = CHECKS.reduce((sum, c) => sum + (boot[c.id].failed ? 1 : boot[c.id].progress), 0) / CHECKS.length;
  const pct = Math.round(overall * 100);
  return (
    <div className="boot" aria-busy={!done}>
      <div className="boot-center">
        <p className="boot-name">{resume.name}</p>
        <ul className="boot-checks" aria-label="Loading checklist">
          {CHECKS.map((c) => {
            const t = boot[c.id];
            const state = t.failed ? "off" : t.progress >= 1 ? "done" : "loading";
            return (
              <li key={c.id} className={`boot-check is-${state}`}>
                <i className="boot-light" aria-hidden />
                <span className="boot-label">{c.label}</span>
                <b className="boot-pct">{readout(t, state)}</b>
              </li>
            );
          })}
        </ul>
        <div
          className="boot-bar"
          role="progressbar"
          aria-label="Loading the 3D lobby"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <span style={{ transform: `scaleX(${overall})` }} />
        </div>
        <p className="sr-only" role="status">
          {done ? "Lobby ready" : "Loading the 3D lobby"}
        </p>
        {slow && !done && (
          <p className="boot-slow">
            Taking a while? <Link href="/classic">Open the classic view</Link>
          </p>
        )}
      </div>
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
      <div className="title-main">
        <h1 className="title-name">{resume.name}</h1>
        <p className="title-role">
          {resume.headline}
          <span aria-hidden> · </span>
          <span className="sr-only">, </span>
          {resume.location}
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
    }, 300);
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
