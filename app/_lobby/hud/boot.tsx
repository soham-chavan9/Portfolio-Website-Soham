"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bootLines, tips, viewpoint } from "@/content/lobby";
import { site } from "@/content/site";
import { setSound, skipIntro, start } from "../actions";
import { lobby, useLobby } from "../store";
import { Emblem, IconMute, IconSound } from "./icons";

const MIN_BOOT_MS = 1900;

export function useNycClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

export function BootScreen() {
  const phase = useLobby((s) => s.phase);
  const ready = useLobby((s) => s.sceneReady);
  const [progress, setProgress] = useState(0);
  const [line, setLine] = useState(0);
  const [tip, setTip] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    setTip(Math.floor(Math.random() * tips.length));
  }, []);

  useEffect(() => {
    if (phase !== "boot") return;
    startedAt.current = performance.now();
    const id = window.setInterval(() => {
      const elapsed = performance.now() - startedAt.current;
      const isReady = lobby.get().sceneReady;
      setProgress((p) => {
        const target = isReady ? 1 : Math.min(0.88, elapsed / 3200);
        return p + (target - p) * (isReady ? 0.2 : 0.08);
      });
      setLine(Math.min(bootLines.length - 1, Math.floor(elapsed / 520)));
      if (isReady && elapsed > MIN_BOOT_MS) {
        window.clearInterval(id);
        let returning = false;
        try {
          returning = window.sessionStorage.getItem("lobby:started") === "1";
        } catch {
          /* fine */
        }
        lobby.set({ phase: returning ? "lobby" : "title" });
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [phase]);

  if (phase !== "boot") return null;
  const pct = Math.round(progress * 100);
  return (
    <div className="boot" role="status" aria-live="polite">
      <div className="boot-center">
        <Emblem className="boot-emblem" />
        <p className="boot-name">{site.name}</p>
        <div className="boot-bar" aria-hidden>
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <p className="boot-line">
          <span>{ready ? "Ready" : bootLines[line]}</span>
          <b>{pct}%</b>
        </p>
      </div>
      <p className="boot-tip">
        <span>Tip</span>
        {tips[tip]}
      </p>
    </div>
  );
}

export function TitleScreen() {
  const phase = useLobby((s) => s.phase);
  const sound = useLobby((s) => s.sound);
  const touch = useLobby((s) => s.touch);
  const time = useNycClock();

  useEffect(() => {
    if (phase !== "title") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Tab") return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("[data-title-control]")) return;
      e.preventDefault();
      start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  if (phase !== "title") return null;
  return (
    <div className="title" onClick={() => start()}>
      <div className="title-top">
        <span className="title-tag">
          <i aria-hidden /> Live · {viewpoint.name}
        </span>
        <span className="title-time">{time ? `${time} ET` : ""}</span>
      </div>
      <div className="title-main">
        <p className="title-kicker">Portfolio · Season 03</p>
        <h1 className="title-name">{site.name}</h1>
        <p className="title-role">{site.headline}</p>
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
  const time = useNycClock();
  useEffect(() => {
    if (phase !== "intro") return;
    const skip = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.metaKey || e.ctrlKey)) return;
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
        <p>{viewpoint.name}</p>
        <p>{time} ET · 140 m above the Hudson</p>
      </div>
      <p className="intro-skip">Press any key to skip</p>
    </div>
  );
}
