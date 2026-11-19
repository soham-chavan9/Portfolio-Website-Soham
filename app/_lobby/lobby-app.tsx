"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { screens, type ScreenId } from "@/content/scene";
import { audio } from "./audio";
import { back, cycle, deploy, emote, go, setSound } from "./actions";
import { reportBoot } from "./boot-progress";
import { BootScreen, IntroOverlay, TitleScreen } from "./hud/boot";
import Hud from "./hud/hud";
import { lobby, pointer, readPref, useLobby } from "./store";
import "./lobby.css";

// The boot checklist counts the 3D code arriving as half of "Scene"; the
// other half is the first frames on screen (scene.tsx, ReadyProbe).
const Scene = dynamic(
  () =>
    import("./scene/scene").then((m) => {
      reportBoot("scene", 0.5);
      return m;
    }),
  { ssr: false },
);

function hashScreen(): ScreenId | null {
  const h = window.location.hash.replace("#", "");
  return screens.find((s) => s.id === h)?.id ?? null;
}

function isTyping(t: HTMLElement | null) {
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}

export default function LobbyApp() {
  const phase = useLobby((s) => s.phase);
  const reduced = useLobby((s) => s.reducedMotion);

  // Preferences, device hints, pointer tracking, page lock.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const cores = navigator.hardwareConcurrency ?? 8;
    const q = readPref("quality");
    // An explicit choice in Settings wins; otherwise follow the OS, live.
    const motion = () => {
      const pref = readPref("motion");
      return pref === "reduced" ? true : pref === "full" ? false : mq.matches;
    };
    lobby.set({
      reducedMotion: motion(),
      touch,
      quality: q === "high" || q === "low" ? q : touch || cores <= 4 ? "low" : "high",
      // Sound is opt-in: people often open portfolios at work.
      sound: readPref("sound") === "1",
      music: readPref("music") === "1",
    });
    const onMotion = () => lobby.set({ reducedMotion: motion() });

    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    // Returning visitors skip the title; audio still needs one gesture.
    const wake = () => {
      const s = lobby.get();
      if (s.phase === "lobby") {
        audio.setSound(s.sound);
        audio.setMusic(s.music);
        audio.start();
      }
    };
    mq.addEventListener("change", onMotion);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    document.documentElement.classList.add("lobby-lock");
    return () => {
      mq.removeEventListener("change", onMotion);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      document.documentElement.classList.remove("lobby-lock");
      // Client-side navigation away (the Classic view) must not
      // leave the lobby music playing over the next page.
      audio.stop();
    };
  }, []);

  // Deep links: /#projects opens Projects once the lobby is live, and so
  // does editing the hash afterwards.
  useEffect(() => {
    if (phase !== "lobby") return;
    const open = () => {
      const target = hashScreen();
      if (target) go(target);
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [phase]);

  // Controller-style keyboard. Never while typing, never with a modifier
  // (browser and OS shortcuts keep working), never on key repeat.
  useEffect(() => {
    if (phase !== "lobby") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      // Autofill can dispatch keydown events without a key.
      if (typeof e.key !== "string") return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (isTyping(t)) return;
      const s = lobby.get();
      const k = e.key.toLowerCase();
      if (k === "escape") {
        if (s.settings || s.screen !== "home") {
          back();
          e.preventDefault();
        }
        return;
      }
      if (e.repeat) return;
      if (k === "q") {
        cycle(-1);
      } else if (k === "e") {
        cycle(1);
      } else if (k === "g") {
        emote();
      } else if (k === "m") {
        setSound(!s.sound);
      } else if (/^[1-9]$/.test(k) && Number(k) <= screens.length) {
        go(screens[Number(k) - 1].id);
      } else if (k === "c") {
        go("contact");
      } else if (k === "enter" && s.screen === "home" && !s.settings && (!t || t === document.body)) {
        deploy();
      } else {
        return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  return (
    <div className={`lobby phase-${phase}${reduced ? " is-reduced" : ""}`}>
      <a className="skip-link" href="/classic">
        Skip the 3D lobby: open the classic page
      </a>
      <div className="lobby-canvas">
        <Scene />
      </div>
      <div className="lobby-shade" aria-hidden />
      <Hud />
      <IntroOverlay />
      <TitleScreen />
      <BootScreen />
    </div>
  );
}
