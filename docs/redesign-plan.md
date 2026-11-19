# Portfolio redesign: 5-day plan

Status: v2, decisions locked (2026-11-19). Day 1 done; Day 2 is next. Carried to Day 2:
remove dead lobby CSS for the deleted widgets (squad, ticker, locline, tab-plain, clan, xp).
Owner: Soham Chavan. Build: Claude Code.
Source of truth: `~/Desktop/Resume/Soham-Chavan-SDE-Resume` (the four variants contain the
same facts and differ only in ordering; the SDE variant sets the order).

### Decisions

| Topic | Decision |
| --- | --- |
| Theme | "Launch Deck": the Skyline Premiere scene (A) with Launch Control's visual language (B). See section 3 |
| Launch elements | Pre-flight boot only. No ops console, no tower beacons, no launch intro |
| Headline and order | SDE resume: "Software Engineer"; skills and bullets in SDE order |
| Non-resume extras | All removed: open-to-work status, OurFreedom.ai mission line, case-study pages, testimonial |
| Tab labels | Plain: Home, Experience, Projects, Skills, Education, Contact |
| Scene location | NYC skyline kept; Jersey City name, coordinates, and clock line removed; identity card says Boston, MA |
| Pending face texture | Committed separately as `856d653` |

---

## 1. North star

A portfolio that a recruiter understands in 10 seconds and an engineer wants to explore for
5 minutes. The game layer has to make the resume more memorable, never harder to read.

Three rules carry every decision below:

1. **Every fact comes from the resume.** If a sentence makes a claim that is not on the
   resume, it does not ship. UI copy ("View experience", "Copy email") is allowed because it
   claims nothing.
2. **Theme lives in feel, not jargon.** The game quality comes from camera moves, sound,
   motion, controller navigation, and diegetic placement (work pinned to real towers). Labels
   stay plain English, so nobody has to translate "Arsenal" into "Projects".
3. **One accent, one system.** One accent color, one easing curve, one type family for UI,
   one for display. The current lobby mixes tactical HUD, CoD-style lobby, and editorial
   serif; that mix is most of why it reads as less professional.

### Success criteria

- A first-time visitor can name the current role, the top three numbers, and how to contact
  Soham within 10 seconds of the lobby appearing.
- Every string on the site traces to a resume line (checked line by line on Day 5).
- Lighthouse on `/classic`: Performance 95+, Accessibility 100, SEO 100.
- Lobby: first interactive frame under 4 s on a mid-range laptop, 60 fps on high tier,
  graceful fallback to `/classic` when WebGL is missing.
- Fully usable by keyboard only, with reduced motion, and on a 375 px phone.

---

## 2. Content contract

### 2.1 What the resume contains (and nothing else ships)

| Resume section | Items |
| --- | --- |
| Header | Soham Chavan; Boston, MA; email; LinkedIn; GitHub; phone (see Q8) |
| Education | Northeastern University, M.S. Information Systems, Sep 2024 to Dec 2026, 4 courses. University of Mumbai, B.Tech Electronics and Telecommunication Engineering, Jun 2020 to Jul 2023 |
| Technical skills | 6 groups: Languages, Frontend/Mobile, Backend/Data, AI/ML, Cloud/DevOps, Testing/Tools |
| Experience | OurFreedom.ai, Software Engineering Co-op, New York, NY, Jan 2026 to Jun 2026, 7 bullets. ACN Fiber Pvt Ltd, Software Developer, Mumbai, Jun 2023 to Jul 2024, 4 bullets |
| Projects | Lumina, HIPAA Privacy Desk, Sep 2025 to Dec 2025, 4 bullets, repo link. FundFlow, Personal Finance Tracker, Aug 2024 to Present, 5 bullets, repo link |

### 2.2 Cut ledger: on the site today, not on the resume

Q3 was answered "remove all", so every row below is deleted, including the ones marked
"unless kept in Q3".

| Item | Where it lives now | Action |
| --- | --- | --- |
| Ralph Lobo testimonial | `portfolio.ts` testimonials, lobby "Squad" widget, classic page | Delete |
| "Services" (3 cards) | `portfolio.ts` services, Loadout "Abilities", classic | Delete |
| About paragraphs (3) | `portfolio.ts` about, Intel panel, classic | Delete |
| "Now" items (graduating, looking for role, relocation) | `portfolio.ts` nowItems, Intel, Comms | Delete, unless kept in Q3 |
| Site status "Open to full-time roles from January 2027" | `site.ts`, ticker, Comms | Delete, unless kept in Q3 |
| Digi Cable internship (2019 to 2020) | `portfolio.ts` experience | Delete |
| TaskTreak project | `portfolio.ts`, `shipped.ts`, `public/tasktreak.png` | Delete |
| "1.5+ years shipping" stat | `site.ts` stats | Delete (derived, not stated) |
| OurFreedom.ai mission line ("families connected to incarcerated loved ones") | featured work, mode card | Delete, unless kept in Q3 |
| Case-study detail beyond the resume (300 ms debounce, UUID keys, SHA-256 cache, magic bytes, private S3 staging, 4 endpoints, runtime fingerprints, Play Core redirects, pull-to-refresh, and so on) | `portfolio.ts` systems, `writeups.ts`, `/work/[slug]` | Delete. Field-report pages removed, unless kept in Q3 |
| "Reply within a day", "open to relocation and remote" | Comms panel | Delete |
| Ticker lines that are not resume facts | `lobby.ts` ticker | Replace with resume numbers |
| "[NEU]" clan tag, rank chevrons, XP bar wording | player card | Replace with plain identity card |

### 2.3 Resume facts the site is missing today (add them)

- FundFlow: 5 compound MongoDB indexes; per-user rate limiting and prompt-injection fencing on
  the Gemini assistant; Playwright tests on forged cookies and signed-out API calls; CI on
  Node 22 and 26 against MongoDB in Docker.
- Lumina: Pydantic-validated LLM output with statutory fallbacks; "de-identified control set";
  deployed with Docker and Vercel.
- OurFreedom.ai: releases across dev, preview, TestFlight, and production builds.

### 2.4 Numbers bank (all verbatim from the resume)

| Number | Context |
| --- | --- |
| 1,000+ | downloads, OurFreedom.ai app |
| 110+ | commits shipped |
| ~40 / ~20 | backend modules / contributors |
| ~5% | time-in-app increase from the For You feed |
| 7 | interaction types tracked |
| ~48 h to ~2 h | small-fix delivery |
| 19 | Jest tests on version logic |
| 0 | App Store and Google Play rejections |
| 5 | upload surfaces under image moderation |
| 10,000+ | daily active users, ACN Fiber APIs |
| ~30 to 40 / month | duplicate-charge complaints ended |
| ~1,200 | South Mumbai buildings in the serviceability API |
| 20% | fewer failed install visits |
| 4 | Lumina compliance workflows |
| 18, 100% (54/54), 0 | Safe Harbor identifiers, PHI recall, false positives |
| 77, 82% | Lumina tests, coverage |
| 9 | FundFlow v1 frontend pages |
| 12 | FundFlow endpoints with auth gaps closed |
| 3 months, 3 languages | Gemini assistant scope |
| 121 | Vitest unit tests |

Home-screen highlight row (default pick): **1,000+ downloads · ~48 h to ~2 h fix delivery ·
0 store rejections · 10,000+ daily active users.**

---

## 3. Theme directions

All three are original concepts.

### Chosen: "Launch Deck" (A scene, B language)

The 3D penthouse, skyline, character, tower pins, and camera fly-to from A stay as they are.
From B comes the visual language of a launch-control room, applied to the 2D HUD only:

- Numbers render as telemetry readouts: mono, tabular, `--signal` cyan, with a small label
  above in caps.
- Small status lights (`--ok` green dot) mark shipped and current items; the identity card
  has one "current" light.
- Hairline grids, tick marks, and corner brackets on panels, used sparingly.
- The boot screen is a real pre-flight check (6.0).

Explicitly out of scope: a new 3D environment, the balcony ops console, tower beacons, and
a launch countdown intro. Words like "mission", "payload", or "launch" never appear in
labels or copy; the theme shows only in the styling.

The original options, for the record:

### A. "Skyline Premiere" (recommended)

Keep the 3D penthouse, the skyline, and the 3D character, and rebuild everything layered on
top of them as a premium, cinematic main menu.

- Why: the 3D scene, character, landmarks, and adaptive renderer are about 5,000 lines of
  working code. What reads as unprofessional is the HUD layer and the vocabulary, and that
  is exactly what this direction rewrites. Lowest risk inside 5 days.
- Feel: a modern open-world title's main menu at night. Quiet glass panels, warm sodium
  amber for the one accent, cool cyan used only for live data, big condensed display type,
  slow deliberate camera moves.
- Game layer: the skyline becomes a level-select map. Each OurFreedom.ai system is pinned to
  a downtown tower (OurFreedom.ai was in New York, per the resume), projects sit on midtown
  towers, and Boston and Mumbai are horizon markers. Selecting a card flies the camera to
  its tower.

### B. "Launch Control"

Reframe the site around shipping: a mission-control room where releases are launches.
Experience becomes a flight log, projects become payloads, skills become a systems check.
It tells the strongest resume story (zero store rejections, fixes in about 2 hours), but it
needs a new 3D environment. Realistic only if Day 1 to 3 go entirely to 3D, which squeezes
the content work.

### C. "Blueprint Studio"

A calm architect's studio. Light 3D: a drafting table where each system unfolds as an
isometric, animated diagram. The most "professional" of the three and the least "game".
Drops the penthouse and the city.

---

## 4. Design system (written for A; B and C reuse the tokens)

### 4.1 Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ink-0` | `#07090E` | page background behind the canvas |
| `--ink-1` | `#0E121B` | panel fill at 78% opacity, 24 px backdrop blur |
| `--line` | `rgba(238,241,246,0.10)` | 1 px hairlines and dividers |
| `--text-1` | `#EEF1F6` | primary text |
| `--text-2` | `#A3ACBB` | secondary text (contrast 7:1 on `--ink-1`) |
| `--accent` | `#F2A541` | the only accent: primary button, active tab, focus ring |
| `--signal` | `#7FD1FF` | live data only: numbers, pins, the "now" dot |
| `--ok` | `#5FD39A` | "shipped" and success states |

The light theme is for `/classic` only; the lobby is always night.

### 4.2 Type

- Display: Saira Condensed 700 (already loaded). Names, panel titles, big numbers.
- UI and body: Geist Sans 400/500/600 (replaces Chakra Petch, which reads sci-fi).
- Numbers and keys: Geist Mono or JetBrains Mono, tabular numerals.
- Scale: 12 / 14 / 16 / 20 / 28 / 44 / 72 / 112 px. Body never under 14 px in the lobby.

### 4.3 Layout

- 12-column grid, 24 px gutters, 32 px safe area (16 px on phones).
- Content panels dock right at 560 px wide (full-height sheet on phones).
- The identity card sits top-left, tabs top-center, primary action bottom-right. These
  positions never move between screens, so the eye learns them once.

### 4.4 Motion and sound

- Durations: 120 ms (hover), 240 ms (panel), 480 ms (screen), 900 ms (camera).
- One easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Panels slide 24 px and fade. Lists stagger 40 ms per item, capped at 8 items.
- Reduced motion: camera cuts instead of flights, no stagger, no parallax.
- Sound: off by default (people open portfolios at work). When on: a soft tick on focus,
  a muted confirm on select, an optional ambient city bed. No music by default.

### 4.5 Interaction grammar

- Q / E or arrow keys change tabs; 1 to 6 jump to a tab; Esc goes back; Enter selects.
- Hovering a card previews its tower pin; clicking flies the camera there.
- Every interactive element has a visible amber focus ring.
- The "Classic résumé view" link is visible on every screen, not buried in Settings.

---

## 5. Information architecture

Tabs mirror the resume, with plain labels.

| # | New tab | Replaces | Resume content |
| --- | --- | --- | --- |
| 1 | Home | Lobby | Header, highlight numbers, current/most recent role |
| 2 | Experience | Missions + Career | OurFreedom.ai (7 bullets as 6 system cards), ACN Fiber (4 bullets) |
| 3 | Projects | Arsenal | Lumina, FundFlow |
| 4 | Skills | Loadout | 6 skill groups |
| 5 | Education | part of Career + Intel | Northeastern, University of Mumbai, coursework |
| 6 | Contact | Comms + Intel | Email, LinkedIn, GitHub, location |

Removed: Intel (no resume data), the Squad widget, the "Deploy" verb, the field-report pages
(unless kept in Q3).

---

## 6. Section plans

Each section lists purpose, content, layout, interaction, motion and sound, mobile, and the
acceptance check.

### 6.0 Boot screen: pre-flight check

- Purpose: cover asset loading without wasting time, and set the launch-control tone.
- Content: name, then a checklist that ticks off as each real asset finishes: "Scene",
  "Character", "Textures", "Fonts", each with a status light (amber while loading, green
  when done) and a mono percentage. A single overall progress hairline under the list. No
  claims, no fake steps: every line maps to a real loader.
- Layout: centered, display name at 72 px, checklist in a 320 px column under it.
- Interaction: none. Minimum display time drops from 1.9 s to 0.8 s.
- Reduced motion: lines appear without the tick animation.
- Acceptance: never shows longer than loading takes plus 0.8 s; a slow load past 9 s offers
  "Open the classic view".

### 6.1 Title screen

- Purpose: the poster frame. First impression.
- Content: "SOHAM CHAVAN", the headline from Q2, "Boston, MA", "Press any key". Small links
  for the classic view and sound.
- Layout: the camera holds on a wide shot of the tower and skyline. Name at 112 px
  (44 px on phones), headline in Geist 20 px with tracking.
- Interaction: any key, click, or tap enters. Returning visitors skip it.
- Motion and sound: slow 12 s push-in loop on the camera; no sound until sound is enabled.
- Acceptance: name and headline are readable over the brightest skyline frame (scrim
  checked at 4.5:1).

### 6.2 Intro fly-in

- Purpose: a short cinematic moment that earns the game framing.
- Content: none beyond the scene.
- Interaction: skippable by any input; capped at 3.5 s; replaced by a cut under reduced
  motion.
- Acceptance: never blocks a deep link (`/#projects` lands directly on Projects).

### 6.3 Home

- Purpose: answer who, what, proof, and how to reach him without opening anything.
- Content (all resume):
  - Identity card: photo, "Soham Chavan", headline (Q2), "M.S. Information Systems,
    Northeastern University, Dec 2026", "Boston, MA".
  - Highlight row: the 4 numbers in section 2.4.
  - Featured card: "OurFreedom.ai, Software Engineering Co-op, Jan 2026 to Jun 2026" and
    the first resume bullet, with a primary button "View experience".
  - Secondary buttons: Projects, Contact, Classic résumé view.
- Layout: identity top-left, tabs top-center, highlights stacked on the left below the
  identity card, featured card bottom-right, character center-left.
- Removed: Squad/testimonial, ticker, the Newport/Jersey City coordinates and clock line,
  "[NEU]" tag, XP bar. The identity card shows the degree and its dates instead.
- Launch Deck styling: the highlight row renders as four telemetry readouts.
- Interaction: clicking the character plays the emote (kept; it claims nothing).
- Acceptance: the 10-second test in section 1 passes with 3 people who have not seen the
  site.

### 6.4 Experience

- Purpose: the core of the site. Shows depth without adding facts.
- Content: two roles in a vertical timeline, newest first.
  - **OurFreedom.ai**, Software Engineering Co-op, New York, NY, Jan 2026 to Jun 2026.
    Overview line from bullet 1 with the facts strip: 1,000+ downloads, ~40 modules,
    ~20 contributors, 110+ commits, three-week sprints. Then six system cards, one per
    remaining bullet:
    1. For You feed: Recombee, Zustand, cursor pagination, infinite scroll, optimistic
       updates; ~5% time in app; 7 interaction types.
    2. Two-track updates: Expo EAS OTA plus native version gating; ~48 h to ~2 h; 19 Jest
       tests.
    3. Store releases: dev, preview, TestFlight, production; zero rejections.
    4. Image moderation: 5 upload surfaces; Swift bridge to Apple's on-device analyzer;
       AWS Rekognition fallback; lower cloud costs.
    5. Direct messaging: group chats, typing indicators, blocking, search, reporting.
    6. Trust and safety: deny-by-default iOS/Android age gate; Apple Sign-In, Stripe, and
       AdMob/ATT hardening.
  - **ACN Fiber Pvt Ltd**, Software Developer, Mumbai, India, Jun 2023 to Jul 2024. Four
    cards: integration APIs (10,000+ DAU), idempotent payments (~30 to 40 complaints a
    month ended), serviceability API (~1,200 buildings, 20% fewer failed visits), error
    handling (Winston, Zod).
- Layout: right panel. Each card shows the headline number in display type, the resume
  sentence in body type, and stack chips taken only from words in that sentence.
- Interaction: each OurFreedom.ai card is pinned to a downtown tower. Hover lights the pin;
  select flies the camera to the tower and keeps the card expanded. ACN cards point at a
  horizon marker labelled "Mumbai, India".
- Motion and sound: number count-up on first reveal (skipped under reduced motion).
- Mobile: cards become an accordion; the camera move is replaced by a small tower thumbnail.
- Acceptance: all 11 experience bullets appear, every number matches section 2.4, and no
  card contains a word that is not in its bullet, the skills list, or the role header.

### 6.5 Projects

- Purpose: show independent, inspectable work.
- Content: Lumina and FundFlow only, in resume order. Title, subtitle, dates, the stack line
  verbatim, all bullets (4 and 5), and the GitHub link from the resume.
- Layout: two large cards, each with the product screenshot (`/lumina.png`,
  `/fundflow.png`), see Q10.
- Interaction: each project is pinned to a midtown tower; selecting flies there. "View code
  on GitHub" opens the repo.
- Acceptance: both repo links work; TaskTreak is gone from data, images, and markup.

### 6.6 Skills

- Purpose: make a 60-item list scannable, and turn it into evidence.
- Content: the 6 groups verbatim, in the order of the resume variant chosen in Q2.
- Layout: group headers with chip rows; no star ratings or percentages (those would be
  invented data).
- Interaction, the one new game mechanic: selecting a skill highlights every experience or
  project bullet that names it ("Used in: OurFreedom.ai feed, FundFlow"). The mapping is
  computed from resume text at build time, so it can never claim usage the resume does not.
  Skills with no matching bullet just show the group.
- Removed: "Full-Stack Specialist" class title, role chips, the three service cards.
- Acceptance: chip count equals the resume skill count; every "Used in" link resolves.

### 6.7 Education

- Purpose: credentials, clean.
- Content: Northeastern University, Boston, MA, M.S. in Information Systems, Sep 2024 to
  Dec 2026, coursework: Program Structures and Algorithms, System Design, Database
  Management, Prompt Engineering for Generative AI. University of Mumbai, Mumbai, India,
  B.Tech in Electronics and Telecommunication Engineering, Jun 2020 to Jul 2023.
- Interaction: Boston and Mumbai horizon markers light up.
- Acceptance: exactly two entries, four courses, dates match the resume.

### 6.8 Contact

- Purpose: one obvious next step.
- Content: email (copy and mailto), LinkedIn, GitHub, "Boston, MA". Phone hidden unless Q8
  says otherwise.
- Layout: a dialog over any screen, reachable from the Contact tab, the Home button, and the
  `C` key.
- Acceptance: copy-to-clipboard confirms with a toast; all links open correctly.

### 6.9 Settings

- Sound (default off), ambient bed, motion (system / full / reduced), graphics quality
  (auto / high / low), a link to the classic view.

### 6.10 Classic view (`/classic`)

- Purpose: the fast, printable, ATS-friendly version, and the fallback for no WebGL.
- Content: the same data in resume order: header, Education, Skills, Experience,
  Projects.
- Layout: single column, 720 px measure, same tokens in light and dark. A print stylesheet
  makes `Cmd+P` produce a clean one-page resume.
- Acceptance: Lighthouse targets in section 1; prints to one Letter page.

### 6.11 Field-report pages (`/work/[slug]`)

- Removed (Q3), with permanent redirects to `/#experience` and removal from the sitemap,
  because their content goes beyond the resume.

### 6.12 Metadata and edge pages

- Title: "Soham Chavan, {headline}". Description built from resume facts only.
- Open Graph image: name, headline, the 4 highlight numbers, night skyline palette.
- JSON-LD `Person`: name, jobTitle, address locality, alumniOf (both universities), sameAs
  (LinkedIn, GitHub). No phone.
- 404 and error pages restyled in the same system with a route home and to the classic view.

### 6.13 Mobile and low-end

- Phones and low tier: static skyline render plus light parallax by default, with "Load 3D"
  as an opt-in, so the page is usable in about 2 s on cellular.
- Bottom tab bar with the 6 tabs; panels as full-height sheets with swipe-down to close.

---

## 7. Five-day schedule

Each day ends with a review checkpoint: screenshots of what changed, sent for your sign-off
before the next day starts.

### Day 1: lock content and foundations

- Confirm Q7 to Q12 (defaults stand unless changed).
- Create `content/resume.ts`: a typed, literal transcription of the resume, the only place
  facts live. Every other file reads from it.
- Delete the cut ledger (section 2.2): testimonials, services, about, now items, Digi
  Cable, TaskTreak, `shipped.ts`, `writeups.ts`, and their components and images.
- Add the missing facts (section 2.3).
- Rename tabs and screen ids to the new IA; add redirects for removed routes (after reading
  the Next.js 16 routing docs in `node_modules/next/dist/docs/`).
- Land the design tokens, fonts, and focus styles.
- Checkpoint: the site runs on the new IA and new data, still with the old visuals.

### Day 2: shell and Home

- Boot, title, and intro rebuilt (6.0 to 6.2).
- Home HUD: identity card, tab bar, highlight row, featured card, Contact entry (6.3).
- Settings defaults (sound off) and the persistent classic-view link.
- Checkpoint: the 10-second test on Home.

### Day 3: Experience and Projects

- Experience timeline and the 10 system cards (6.4).
- Projects cards (6.5).
- Tower pins remapped to the new cards; camera fly-to choreography and reduced-motion cuts.
- Checkpoint: walkthrough recording of Experience and Projects.

### Day 4: Skills, Education, Contact, Classic

- Skills with the "Used in" mechanic (6.6), Education (6.7), Contact (6.8).
- Classic view rebuilt with a print stylesheet (6.10).
- Metadata, Open Graph image, JSON-LD, 404, error (6.12).
- Checkpoint: classic page in light, dark, and print.

### Day 5: polish and ship

- Mobile and low-end path (6.13).
- Accessibility pass: keyboard only, screen reader labels, contrast, reduced motion.
- Performance pass: GLB and texture sizes, bundle split, LCP on `/classic`.
- Line-by-line audit of every visible string against the resume.
- Production build, preview deploy, final commit and PR.
- Checkpoint: Lighthouse reports and the audit table.

---

## 8. Technical plan

- `content/resume.ts`: the single source. Types: `Header`, `Education[]`, `SkillGroup[]`,
  `Role[]` (with `bullets[]`), `Project[]`. Each bullet gets a stable id so cards, pins, and
  the "Used in" index can reference it.
- `content/scene.ts`: replaces `lobby.ts`; holds only 3D mapping (bullet id to landmark id)
  and UI copy. No facts.
- A content check (`npm run check:content`): fails the build if any component imports from
  a deleted content module, or if a skill in the "Used in" index has no matching bullet.
- Files expected to go: `content/shipped.ts`, `content/writeups.ts`, `app/work/[slug]/`,
  `app/initials-avatar.tsx`, `public/tasktreak.png`; `app/featured-work.tsx` gets rebuilt.
- Next.js 16 note: read `node_modules/next/dist/docs/` before touching routing, redirects,
  metadata, or fonts, as `AGENTS.md` asks.
- Verification each day: `npm run build`, browser checks in the preview pane at 1440 px and
  375 px, console clean.

---

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Strict resume content feels thin on Home | Lean on numbers and the 3D scene; no filler copy |
| Camera choreography eats Day 3 | Pins and fly-to already exist; reuse, only remap |
| 3D cost on phones | Static-first mobile path (6.13) |
| Font swap shifts layouts | Land fonts on Day 1 so every later screen is built on them |
| Direction B chosen | Swap Day 2 and Day 3 for environment work; simplify Skills mechanic |

---

## 10. Open questions

Q1 to Q6 are answered (see Decisions at the top). Q7 to Q12 run on their defaults unless
you say otherwise.

| # | Question | Answer or default |
| --- | --- | --- |
| Q1 | Theme direction | Answered: A and B combined, "Launch Deck" |
| Q2 | Headline and ordering | Answered: SDE, "Software Engineer" |
| Q3 | Which non-resume items stay | Answered: none |
| Q4 | Tab labels | Answered: plain |
| Q5 | Uncommitted face change | Answered: committed as `856d653` |
| Q6 | Scene location | Answered: NYC skyline, no coordinates |
| Q7 | Sound default | Off |
| Q8 | Show the phone number from the resume | Hidden |
| Q9 | Keep the degree progress bar | Drop it |
| Q10 | Keep the Lumina and FundFlow screenshots (images, not claims) | Keep |
| Q11 | Resume PDF download | Stays off, as it is now |
| Q12 | Custom domain for the launch | Stays on the Vercel URL |
