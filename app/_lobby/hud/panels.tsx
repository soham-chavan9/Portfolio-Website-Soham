"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  careerPins,
  landmarks,
  loadoutSlots,
  missionReports,
  missionTargets,
  projectTargets,
  rangeLabel,
  type ScreenId,
} from "@/content/lobby";
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
import { shipped } from "@/content/shipped";
import { site } from "@/content/site";
import { audio } from "../audio";
import { back, copyEmail, openComms, rememberScreen } from "../actions";
import { lobby, useLobby } from "../store";
import {
  IconArrow,
  IconBack,
  IconCheck,
  IconClose,
  IconCopy,
  IconDownload,
  IconGithub,
  IconLinkedin,
  IconMail,
  IconPin,
  IconTarget,
} from "./icons";

const hover = () => audio.hover();

/** Panel shell: reports its footprint so the 3D camera re-centers beside it. */
function Panel({
  id,
  eyebrow,
  title,
  children,
  onClose = back,
  closeLabel = "Back to lobby",
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const narrow = window.innerWidth < 760;
      const r = el.getBoundingClientRect();
      lobby.set({
        panelInset: narrow ? 0 : Math.round(window.innerWidth - r.left),
        sheetInset: narrow ? Math.round(window.innerHeight - r.top) : 0,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      lobby.set({ panelInset: 0, sheetInset: 0 });
    };
  }, []);

  return (
    <section ref={ref} className="lb-panel" aria-labelledby={`${id}-title`} key={id}>
      <header className="panel-head">
        <div>
          <p className="lb-eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} onMouseEnter={hover} aria-label={closeLabel}>
          <IconClose />
          <kbd className="kbd-hint">Esc</kbd>
        </button>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function Facts({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="facts">
      {items.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="lb-chips">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function ReportLink({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <Link className="btn-line" href={`/work/${slug}`} onClick={rememberScreen} onMouseEnter={hover}>
      {children}
      <IconArrow />
    </Link>
  );
}

// ---------------------------------------------------------------------------

function Missions() {
  const focus = useLobby((s) => s.focus);
  const active = featuredWork.systems.find((s) => s.id === focus) ?? featuredWork.systems[0];
  const [step, setStep] = useState(0);
  useEffect(() => setStep(0), [active.id]);
  const target = missionTargets[active.id];

  return (
    <Panel id="missions" eyebrow="Missions · Featured work" title={featuredWork.title}>
      <p className="lede">{featuredWork.summary}</p>
      <Facts items={featuredWork.facts} />

      <div className="list" role="listbox" aria-label="Missions">
        {featuredWork.systems.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="option"
            aria-selected={s.id === active.id}
            className="list-item"
            onMouseEnter={hover}
            onClick={() => {
              audio.click();
              lobby.set({ focus: s.id });
            }}
          >
            <span className="list-code">M-0{i + 1}</span>
            <span className="list-name">{s.label}</span>
            <span className="list-status">
              <IconCheck width={14} height={14} /> Shipped
            </span>
          </button>
        ))}
      </div>

      <article className="detail" key={active.id}>
        <p className="target">
          <IconTarget width={15} height={15} />
          <span>
            Pinned on {landmarks[target].name} · {rangeLabel(target)}
          </span>
        </p>
        <h3>{active.title}</h3>
        <p>{active.intro}</p>
        <h4>Objectives</h4>
        <ul className="objectives">
          {active.bullets.map((b) => (
            <li key={b}>
              <IconCheck width={15} height={15} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        {active.steps ? (
          <>
            <h4>Phases</h4>
            <ol className="phases">
              {active.steps.map((st, i) => (
                <li key={st.title} className={i === step ? "on" : ""}>
                  <button
                    type="button"
                    aria-expanded={i === step}
                    onMouseEnter={hover}
                    onClick={() => {
                      audio.click();
                      setStep(i);
                    }}
                  >
                    <span className="phase-n">{i + 1}</span>
                    <span>
                      <b>{st.title}</b>
                      <small>{st.note}</small>
                    </span>
                  </button>
                  {i === step && <p>{st.detail}</p>}
                </li>
              ))}
            </ol>
          </>
        ) : (
          active.facts && (
            <>
              <h4>Intel</h4>
              <Facts items={active.facts} />
            </>
          )
        )}
        <ReportLink slug={missionReports[active.id]}>Read the field report</ReportLink>
      </article>

      <p className="fine">{featuredWork.role}</p>
    </Panel>
  );
}

function Arsenal() {
  const focus = useLobby((s) => s.focus);
  const index = focus?.startsWith("p") ? Number(focus.slice(1)) : 0;
  const p = projects[index] ?? projects[0];
  const target = projectTargets[index];
  return (
    <Panel id="arsenal" eyebrow="Arsenal · Projects" title="Side projects">
      <p className="lede">Projects where I owned the whole thing, from problem to deployed product.</p>
      <div className="cards" role="listbox" aria-label="Projects">
        {projects.map((proj, i) => (
          <button
            key={proj.title}
            type="button"
            role="option"
            aria-selected={i === index}
            className="card"
            onMouseEnter={hover}
            onClick={() => {
              audio.click();
              lobby.set({ focus: `p${i}` });
            }}
          >
            <img src={proj.image} alt="" width={160} height={160} loading="lazy" />
            <span>{proj.title.split(",")[0]}</span>
          </button>
        ))}
      </div>

      <article className="detail" key={p.title}>
        <p className="target">
          <IconTarget width={15} height={15} />
          <span>
            Pinned on {landmarks[target].name} · {rangeLabel(target)}
          </span>
        </p>
        <figure className="lb-shot">
          <img src={p.image} alt={p.alt} width={1024} height={1024} />
        </figure>
        <h3>{p.title}</h3>
        <p className="sub">{p.role}</p>
        <Facts
          items={[
            { label: "Timeline", value: p.timeline },
            { label: "Team", value: p.team },
          ]}
        />
        <h4>Problem</h4>
        <p>{p.problem}</p>
        <h4>Built</h4>
        <p>{p.built}</p>
        <Chips items={p.stack} />
      </article>

      <h4 className="section-label">Service record · everything shipped</h4>
      <ul className="log">
        {shipped.map((item) => (
          <li key={item.title}>
            <div>
              <b>{item.title}</b>
              <span>
                {item.when} · {item.where}
              </span>
            </div>
            <p>{item.summary}</p>
            {item.platforms && (
              <ul className="platforms" aria-label="Platforms">
                {item.platforms.map((pl) => (
                  <li key={pl}>{pl === "ios" ? "iOS" : pl === "server" ? "Server" : pl === "web" ? "Web" : "Android"}</li>
                ))}
              </ul>
            )}
            {item.slug && <ReportLink slug={item.slug}>Field report</ReportLink>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Loadout() {
  return (
    <Panel id="loadout" eyebrow="Loadout · Skills" title="Full-stack specialist">
      <p className="lede">{site.description}</p>
      <h4 className="section-label">Classes</h4>
      <Chips items={site.roles} />
      <h4 className="section-label">Abilities</h4>
      <div className="abilities">
        {services.map((s, i) => (
          <article key={s.label} className="ability">
            <span className="ability-n">0{i + 1}</span>
            <div>
              <h3>{s.label}</h3>
              <p>{s.text}</p>
            </div>
          </article>
        ))}
      </div>
      <h4 className="section-label">Equipped</h4>
      <div className="slots">
        {loadoutSlots.map(({ slot, groupIndex }) => {
          const g = skillGroups[groupIndex];
          return (
            <section key={slot} className="slot">
              <header>
                <span className="slot-name">{slot}</span>
                <span className="slot-group">{g.label}</span>
                <span className="slot-count">{g.items.length}</span>
              </header>
              <Chips items={g.items} />
            </section>
          );
        })}
      </div>
    </Panel>
  );
}

const pinForOrg = (org: string) => careerPins.find((p) => org.includes(p.org.split(" ")[0]))?.id ?? null;

function Career() {
  const focus = useLobby((s) => s.focus);
  return (
    <Panel id="career" eyebrow="Career · Experience" title="Service record">
      <ol className="seasons">
        {experience.map((item, i) => {
          const pin = pinForOrg(item.org);
          const season = experience.length - i;
          return (
            <li key={item.org + item.when} className={pin && pin === focus ? "on" : ""}>
              <button
                type="button"
                className="season-head"
                onMouseEnter={hover}
                onClick={() => {
                  audio.click();
                  lobby.set({ focus: pin });
                }}
              >
                <span className="season-n">S{season}</span>
                <span>
                  <b>{item.org}</b>
                  <small>{item.when}</small>
                </span>
                <IconPin width={16} height={16} />
              </button>
              <h3>{item.title}</h3>
              <ul>
                {item.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      <h4 className="section-label">Education</h4>
      <ul className="edu">
        {education.map((e) => (
          <li key={e.degree}>
            <b>{e.degree}</b>
            <span>{e.meta}</span>
          </li>
        ))}
      </ul>

      <h4 className="section-label">Commendations</h4>
      <div className="lb-quotes">
        {testimonials.map((t) => (
          <figure key={t.name} className="lb-quote">
            <blockquote>{t.quote}</blockquote>
            <figcaption>
              <span className="lb-avatar" aria-hidden>
                {t.initials}
              </span>
              <span>
                <b>{t.name}</b>
                <small>{t.role}</small>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Panel>
  );
}

function Intel() {
  return (
    <Panel id="intel" eyebrow="Intel · About" title={site.name}>
      <p className="lede">{site.intro}</p>
      <div className="lb-prose">
        {about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <h4 className="section-label">Current objectives</h4>
      <ul className="objectives lb-now">
        {nowItems.map((n) => (
          <li key={n.label}>
            <IconTarget width={15} height={15} />
            <span>
              <b>{n.label}</b>
              {n.text}
            </span>
          </li>
        ))}
      </ul>
      <div className="row-btns">
        <a className="btn-amber" href={site.resumeHref} download onMouseEnter={hover} onClick={() => audio.click()}>
          <IconDownload /> Download résumé
        </a>
        <button type="button" className="btn-line" onMouseEnter={hover} onClick={openComms}>
          <IconMail /> Open comms
        </button>
      </div>
    </Panel>
  );
}

export function CommsPanel() {
  const open = useLobby((s) => s.comms);
  if (!open) return null;
  return (
    <Panel id="comms" eyebrow="Comms · Contact" title="Open a channel" onClose={back} closeLabel="Close contact">
      <p className="lede">The fastest way to reach me is email. I usually reply within a day.</p>
      <div className="channel">
        <span className="channel-label">Email</span>
        <b className="channel-value">{site.email}</b>
        <div className="row-btns">
          <button type="button" className="btn-amber" onMouseEnter={hover} onClick={() => copyEmail(site.email)}>
            <IconCopy /> Copy email
          </button>
          <a className="btn-line" href={`mailto:${site.email}`} onMouseEnter={hover}>
            <IconMail /> Send email
          </a>
        </div>
      </div>
      <div className="channels">
        <a href={site.linkedin} target="_blank" rel="noreferrer" onMouseEnter={hover}>
          <IconLinkedin /> LinkedIn
        </a>
        <a href={site.github} target="_blank" rel="noreferrer" onMouseEnter={hover}>
          <IconGithub /> GitHub
        </a>
        <a href={site.resumeHref} download onMouseEnter={hover}>
          <IconDownload /> Résumé (PDF)
        </a>
      </div>
      <p className="fine">
        {site.status}. Based in {site.location}, open to relocation and remote work.
      </p>
    </Panel>
  );
}

export function ScreenPanel() {
  const screen = useLobby((s) => s.screen);
  const comms = useLobby((s) => s.comms);
  if (comms) return null;
  const map: Partial<Record<ScreenId, () => ReactNode>> = {
    missions: Missions,
    arsenal: Arsenal,
    loadout: Loadout,
    career: Career,
    intel: Intel,
  };
  const C = map[screen];
  return C ? <C key={screen} /> : null;
}

export function BackButton() {
  const screen = useLobby((s) => s.screen);
  const comms = useLobby((s) => s.comms);
  if (screen === "lobby" && !comms) return null;
  return (
    <button type="button" className="back-btn" onClick={back} onMouseEnter={hover}>
      <IconBack /> Back <kbd className="kbd-hint">Esc</kbd>
    </button>
  );
}
