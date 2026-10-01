import ContactActions from "./contact-actions";
import FeaturedWork from "./featured-work";
import Reveal from "./reveal";
import ThemeToggle from "./theme-toggle";
import {
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

export default function Home() {
  return (
    <>
      <header className="masthead">
        <div className="masthead-inner frame">
          <a className="brand" href="#top" aria-label={`${site.name}, home`}>
            <span className="wordmark">{site.name}</span>
            <span className="role-strip" aria-hidden="true">
              {site.headline}
            </span>
          </a>
          <nav aria-label="Primary">
            {site.nav.map((item) => (
              <a className="draw" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
            <ThemeToggle />
            <a className="pill-link" href="#contact">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <main className="frame" id="top">
        <section className="hero">
          <div>
            <span className="status">
              <span aria-hidden="true" />
              {site.status}
            </span>
            <h1>{site.headline}</h1>
            <p className="hero-intro">{site.intro}</p>
            <div className="btns">
              <a className="btn primary" href="#work">
                See my work
              </a>
              <a className="btn" href={site.resumeHref} download>
                Download resume
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
                height="1024"
                src={site.profileImage}
                width="1024"
              />
              <span className="initials" aria-hidden="true">
                SC
              </span>
            </div>
          </figure>
        </section>

        <section className="stats" aria-label="Portfolio highlights">
          {site.stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="section" id="work">
          <div className="section-head">
            <h2>Featured work</h2>
            <p>{featuredWork.summary}</p>
          </div>
          <Reveal>
            <FeaturedWork />
          </Reveal>
        </section>

        <section className="section" id="experience">
          <div className="section-head">
            <h2>Experience</h2>
          </div>
          <ol className="timeline">
            {experience.map((item, i) => (
              <Reveal
                as="li"
                delay={i * 60}
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

        <section className="section" id="projects">
          <div className="section-head">
            <h2>Explore my latest projects</h2>
            <p>
              Side projects where I got to own the whole thing, from problem to
              deployed product.
            </p>
          </div>
          <div className="projects">
            {projects.map((project, i) => (
              <Reveal delay={i * 60} key={project.title}>
                <article className={i % 2 === 1 ? "project alternate" : "project"}>
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
                        <dt>Impact</dt>
                        <dd className="impact">{project.impact}</dd>
                      </div>
                      <div>
                        <dt>Built</dt>
                        <dd>{project.built}</dd>
                      </div>
                    </dl>
                    <ul className="chips">
                      {project.stack.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <a className="read-link draw" href={site.github}>
                      Source code
                    </a>
                  </div>
                  <div className="shot">
                    <img
                      alt={project.alt}
                      src={project.image}
                      width={1024}
                      height={1024}
                      loading="lazy"
                    />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Social proof</h2>
            <p>What people I have built with have said.</p>
          </div>
          <div className="quotes">
            {testimonials.map((item, i) => (
              <Reveal delay={i * 60} key={item.name}>
                <figure className="quote">
                  <blockquote>{item.quote}</blockquote>
                  <figcaption>
                    <span className="avatar">
                      {item.image ? <img alt="" src={item.image} /> : item.initials}
                    </span>
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

        <section className="section" id="skills">
          <div className="section-head">
            <h2>Skills & services</h2>
            <p>Three kinds of work I am strongest at, and the tools I use.</p>
          </div>
          <div className="services">
            {services.map((item, i) => (
              <Reveal delay={i * 55} key={item.label}>
                <article className="service">
                  <span className="service-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{item.label}</h3>
                  <p>{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
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
        </section>

        <section className="section" id="about">
          <div className="section-head">
            <h2>About me</h2>
          </div>
          <div className="about-grid">
            <div className="prose">
              <p>
                I am Soham, a software engineer in Boston. I like owning a
                system from its database schema through the API and native code
                to the moment it passes App Store review.
              </p>
              <p>
                My most meaningful work so far has been at OurFreedom.ai, where
                the people using the app are families keeping in touch with
                someone in prison. That shaped how I think about engineering: a
                release that breaks, or an image that slips through moderation,
                lands on real people.
              </p>
              <p>
                Before that I built telecom integration APIs in Mumbai serving
                10,000+ daily users. Now I am finishing an M.S. in Information
                Systems at Northeastern.
              </p>
              <div className="education">
                {education.map((item) => (
                  <div key={item.degree}>
                    <b>{item.degree}</b>
                    <span>{item.meta}</span>
                  </div>
                ))}
              </div>
            </div>
            <aside className="now">
              <h3>What I am doing now</h3>
              <ul>
                {nowItems.map((item) => (
                  <li key={item.label}>
                    <b>{item.label}</b>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="contact" id="contact">
          <div>
            <h2>Let's build something people can trust.</h2>
            <p>
              The fastest way to reach me is email. I usually reply within a
              day.
            </p>
          </div>
          <ContactActions email={site.email} github={site.github} />
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
          <a className="draw" href={site.resumeHref}>
            Resume
          </a>
          <span className="spacer" />
          <span className="quiet">{site.location}</span>
        </footer>
      </main>
    </>
  );
}
