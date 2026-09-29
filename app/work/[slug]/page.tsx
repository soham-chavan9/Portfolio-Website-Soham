import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/content/site";
import { writeups, writeupBySlug } from "@/content/writeups";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return writeups.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = writeupBySlug(slug);
  if (!w) return {};
  return {
    title: `${w.title} — ${site.name}`,
    description: w.deck,
  };
}

export default async function WriteupPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const w = writeupBySlug(slug);
  if (!w) notFound();

  const others = writeups.filter((o) => o.slug !== w.slug);

  return (
    <main className="frame">
      <Link className="backlink draw" href="/">
        Back to everything
      </Link>

      <header className="writeup-head">
        <h1>{w.title}</h1>
        <p className="deck">{w.deck}</p>

        <dl className="meta">
          <div>
            <dt>Role</dt>
            <dd>{w.meta.role}</dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>{w.meta.when}</dd>
          </div>
          <div>
            <dt>Surface</dt>
            <dd>{w.meta.surface}</dd>
          </div>
          <div>
            <dt>Built with</dt>
            <dd>{w.meta.stack}</dd>
          </div>
        </dl>
      </header>

      <article className="writeup-body">
        {w.body.map((block, i) => {
          if (block.kind === "h") return <h2 key={i}>{block.text}</h2>;
          if (block.kind === "code") return <pre key={i}>{block.text}</pre>;
          return <p key={i}>{block.text}</p>;
        })}

        <div className="next">
          Also written up:{" "}
          {others.map((o, i) => (
            <span key={o.slug}>
              <Link className="draw" href={`/work/${o.slug}`}>{o.title}</Link>
              {i < others.length - 1 ? ", " : "."}
            </span>
          ))}
        </div>
      </article>

      <footer className="footer">
        <a className="draw" href={`mailto:${site.email}`}>{site.email}</a>
        <a className="draw" href={site.github}>GitHub</a>
        <a className="draw" href={site.linkedin}>LinkedIn</a>
        <a className="draw" href={site.resumeHref}>Resume</a>
        <span className="spacer" />
        <span className="quiet">{site.location}</span>
      </footer>
    </main>
  );
}
