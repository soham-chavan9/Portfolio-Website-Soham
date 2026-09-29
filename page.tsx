import Link from "next/link";
import Reveal from "./reveal";
import { site } from "@/content/site";
import { shipped } from "@/content/shipped";

export default function Home() {
  return (
    <main className="frame">
      <header className="masthead">
        <span className="wordmark">{site.name}</span>
        <nav>
          <a className="draw" href={site.resumeHref}>Resume</a>
          <a className="draw" href={site.github}>GitHub</a>
          <a className="draw" href={site.linkedin}>LinkedIn</a>
          <a className="draw" href={`mailto:${site.email}`}>Email</a>
        </nav>
      </header>

      <section className="hero">
        <h1>{site.headline}</h1>
        <p className="hero-intro">{site.intro}</p>

        <div className="tracks">
          {site.tracks.map((t, i) => (
            <div
              className="track"
              key={t.platform}
              style={
                { "--d": `${0.55 + i * 0.18}s` } as React.CSSProperties
              }
            >
              <span className="track-platform" data-p={t.platform}>
                {t.platform}
              </span>
              <span className="track-version">{t.version}</span>
              <span className="track-detail">
                {t.detail}
                <span className="track-note">{t.note}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="work">
        <p className="section-lede">
          <strong>What I have shipped.</strong> Most of this is from six months
          at OurFreedom.ai, a platform that keeps families in contact with
          incarcerated relatives, where I was team lead across the mobile app
          and the backend. Three entries have writeups, because they are
          the ones where the design decisions were the interesting part.
        </p>

        <div className="ship-list">
          {shipped.map((item, i) => (
            <Reveal key={item.title} delay={Math.min(i, 4) * 55}>
              <article className="ship">
                <div className="ship-when">
                  {item.when}
                  <span className="ship-where">{item.where}</span>
                </div>

                <div>
                  <h2 className="ship-title">
                    {item.slug ? (
                      <Link href={`/work/${item.slug}`}>{item.title}</Link>
                    ) : (
                      item.title
                    )}
                  </h2>

                  <p className="ship-summary">{item.summary}</p>

                  <div className="ship-foot">
                    {item.platforms && (
                      <span className="platforms">
                        {item.platforms.map((p) => (
                          <span className="platform" data-p={p} key={p}>
                            {p}
                          </span>
                        ))}
                      </span>
                    )}
                    <span>{item.stack.join(", ")}</span>
                    {item.slug && (
                      <Link className="read-link draw" href={`/work/${item.slug}`}>
                        Read the writeup
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section" id="about">
        <div className="prose">
          <p>
            I was team lead on mobile and backend at OurFreedom.ai, and I am
            finishing an M.S. in Information Systems at Northeastern in
            December 2026. Before that I spent a year building telecom
            integration services in Mumbai, which is where I learned that most
            production incidents are really disagreements about a contract
            between two systems.
          </p>
          <p>
            What I want to do next is release engineering and platform
            reliability — the infrastructure that decides whether shipping is
            eventful. If that is the problem on your team, I would like to hear
            about it. The fastest way to reach me is{" "}
            <a className="draw" href={`mailto:${site.email}`}>email</a>.
          </p>
        </div>
      </section>

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
