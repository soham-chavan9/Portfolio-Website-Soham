import { screens, type ScreenId } from "@/content/lobby";
import { featuredWork } from "@/content/portfolio";
import { audio } from "./audio";
import { lobby, writePref } from "./store";

// Everything the HUD, the keyboard and the 3D markers can ask the lobby to do.

const DEFAULT_FOCUS: Partial<Record<ScreenId, string>> = {
  missions: featuredWork.systems[0].id,
  arsenal: "p0",
};

function syncHash(screen: ScreenId) {
  try {
    const url = screen === "lobby" ? window.location.pathname : `#${screen}`;
    window.history.replaceState(null, "", url);
  } catch {
    /* sandboxed iframes can refuse history access */
  }
}

export function go(screen: ScreenId) {
  const s = lobby.get();
  if (s.screen === screen && !s.comms) return;
  if (screen === "lobby") audio.back();
  else audio.swoosh();
  lobby.set({
    screen,
    focus: DEFAULT_FOCUS[screen] ?? null,
    comms: false,
    settings: false,
  });
  syncHash(screen);
}

export function cycle(dir: 1 | -1) {
  const i = screens.findIndex((x) => x.id === lobby.get().screen);
  const next = screens[(i + dir + screens.length) % screens.length];
  go(next.id);
}

export function back() {
  const s = lobby.get();
  if (s.settings) {
    audio.back();
    lobby.set({ settings: false });
    return;
  }
  if (s.comms) {
    audio.back();
    lobby.set({ comms: false });
    return;
  }
  if (s.screen !== "lobby") go("lobby");
}

export function deploy() {
  audio.deploy();
  lobby.set({ screen: "missions", focus: DEFAULT_FOCUS.missions ?? null, comms: false, settings: false });
  syncHash("missions");
}

export function openComms() {
  audio.click();
  lobby.set({ comms: true, settings: false });
}

export function emote() {
  audio.chime();
  lobby.set((s) => ({ emote: s.emote + 1 }));
}

export function start() {
  const s = lobby.get();
  if (s.phase !== "title") return;
  audio.setSound(s.sound);
  audio.setMusic(s.music);
  audio.start();
  audio.boot();
  try {
    window.sessionStorage.setItem("lobby:started", "1");
  } catch {
    /* fine */
  }
  lobby.set({ phase: "intro" });
}

export function skipIntro() {
  if (lobby.get().phase === "intro") lobby.set({ phase: "lobby" });
}

export function setSound(on: boolean) {
  audio.setSound(on);
  if (on) audio.start();
  writePref("sound", on ? "1" : "0");
  lobby.set({ sound: on });
}

export function setMusic(on: boolean) {
  audio.setMusic(on);
  writePref("music", on ? "1" : "0");
  lobby.set({ music: on });
}

export function setQuality(q: "high" | "low") {
  writePref("quality", q);
  lobby.set({ quality: q });
}

let toastTimer: number | undefined;
export function toast(text: string) {
  window.clearTimeout(toastTimer);
  lobby.set((s) => ({ toast: text, toastId: s.toastId + 1 }));
  toastTimer = window.setTimeout(() => lobby.set({ toast: null }), 2400);
}

export async function copyEmail(email: string) {
  try {
    await navigator.clipboard.writeText(email);
    audio.chime();
    toast("Email copied to clipboard");
  } catch {
    toast(email);
  }
}

/** Before following a link out of the lobby, remember where we were. */
export function rememberScreen() {
  syncHash(lobby.get().screen);
}
