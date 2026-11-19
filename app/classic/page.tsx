import ContactActions from "../contact-actions";
import FeaturedWork from "../featured-work";
import Reveal from "../reveal";
import ThemeToggle from "../theme-toggle";
import InitialsAvatar from "../initials-avatar";
import { defaultTitle, socialMetadata } from "../seo";
import type { Metadata } from "next";
import Link from "next/link";
import {
  about,
  education,
  experience,
  featuredWork,
  nowItems,
  projects,
  services,
  skillGroups,
  testimonials,
} from "@/content/portfolio";
import { site } from "@/content/site";
import { writeups } from "@/content/writeups";

export const metadata: Metadata = {
  title: { absolute: `${defaultTitle} (classic view)` },
  description: site.description,
  alternates: { canonical: "/classic" },
  ...socialMetadata({
    title: defaultTitle,
    description: site.description,
    path: "/classic",
  }),
};

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

// Annotated so the page still type-checks if content empties the list.
const quotes: readonly Testimonial[] = testimonials;

const initials = site.name
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0]?.toUpperCase())
  .join("")
  .slice(0, 2);

// Sections that render nothing when their content list is empty also drop out
// of the nav, so no nav link points at a missing anchor.
const rendered: Record<string, boolean> = {
  work: true,
  experience: experience.length > 0,
  projects: projects.length > 0,
  testimonials: quotes.length > 0,
  skills: services.length > 0 || skillGroups.length > 0,
  about: true,
  contact: true,
};

const nav = site.nav.filter(
  (item) => !item.href.startsWith("#") || rendered[item.href.slice(1)] !== false
);

export default function Classic() {
  return (
    <>
      <a className="skip-to-content" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <div className="masthead-inner frame">
          <a className="brand" href="#main" aria-label={`${site.name}, back to top`}>
            <span className="wordmark">{site.name}</span>
            <span className="role-strip" aria-hidden="true">
              {site.navHeadline}
            </span>
          </a>
          <nav aria-label="Primary">
            {nav.map((item) => (
              <a className="draw" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
            <Link className="draw" href="/">
              3D lobby
            </Link>
            <ThemeToggle />
            <a className="pill-link" href="#contact">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className="frame" id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <span className="status">
              <span aria-hidden="true" />
              {site.status}
            </span>
            <h1 id="hero-title">{site.headline}</h1>
            <p className="hero-intro">{site.intro}</p>
            <div className="btns">
              {site.resumeHref && (
                <a className="btn primary" href={site.resumeHref} download>
                  Download resume (PDF)
                </a>
              )}
              <a className={site.resumeHref ? "btn" : "btn primary"} href="#work">
                See my work
              </a>
              <a className="btn" href={site.linkedin}>
                LinkedIn
              </a>
            </div>
          </div>

          <figure className="portrait">
            <div className="portrait-image">
              <img
                alt={`Portrait of ${site.name}`}
                decoding="async"
                fetchPriority="high"
                height={1024}
                src={site.profileImage}
                width={1024}
              />
              <span className="initials" aria-hidden="true">
                {initials}
              </span>
            </div>
          </figure>
        </section>

        {site.stats.length > 0 && (
          <section className="stats" aria-label="Highlights">
            {site.stats.map((stat) => (
              <div className="stat" key={stat.label}>
                <b>{stat.value}</b>
                <span>{stat.label}</span>
              </div>
            ))}
          </section>
        )}

        <section className="section" id="work" aria-labelledby="work-title">
          <div className="section-head">
            <h2 id="work-title">Featured work</h2>
            <p>{featuredWork.summary}</p>
          </div>
          <Reveal>
            <FeaturedWork />
          </Reveal>
          {writeups.length > 0 && (
            <div className="case-studies">
              <h3>Written up in depth</h3>
              <ul>
                {writeups.map((w) => (
                  <li key={w.slug}>
                    <Link className="draw" href={`/work/${w.slug}`}>
                      {w.title}
                    </Link>
                    <p>{w.deck}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {experience.length > 0 && (
          <section
            className="section"
            id="experience"
            aria-labelledby="experience-title"
          >
            <div className="section-head">
              <h2 id="experience-title">Experience</h2>
            </div>
            <ol className="timeline">
              {experience.map((item, i) => (
                <Reveal
                  as="li"
                  delay={Math.min(i, 4) * 60}
                  key={`${item.org}-${item.when}`}
                >
                  <p className="when">{item.when}</p>
                  <h3>{item.title}</h3>
                  <p className="org">{item.org}</p>
                  <ul>
                    {item.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </ol>
          </section>
        )}

        {projects.length > 0 && (
          <section
            className="section"
            id="projects"
            aria-labelledby="projects-title"
          >
            <div className="section-head">
              <h2 id="projects-title">Explore my latest projects</h2>
              <p>
                Side projects where I got to own the whole thing, from problem to
                deployed product.
              </p>
            </div>
            <div className="projects">
              {projects.map((project, i) => (
                <Reveal key={project.title}>
                  <article
                    className={i % 2 === 1 ? "project alternate" : "project"}
                  >
                    <div className="project-copy">
                      <h3>{project.title}</h3>
                      <p className="role">{project.role}</p>
                      <dl>
                        <div>
                          <dt>Timeline</dt>
                          <dd>{project.timeline}</dd>
                        </div>
                        <div>
                          <dt>Team</dt>
                          <dd>{project.team}</dd>
                        </div>
                        <div>
                          <dt>Problem</dt>
                          <dd>{project.problem}</dd>
                        </div>
                        <div>
                          <dt>Built</dt>
                          <dd>{project.built}</dd>
                        </div>
                      </dl>
                      <ul className="chips" aria-label="Stack">
                        {project.stack.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      {project.repo && (
                        <p className="read-link">
                          <a
                            className="draw"
                            href={project.repo}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View code on GitHub
                            <span className="sr-only">: {project.title}</span>
                          </a>
                        </p>
                      )}
                    </div>
                    <div className="shot">
                      <img
                        alt={project.alt}
                        decoding="async"
                        height={1024}
                        loading="lazy"
                        src={project.image}
                        width={1024}
                      />
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {quotes.length > 0 && (
          <section
            className="section"
            id="testimonials"
            aria-labelledby="testimonials-title"
          >
            <div className="section-head">
              <h2 id="testimonials-title">What colleagues say</h2>
              <p>What people I have built with have said.</p>
            </div>
            <div className="quotes">
              {quotes.map((item, i) => (
                <Reveal delay={Math.min(i, 4) * 60} key={item.name}>
                  <figure className="quote">
                    <blockquote>{item.quote}</blockquote>
                    <figcaption>
                      <InitialsAvatar initials={item.initials} />
                      <span>
                        <b>{item.name}</b>
                        {item.role}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {rendered.skills && (
          <section className="section" id="skills" aria-labelledby="skills-title">
            <div className="section-head">
              <h2 id="skills-title">Skills and what I am strong at</h2>
              <p>The kinds of work I am strongest at, and the tools I use.</p>
            </div>
            {services.length > 0 && (
              <div className="services">
                {services.map((item, i) => (
                  <Reveal delay={Math.min(i, 4) * 55} key={item.label}>
                    <article className="service">
                      <span className="service-index" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3>{item.label}</h3>
                      <p>{item.text}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
            {skillGroups.length > 0 && (
              <div className="skill-groups">
                {skillGroups.map((group) => (
                  <div key={group.label}>
                    <h3>{group.label}</h3>
                    <ul className="chips">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="section" id="about" aria-labelledby="about-title">
          <div className="section-head">
            <h2 id="about-title">About me</h2>
          </div>
          <div className="about-grid">
            <div className="prose">
              {about.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {education.length > 0 && (
                <div className="education">
                  {education.map((item) => (
                    <div key={item.degree}>
                      <b>{item.degree}</b>
                      <span>{item.meta}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {nowItems.length > 0 && (
              <aside className="now" aria-labelledby="now-title">
                <h3 id="now-title">What I am doing now</h3>
                <ul>
                  {nowItems.map((item) => (
                    <li key={item.label}>
                      <b>{item.label}</b>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <div>
            <h2 id="contact-title">Let&apos;s build something people can trust.</h2>
            <p>
              The fastest way to reach me is email. I usually reply within a
              day.
            </p>
          </div>
          <ContactActions
            email={site.email}
            github={site.github}
            linkedin={site.linkedin}
            resumeHref={site.resumeHref ?? undefined}
          />
        </section>

        <footer className="footer">
          <a className="draw" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <a className="draw" href={site.github}>
            GitHub
          </a>
          <a className="draw" href={site.linkedin}>
            LinkedIn
          </a>
          {site.resumeHref && (
            <a className="draw" href={site.resumeHref} download>
              Resume
            </a>
          )}
          <span className="spacer" />
          <span className="quiet">{site.location}</span>
        </footer>
      </main>
    </>
  );
}
