import { experiencePins, projectPins, screens, type ScreenId } from "@/content/scene";
import { audio } from "./audio";
import { lobby, writePref } from "./store";

// Everything the HUD, the keyboard and the 3D markers can ask the lobby to do.

const DEFAULT_FOCUS: Partial<Record<ScreenId, string>> = {
  experience: Object.keys(experiencePins)[0],
  projects: Object.keys(projectPins)[0],
};

function syncHash(screen: ScreenId) {
  try {
    const url = screen === "home" ? window.location.pathname : `#${screen}`;
    window.history.replaceState(null, "", url);
  } catch {
    /* sandboxed iframes can refuse history access */
  }
}

export function go(screen: ScreenId) {
  const s = lobby.get();
  if (s.screen === screen) {
    if (s.settings) lobby.set({ settings: false });
    return;
  }
  if (screen === "home") audio.back();
  else audio.swoosh();
  lobby.set({
    screen,
    focus: DEFAULT_FOCUS[screen] ?? null,
    settings: false,
  });
  syncHash(screen);
}

export function cycle(dir: 1 | -1) {
  if (screens.length === 0) return;
  const i = screens.findIndex((x) => x.id === lobby.get().screen);
  const next = screens[(Math.max(0, i) + dir + screens.length) % screens.length];
  go(next.id);
}

export function back() {
  const s = lobby.get();
  if (s.settings) {
    audio.back();
    lobby.set({ settings: false });
    return;
  }
  if (s.screen !== "home") go("home");
}

/** The Home screen's primary action: open Experience. */
export function deploy() {
  audio.deploy();
  lobby.set({ screen: "experience", focus: DEFAULT_FOCUS.experience ?? null, settings: false });
  syncHash("experience");
}

export function openContact() {
  go("contact");
}

export function toggleSettings(open = !lobby.get().settings) {
  audio.click();
  lobby.set({ settings: open });
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

/** Explicit choice from Settings; overrides the OS reduced-motion setting. */
export function setReducedMotion(on: boolean) {
  writePref("motion", on ? "reduced" : "full");
  lobby.set({ reducedMotion: on });
}

let toastTimer: number | undefined;
export function toast(text: string) {
  window.clearTimeout(toastTimer);
  lobby.set((s) => ({ toast: text, toastOpen: true, toastId: s.toastId + 1 }));
  toastTimer = window.setTimeout(() => lobby.set({ toastOpen: false }), 2400);
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
