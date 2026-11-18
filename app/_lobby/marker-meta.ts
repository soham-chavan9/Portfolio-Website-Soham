import {
  careerPins,
  landmarks,
  missionTargets,
  projectTargets,
  rangeLabel,
  type ScreenId,
} from "@/content/lobby";
import { featuredWork, projects } from "@/content/portfolio";

// What each in-world marker says. Positions live in scene/targets.ts; the
// projected screen positions are written into `markerScreen` every frame.
// Content can grow or lose entries independently of the target maps, so
// anything without a known landmark simply gets no marker instead of crashing.

export type MarkerMeta = {
  id: string;
  screen: ScreenId;
  code: string;
  title: string;
  sub: string;
  landmark: string | null;
  bearing?: number;
};

/** True when `id` names a landmark the scene knows how to place. */
export function isLandmark(id: string | null | undefined): id is string {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(landmarks, id);
}

/** "One World Trade Center · 2.41 km · 118° SE" */
export const pinLabel = (landmark: string) => `${landmarks[landmark].name} · ${rangeLabel(landmark)}`;

/** Stable two-digit codes that keep working past nine entries: M-01 … M-12. */
export const markerCode = (prefix: string, index: number) => `${prefix}-${String(index + 1).padStart(2, "0")}`;

export const markerMeta: MarkerMeta[] = [
  ...featuredWork.systems.flatMap((s, i): MarkerMeta[] => {
    const landmark = missionTargets[s.id];
    if (!isLandmark(landmark)) return [];
    return [
      {
        id: s.id,
        screen: "missions",
        code: markerCode("M", i),
        title: s.label,
        sub: pinLabel(landmark),
        landmark,
      },
    ];
  }),
  ...projects.flatMap((p, i): MarkerMeta[] => {
    const landmark = projectTargets[i];
    if (!isLandmark(landmark)) return [];
    return [
      {
        id: `p${i}`,
        screen: "arsenal",
        code: markerCode("A", i),
        title: p.title.split(",")[0],
        sub: pinLabel(landmark),
        landmark,
      },
    ];
  }),
  ...careerPins.map((pin, i): MarkerMeta => {
    const landmark = isLandmark(pin.landmark) ? pin.landmark : null;
    return {
      id: pin.id,
      screen: "career",
      code: markerCode("C", i),
      title: pin.org,
      sub: landmark ? pinLabel(landmark) : pin.note,
      landmark,
      bearing: pin.bearing,
    };
  }),
];

/** Landmark the scope reads out for a screen's focus, or null if it has none. */
export function focusLandmark(screen: ScreenId, focus: string | null): string | null {
  const m = focus
    ? markerMeta.find((x) => x.id === focus && x.screen === screen)
    : markerMeta.find((x) => x.screen === screen);
  return m?.landmark ?? null;
}

/** Screen-space label anchors, in CSS px, written by the 3D scene each frame. */
export const markerScreen: Record<string, { x: number; y: number; on: boolean }> = {};
