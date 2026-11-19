import { useSyncExternalStore } from "react";

// Real loading state for the boot checklist. Each task is reported by the code
// that does the work (the scene chunk, the model loader, the texture manager,
// the font set); nothing here runs on a timer or invents a step.

export type BootTask = "scene" | "character" | "textures" | "fonts";
/** `bytes` is set when a download reports bytes but no total (compressed responses). */
export type TaskState = { progress: number; failed: boolean; bytes?: number };
export type BootSnapshot = Record<BootTask, TaskState>;

const idle: TaskState = { progress: 0, failed: false };
let snapshot: BootSnapshot = { scene: idle, character: idle, textures: idle, fonts: idle };
const listeners = new Set<() => void>();

function emit(next: BootSnapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

/** Record progress (0 to 1) for a task. Progress never moves backwards. */
export function reportBoot(task: BootTask, progress: number) {
  const current = snapshot[task];
  const p = Math.max(current.progress, Math.min(1, Math.max(0, progress)));
  if (p === current.progress) return;
  emit({ ...snapshot, [task]: { ...current, progress: p } });
}

/** Bytes received for a download whose total size the server did not send. */
export function reportBytes(task: BootTask, bytes: number) {
  const current = snapshot[task];
  if (current.progress >= 1 || bytes <= (current.bytes ?? 0)) return;
  emit({ ...snapshot, [task]: { ...current, bytes } });
}

/** A task that cannot finish (no WebGL, a missing file). The lobby goes on without it. */
export function failBoot(task: BootTask) {
  const current = snapshot[task];
  if (current.failed || current.progress >= 1) return;
  emit({ ...snapshot, [task]: { ...current, failed: true } });
}

export const isSettled = (t: TaskState) => t.failed || t.progress >= 1;
export const getBoot = () => snapshot;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useBoot(): BootSnapshot {
  return useSyncExternalStore(subscribe, getBoot, getBoot);
}
