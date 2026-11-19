---
version: 1
slug: "app-lobby"
primary_target: "app/_lobby"
related_targets: ["app/page.tsx"]
---

# Lobby (`app/_lobby`)

- Scope: the 3D lobby at `/`: boot, title, intro, the Home HUD, and the section panels. Mode: Experience.
- Audience: recruiters and engineers, equally. Job: who, what, proof and contact within ten seconds; depth one step away.
- Proof: `content/resume.ts` only. Constraints: no phone number, no resume PDF, plain tab labels, sound opt-in, WCAG 2.2 AA.
- Memorable moment: a Home number opens the resume line it came from, and the camera flies to the tower that line is pinned on.
- Unresolved: panel interiors (Days 3–4); phone sheet behaviour and performance budget (Day 5).

## Direction contract

THESIS: The lobby is a launch console, not a landing page. Home refuses the hero-plus-stat-cards arrangement: identity, tabs and four proof readouts share one instrument bar along the top, so the skyline and the character stay clear.

OWN-WORLD: Night ink (#07090e, #0e121b) under one translucent console bar ruled with 1px hairlines; readouts in Geist Mono tabular cyan (#7fd1ff); a single amber (#f2a541) for the active tab and the primary action; green (#5fd39a) only on a finished boot check; Saira Condensed for display names; corner brackets on the bar only.

STORY: The visitor learns who Soham is and sees his strongest numbers without a click, then opens Experience, or any number, to read the exact resume line behind it.

FIRST VIEWPORT: Top, full width: a two-tier console bar. Tier one: avatar, name, headline and location; plain tabs; sound, settings, fullscreen, Classic view. Tier two: degree and school, then four readouts. Center-left: the character. Bottom-right: OurFreedom.ai at display size, role, dates, first bullet, amber "View experience" (primary), Projects, Contact. Bottom-left: key hints, GitHub, LinkedIn, Contact.

FORM: Telemetry Bar, position 6 of 7 on the ordered list (seed:2ffd6b3f4b7e7b5e). Signature interaction: each readout is a button that opens Experience on its source bullet while the camera flies to that bullet's tower. Motion: tier two retracts when a section opens and returns on Home; exponential ease-out, 240–480 ms; reduced motion cuts.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
