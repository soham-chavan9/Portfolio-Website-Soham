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

export type MarkerMeta = {
  id: string;
  screen: ScreenId;
  code: string;
  title: string;
  sub: string;
  landmark: string | null;
  bearing?: number;
};

const subFor = (landmark: string) => `${landmarks[landmark].name} · ${rangeLabel(landmark)}`;

export const markerMeta: MarkerMeta[] = [
  ...featuredWork.systems.map((s, i) => ({
    id: s.id,
    screen: "missions" as const,
    code: `M-0${i + 1}`,
    title: s.label,
    sub: subFor(missionTargets[s.id]),
    landmark: missionTargets[s.id],
  })),
  ...projectTargets.map((landmark, i) => ({
    id: `p${i}`,
    screen: "arsenal" as const,
    code: `A-0${i + 1}`,
    title: projects[i].title.split(",")[0],
    sub: subFor(landmark),
    landmark,
  })),
  ...careerPins.map((pin, i) => ({
    id: pin.id,
    screen: "career" as const,
    code: `C-0${i + 1}`,
    title: pin.org,
    sub: pin.landmark ? subFor(pin.landmark) : pin.note,
    landmark: pin.landmark,
    bearing: pin.bearing,
  })),
];

/** Screen-space label anchors, in CSS px, written by the 3D scene each frame. */
export const markerScreen: Record<string, { x: number; y: number; on: boolean }> = {};
