"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { screens, type ScreenId } from "@/content/lobby";
import { audio } from "./audio";
import { back, cycle, deploy, emote, go, setSound } from "./actions";
import { BootScreen, IntroOverlay, TitleScreen } from "./hud/boot";
import Hud from "./hud/hud";
import { lobby, pointer, readPref, useLobby } from "./store";
import "./lobby.css";

const Scene = dynamic(() => import("./scene/scene"), { ssr: false });

function hashScreen(): ScreenId | null {
  const h = window.location.hash.replace("#", "");
  return screens.some((s) => s.id === h) ? (h as ScreenId) : null;
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
    lobby.set({
      reducedMotion: mq.matches,
      touch,
      quality: q === "high" || q === "low" ? q : touch || cores <= 4 ? "low" : "high",
      sound: readPref("sound") !== "0",
      music: readPref("music") !== "0",
    });

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
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    document.documentElement.classList.add("lobby-lock");
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
      document.documentElement.classList.remove("lobby-lock");
    };
  }, []);

  // Deep links: /#missions opens Missions once the lobby is live.
  useEffect(() => {
    if (phase !== "lobby") return;
    const target = hashScreen();
    if (target && target !== lobby.get().screen) {
      lobby.set({ screen: target, focus: null });
      go(target);
    }
  }, [phase]);

  // Controller-style keyboard.
  useEffect(() => {
    if (phase !== "lobby") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target instanceof HTMLElement ? e.target : null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const s = lobby.get();
      const k = e.key.toLowerCase();
      if (k === "escape") {
        back();
      } else if (k === "q") {
        cycle(-1);
      } else if (k === "e") {
        cycle(1);
      } else if (k === "g") {
        emote();
      } else if (k === "m") {
        setSound(!s.sound);
      } else if (/^[1-6]$/.test(k)) {
        go(screens[Number(k) - 1].id);
      } else if (k === "enter" && s.screen === "lobby" && (t === document.body || !t)) {
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
    <div className={`lobby phase-${phase} ${reduced ? "is-reduced" : ""}`}>
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
