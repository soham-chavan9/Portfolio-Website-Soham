# Portfolio

Next.js App Router, TypeScript, plain CSS. No UI framework, no Tailwind, no MDX.

This version merges the content from the static `index.html` concept into the
Next project structure: the homepage is data-driven, the featured OurFreedom.ai
work uses React tabs, and the writeup pages use the same real case-study content
instead of placeholders.

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
| `content/site.ts` | Name, headline, intro, status, contact links, hero stats, and nav |
| `content/portfolio.ts` | Featured work, experience, projects, testimonials, services, skills, education, and current status |
| `content/shipped.ts` | Work index data for case-study entries and project summaries |
| `content/writeups.ts` | The three case studies, as arrays of blocks (`p`, `h`, `code`) |

No component needs touching to change copy. Adding a fourth writeup means one
entry in `writeups.ts` and a matching `slug` in `shipped.ts`.

## Things worth adding later

- A short `/writing` section. The release-pipeline writeup is already close to a
  publishable blog post, and one post that ranks for something like
  "expo-updates runtime fingerprint" will bring you more inbound than the
  portfolio itself.
- A link to the Lumina repo on its list entry, so at least one thing on the page
  is inspectable code.
