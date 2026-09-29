# Portfolio

Next.js App Router, TypeScript, plain CSS. No UI framework, no Tailwind, no MDX —
three dependencies total, so it installs and deploys without surprises.

## Design

Jewel-tone palette, all of it in `:root` at the top of `app/globals.css`:

| Token | Value | Used for |
| --- | --- | --- |
| `--ink` | `#1A1636` | Midnight amethyst. The primary text colour — deliberately not black |
| `--royal` | `#3A2E8C` | Amethyst. iOS track, links, code rule |
| `--emerald` | `#1C6B55` | Android track |
| `--gold` | `#9C7C2E` | Antique gold. Motion and hover only — never static decoration |
| `--paper` | `#FAF9FC` | Pearl, faint violet cast |

Two typefaces with a hard split: EB Garamond sets everything meant to be read,
JetBrains Mono sets every piece of interface chrome — nav, dates, version
strings, platform tokens, stack lists. Change either in `app/layout.tsx`.

Motion is deliberately confined:

- **One load sequence.** Masthead, headline, intro, and the release block rise
  in turn, then a gold line sweeps under each track row like a rollout landing.
  Stagger is set per row via the `--d` custom property in `app/page.tsx`.
- **Scroll reveals.** `app/reveal.tsx` fades each work row in as it enters view.
- **Hover.** The `draw` class pulls a gold underline across any link.

Everything above is switched off under `prefers-reduced-motion: reduce`. If you
want the site calmer, delete the `Reveal` wrapper in `app/page.tsx` and the load
animations survive on their own.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

I could not run the install in the environment where this was written, so the
first `npm install` is also the first real test. If anything fails it will be a
version pin in `package.json`, not the application code.

## Deploy it

```bash
git init && git add -A && git commit -m "portfolio"
gh repo create soham-portfolio --public --source=. --push
```

Then import the repo at vercel.com. Framework detection picks up Next.js, no
configuration needed. Add a custom domain under project settings when you have
one — `sohamchavan.dev` or similar reads better on a resume than a
`vercel.app` subdomain.

## Where the content lives

| File | What is in it |
| --- | --- |
| `content/site.ts` | Name, headline, intro, contact links, the hero release-status lines |
| `content/shipped.ts` | The full work list on the landing page. Add an entry here; set `slug` only if a writeup exists |
| `content/writeups.ts` | The three case studies, as arrays of blocks (`p`, `h`, `code`, `todo`) |

No component needs touching to change copy. Adding a fourth writeup means one
entry in `writeups.ts` and a matching `slug` in `shipped.ts`.

## Before you publish

The writeups render yellow `todo` blocks in three places. They are visible on
the page on purpose so you cannot forget them. Each one asks for something only
you know:

1. **Release pipeline** — one real figure. Releases shipped, time from merge to
   production, or OTA adoption inside 24 hours.
2. **Moderation** — rough scale, if you can share it without leaking product
   internals. Images screened, or the device-versus-server split.
3. **Compliance** — you told me this cleared review with no rejections. State it
   plainly, with a submission count if you have one.

Delete the `todo` blocks once those are in. Also check:

- The version strings in `site.ts` are plausible placeholders, not real. Put the
  actual last version you shipped, or cut the `tracks` block entirely if you
  would rather not publish version numbers.
- Confirm you are comfortable naming OurFreedom.ai and describing the moderation
  and age-assurance systems at this level of detail. Everything here is at the
  same level as your resume, but a public page is a different audience than a
  recruiter's inbox. If in doubt, ask them.
- `public/Soham_Chavan_Resume.pdf` is the current resume. Replace the file when
  you update it; the path stays the same.

## Things worth adding later

- A short `/writing` section. The release-pipeline writeup is already close to a
  publishable blog post, and one post that ranks for something like
  "expo-updates runtime fingerprint" will bring you more inbound than the
  portfolio itself.
- A link to the Lumina repo on its list entry, so at least one thing on the page
  is inspectable code.
