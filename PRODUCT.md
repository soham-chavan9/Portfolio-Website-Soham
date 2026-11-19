# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally:

- Recruiters and hiring managers screening Soham Chavan for new-grad software engineering roles. Their job is a fast read: current or most recent role, the strongest numbers, and how to reach him.
- Engineers on a hiring loop judging technical depth. Their job is to dig into experience and projects and open the GitHub repositories.

## Product Purpose

A personal portfolio for Soham Chavan, Software Engineer, Boston, MA. It turns the resume into an explorable 3D lobby so it is remembered, without making it harder to read. Success: a recruiter gets the who, what, proof, and contact within seconds of the Home screen; an engineer finds the depth one step away and reaches GitHub, email, or LinkedIn.

## Positioning

A game-lobby portfolio in which every fact traces line by line to the resume. The 3D scene carries the memorability; nothing on the page claims more than the resume does.

## Operating Context

- Visitors arrive from a resume link, LinkedIn, or a job application, often at work, often on a laptop, sometimes on a phone.
- `/classic` is the plain, printable, ATS-friendly view of the same data and the fallback when WebGL is unavailable.

## Capabilities and Constraints

- Next.js 16 App Router, React Three Fiber, plain CSS. The lobby is `app/_lobby`; the classic page is `app/classic`.
- Facts live only in `content/resume.ts`, a verbatim transcription of the SDE resume. A claim not in that file does not ship.
- The resume's phone number is never published. The resume PDF download stays off.
- Sound and music are off by default and opt-in.
- Section labels are plain English: Home, Experience, Projects, Skills, Education, Contact.

## Brand Commitments

- Visual direction pinned by Soham: "Launch Deck", the 3D NYC penthouse and skyline with launch-control styling in the 2D interface (docs/redesign-plan.md, section 3). Game feel comes from camera, motion, and sound, never from jargon in labels.
- The 3D character is a model of Soham built from his photos (`public/operator/`).
- The skyline is never labelled with a location; Soham's location is Boston, MA.

## Evidence on Hand

- `content/resume.ts`: two roles, two projects, two schools, six skill groups, and the numbers bank.
- Project covers from each project's own repo: `public/projects/lumina.jpg` (lumina, `docs/linkedin-thumbnails/01-cover.jpg`), `public/projects/fundflow.jpg` (FundFlow, `docs/screenshots/mac-iphone-1920x1080/fundflow-01-overview.jpg`).
- Portraits: `public/soham-chavan.png`, `public/operator/soham-avatar.jpg`; 3D model `public/operator/soham.glb`.
- Absent, and never to be fabricated: testimonials, case studies or write-ups beyond the resume, an "open to work" status, company descriptions, years-of-experience figures.

## Product Principles

1. The resume is the ceiling: no fact, number, or claim beyond it.
2. Ten-second clarity before depth: the recruiter read never waits on the 3D.
3. Theme through feel, not vocabulary: labels stay plain.
4. One step to proof: every number is one click from the sentence it comes from.
5. The plain view is a first-class citizen, not a fallback afterthought.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast, keyboard-only operation, visible focus, reduced motion honored, screen-reader labels, and a full non-3D path via `/classic`.
