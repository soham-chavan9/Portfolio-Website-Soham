import ContactActions from "../contact-actions";
import Reveal from "../reveal";
import ThemeToggle from "../theme-toggle";
import { defaultTitle, socialMetadata } from "../seo";
import type { Metadata } from "next";
import Link from "next/link";
import { highlights, resume, spanLabel } from "@/content/resume";
import { site } from "@/content/site";
import { skillLogos } from "../skill-logos";

// The plain, printable view. Same data as the lobby, in the resume's own
// order: header, Education, Skills, Experience, Projects.

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

const nav = [
  { label: "Education", href: "#education" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
];

const initials = resume.name
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0]?.toUpperCase())
  .join("")
  .slice(0, 2);

export default function Classic() {
  return (
    <>
      <a className="skip-to-content" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <div className="masthead-inner frame">
          <a className="brand" href="#main" aria-label={`${resume.name}, back to top`}>
            <span className="wordmark">{resume.name}</span>
            <span className="role-strip" aria-hidden="true">
              {resume.headline}
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
            <p className="status">
              <span aria-hidden="true" />
              {resume.location}
            </p>
            <h1 id="hero-title">{resume.name}</h1>
            <p className="hero-intro">{resume.headline}</p>
            <div className="btns">
              {site.resumeHref && (
                <a className="btn primary" href={site.resumeHref} download>
                  Download resume (PDF)
                </a>
              )}
              <a className={site.resumeHref ? "btn" : "btn primary"} href="#experience">
                Experience
              </a>
              <a className="btn" href={resume.linkedin}>
                LinkedIn
              </a>
              <a className="btn" href={resume.github}>
                GitHub
              </a>
            </div>
          </div>

          <figure className="portrait">
            <div className="portrait-image">
              <img
                alt={`Portrait of ${resume.name}`}
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

        <section className="stats" aria-label="Highlights">
          {highlights.map((stat) => (
            <div className="stat" key={stat.label}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="section" id="education" aria-labelledby="education-title">
          <div className="section-head">
            <h2 id="education-title">Education</h2>
          </div>
          <div className="education">
            {resume.education.map((item) => (
              <div key={item.id}>
                <b>
                  {item.school}, {item.location}
                </b>
                <span>
                  {item.degree} · {spanLabel(item.span)}
                </span>
                {item.coursework.length > 0 && (
                  <span>Coursework: {item.coursework.join(", ")}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="skills" aria-labelledby="skills-title">
          <div className="section-head">
            <h2 id="skills-title">Technical skills</h2>
          </div>
          <div className="skill-groups">
            {resume.skills.map((group) => (
              <div key={group.id}>
                <h3>{group.label}</h3>
                <ul className="chips">
                  {group.items.map((item) => (
                    <li className="chip-skill" key={item}>
                      <span className="chip-logo" aria-hidden="true">
                        {skillLogos(item).map((src) => (
                          <img alt="" decoding="async" height={16} key={src} loading="lazy" src={src} width={16} />
                        ))}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="experience" aria-labelledby="experience-title">
          <div className="section-head">
            <h2 id="experience-title">Experience</h2>
          </div>
          <ol className="timeline">
            {resume.experience.map((role, i) => (
              <Reveal as="li" delay={Math.min(i, 4) * 60} key={role.id}>
                <p className="when">
                  {spanLabel(role.span)}, {role.location}
                </p>
                <h3>{role.title}</h3>
                <p className="org">{role.org}</p>
                <ul>
                  {role.bullets.map((b) => (
                    <li key={b.id}>{b.text}</li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="section" id="projects" aria-labelledby="projects-title">
          <div className="section-head">
            <h2 id="projects-title">Projects</h2>
          </div>
          <div className="projects">
            {resume.projects.map((project, i) => (
              <Reveal key={project.id}>
                <article className={i % 2 === 1 ? "project alternate" : "project"}>
                  <div className="project-copy">
                    <h3>
                      {project.name}, {project.subtitle}
                    </h3>
                    <p className="role">{spanLabel(project.span)}</p>
                    <ul>
                      {project.bullets.map((b) => (
                        <li key={b.id}>{b.text}</li>
                      ))}
                    </ul>
                    <ul className="chips" aria-label="Stack">
                      {project.stack.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <p className="read-link">
                      <a className="draw" href={project.repo} target="_blank" rel="noreferrer">
                        View code on GitHub
                        <span className="sr-only">: {project.name}</span>
                      </a>
                    </p>
                  </div>
                  <div className="shot">
                    <img
                      alt={project.alt}
                      decoding="async"
                      height={project.imageHeight}
                      loading="lazy"
                      src={project.image}
                      width={project.imageWidth}
                    />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <div>
            <h2 id="contact-title">Contact</h2>
            <p>
              {resume.email} · {resume.location}
            </p>
          </div>
          <ContactActions
            email={resume.email}
            github={resume.github}
            linkedin={resume.linkedin}
            resumeHref={site.resumeHref ?? undefined}
          />
        </section>

        <footer className="footer">
          <a className="draw" href={`mailto:${resume.email}`}>
            {resume.email}
          </a>
          <a className="draw" href={resume.github}>
            GitHub
          </a>
          <a className="draw" href={resume.linkedin}>
            LinkedIn
          </a>
          {site.resumeHref && (
            <a className="draw" href={site.resumeHref} download>
              Resume
            </a>
          )}
          <span className="spacer" />
          <span className="quiet">{resume.location}</span>
        </footer>
      </main>
    </>
  );
}
