import { useSyncExternalStore } from "react";
import type { ScreenId } from "@/content/scene";

export type Phase = "boot" | "title" | "intro" | "lobby";
export type Quality = "high" | "low";

export type LobbyState = {
  phase: Phase;
  screen: ScreenId;
  /** Selected marker (experience / project / education pin) the camera aims at. */
  focus: string | null;
  /** Experience bullet a Home readout was opened from; the panel marks it. */
  proof: string | null;
  /** Skill picked on the skills globe or in the Skills panel (turned to the front). */
  skill: string | null;
  /** Skill under the pointer, on the globe or in the panel; both highlight it. */
  skillHover: string | null;
  hovered: string | null;
  quality: Quality;
  sound: boolean;
  music: boolean;
  reducedMotion: boolean;
  settings: boolean;
  sceneReady: boolean;
  /** Bumped to trigger the operator emote. */
  emote: number;
  /** Width in px of whatever panel covers the right side (camera re-centers). */
  panelInset: number;
  /** Height in px of a bottom sheet on narrow screens. */
  sheetInset: number;
  touch: boolean;
  /** Last toast message. Kept after it hides so the fade-out isn't empty. */
  toast: string | null;
  toastOpen: boolean;
  toastId: number;
};

const initial: LobbyState = {
  phase: "boot",
  screen: "home",
  focus: null,
  proof: null,
  skill: null,
  skillHover: null,
  hovered: null,
  quality: "high",
  sound: false,
  music: false,
  reducedMotion: false,
  settings: false,
  sceneReady: false,
  emote: 0,
  panelInset: 0,
  sheetInset: 0,
  touch: false,
  toast: null,
  toastOpen: false,
  toastId: 0,
};

let state = initial;
const listeners = new Set<() => void>();

export const lobby = {
  get: () => state,
  set(patch: Partial<LobbyState> | ((s: LobbyState) => Partial<LobbyState>)) {
    const next = typeof patch === "function" ? patch(state) : patch;
    let changed = false;
    for (const key in next) {
      if (next[key as keyof LobbyState] !== state[key as keyof LobbyState]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Select a primitive slice of lobby state. Do not return new objects. */
export function useLobby<T>(selector: (s: LobbyState) => T): T {
  return useSyncExternalStore(
    lobby.subscribe,
    () => selector(state),
    () => selector(initial),
  );
}

/** Window-level pointer in -1..1, updated by the lobby (HUD sits over the canvas). */
export const pointer = { x: 0, y: 0 };

/**
 * Set while a pointer drag belongs to the skills globe. The camera rig's
 * listener sits on the canvas and sees the press first, so it checks this on
 * the next move and lets the globe have the drag.
 */
export const grab = { globe: false };

/** Where the skills globe's label goes, in CSS px; written by the 3D scene each frame. */
export const globeTag = { x: 0, y: 0, on: false, name: "", group: "" };

export function readPref(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`lobby:${key}`);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string) {
  try {
    window.localStorage.setItem(`lobby:${key}`, value);
  } catch {
    /* private mode: preference just won't persist */
  }
}
