"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  careerPins,
  loadoutSlots,
  missionReports,
  missionTargets,
  projectTargets,
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
import { isLandmark, markerCode, pinLabel } from "../marker-meta";
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

/** Hover tick for mouse only; on touch, mouseenter fires with the tap. */
export const hover = (e: PointerEvent) => {
  if (e.pointerType === "mouse") audio.hover();
};

// ---------------------------------------------------------------- Focus --
// Panels are non-modal (the city stays interactive), so there is no trap.
// Opening one from a control that then disappears moves focus into the
// panel; closing one hands focus back to whatever opened it.

let lastOpener: string | null = null;

const nothingFocused = () => !document.activeElement || document.activeElement === document.body;
const isShown = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && el.getClientRects().length > 0;

/** Record the last `[data-opener]` control the user touched or focused. */
export function trackOpeners() {
  const note = (e: Event) => {
    const el = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-opener]") : null;
    if (el?.dataset.opener) lastOpener = el.dataset.opener;
  };
  document.addEventListener("focusin", note);
  document.addEventListener("pointerdown", note, true);
  return () => {
    document.removeEventListener("focusin", note);
    document.removeEventListener("pointerdown", note, true);
  };
}

/** After a panel or dialog unmounts, put focus somewhere sensible if it fell to <body>. */
export function restoreFocus() {
  requestAnimationFrame(() => {
    if (!nothingFocused()) return;
    const screen = lobby.get().screen;
    const target = [
      lastOpener ? document.querySelector(`[data-opener="${lastOpener}"]`) : null,
      document.getElementById(`lb-tab-${screen}`),
      document.getElementById(`lb-mtab-${screen}`),
    ].find(isShown);
    target?.focus({ preventScroll: true });
  });
}

// ------------------------------------------------------------- Content --

type Commendation = { quote: string; name: string; role: string; initials?: string };

/** Testimonials may be empty; every consumer renders nothing in that case. */
export const commendations: readonly Commendation[] = testimonials;

export const initialsOf = (c: Commendation) =>
  c.initials ??
  c.name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ---------------------------------------------------------------- Shell --

/** Panel shell: reports its footprint so the 3D camera re-centers beside it. */
function Panel({
  id,
  eyebrow,
  title,
  children,
  role = "tabpanel",
  onClose = back,
  closeLabel = "Back to lobby",
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  role?: "tabpanel" | "dialog";
  onClose?: () => void;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const narrow = window.matchMedia("(max-width: 760px)");
    // Layout offsets, not getBoundingClientRect: the entrance animation
    // translates the panel, and a mid-animation rect would skew the camera.
    const measure = () => {
      const host = el.offsetParent instanceof HTMLElement ? el.offsetParent : null;
      const w = host?.clientWidth ?? window.innerWidth;
      const h = host?.clientHeight ?? window.innerHeight;
      lobby.set({
        panelInset: narrow.matches ? 0 : Math.max(0, Math.round(w - el.offsetLeft)),
        sheetInset: narrow.matches ? Math.max(0, Math.round(h - el.offsetTop)) : 0,
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

  useEffect(() => {
    const el = ref.current;
    if (el && nothingFocused()) el.focus({ preventScroll: true });
    return restoreFocus;
  }, []);

  return (
    <section
      ref={ref}
      id={`lb-panel-${id}`}
      className="lb-panel"
      role={role}
      aria-modal={role === "dialog" ? false : undefined}
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
    >
      <header className="panel-head">
        <div>
          <p className="lb-eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`}>{title}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} onPointerEnter={hover} aria-label={closeLabel}>
          <IconClose />
          <kbd className="kbd-hint" aria-hidden>
            Esc
          </kbd>
        </button>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function Facts({ items }: { items: { label: string; value: string }[] }) {
  if (items.length === 0) return null;
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
  if (items.length === 0) return null;
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
    <Link className="btn-line" href={`/work/${slug}`} onClick={rememberScreen} onPointerEnter={hover}>
      {children}
      <IconArrow />
    </Link>
  );
}

function PinnedOn({ landmark }: { landmark: string | null | undefined }) {
  if (!isLandmark(landmark)) return null;
  return (
    <p className="target">
      <IconTarget width={15} height={15} />
      <span>Pinned on {pinLabel(landmark)}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------

function Missions() {
  const focus = useLobby((s) => s.focus);
  const systems = featuredWork.systems;
  const active = systems.find((s) => s.id === focus) ?? systems[0];
  // Phase selection belongs to one mission; switching missions starts at 1
  // on the same render instead of flashing the previous mission's index.
  const [opened, setOpened] = useState<{ id: string; step: number }>({ id: "", step: 0 });
  const activeId = active?.id ?? "";
  const step = opened.id === activeId ? opened.step : 0;
  const report = missionReports[activeId];

  return (
    <Panel id="missions" eyebrow="Missions · Featured work" title={featuredWork.title}>
      <p className="lede">{featuredWork.summary}</p>
      <Facts items={featuredWork.facts} />

      {systems.length > 1 && (
        <div className="list" role="group" aria-label="Missions">
          {systems.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === activeId}
              className="list-item"
              onPointerEnter={hover}
              onClick={() => {
                audio.click();
                lobby.set({ focus: s.id });
              }}
            >
              <span className="list-code">{markerCode("M", i)}</span>
              <span className="list-name">{s.label}</span>
              <span className="list-status">
                <IconCheck width={14} height={14} /> Shipped
              </span>
            </button>
          ))}
        </div>
      )}

      {active && (
        <article className="detail" key={active.id}>
          <PinnedOn landmark={missionTargets[active.id]} />
          <h3>{active.title}</h3>
          <p>{active.intro}</p>
          {active.bullets.length > 0 && (
            <>
              <h4>Objectives</h4>
              <ul className="objectives">
                {active.bullets.map((b) => (
                  <li key={b}>
                    <IconCheck width={15} height={15} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {active.steps && active.steps.length > 0 ? (
            <>
              <h4>Phases</h4>
              <ol className="phases">
                {active.steps.map((st, i) => (
                  <li key={st.title} className={i === step ? "on" : ""}>
                    <button
                      type="button"
                      aria-expanded={i === step}
                      onPointerEnter={hover}
                      onClick={() => {
                        audio.click();
                        setOpened({ id: active.id, step: i });
                      }}
                    >
                      <span className="phase-n" aria-hidden>
                        {i + 1}
                      </span>
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
            active.facts &&
            active.facts.length > 0 && (
              <>
                <h4>Intel</h4>
                <Facts items={active.facts} />
              </>
            )
          )}
          {report && <ReportLink slug={report}>Read the field report</ReportLink>}
        </article>
      )}

      <p className="fine">{featuredWork.role}</p>
    </Panel>
  );
}

function Arsenal() {
  const focus = useLobby((s) => s.focus);
  const parsed = focus?.startsWith("p") ? Number(focus.slice(1)) : 0;
  const index = Number.isInteger(parsed) && parsed >= 0 && parsed < projects.length ? parsed : 0;
  const p = projects[index];
  return (
    <Panel id="arsenal" eyebrow="Arsenal · Projects" title="Side projects">
      <p className="lede">Projects where I owned the whole thing, from problem to deployed product.</p>
      {projects.length > 1 && (
        <div className="cards" role="group" aria-label="Projects">
          {projects.map((proj, i) => (
            <button
              key={proj.title}
              type="button"
              aria-pressed={i === index}
              className="card"
              onPointerEnter={hover}
              onClick={() => {
                audio.click();
                lobby.set({ focus: `p${i}` });
              }}
            >
              <img src={proj.image} alt="" width={160} height={160} loading="lazy" decoding="async" />
              <span>{proj.title.split(",")[0]}</span>
            </button>
          ))}
        </div>
      )}

      {p && (
        <article className="detail" key={p.title}>
          <PinnedOn landmark={projectTargets[index]} />
          <figure className="lb-shot">
            <img src={p.image} alt={p.alt} width={1024} height={1024} decoding="async" />
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
          {p.repo && (
            <a className="btn-line" href={p.repo} target="_blank" rel="noreferrer" onPointerEnter={hover}>
              View code on GitHub<span className="sr-only">: {p.title}</span>
            </a>
          )}
        </article>
      )}

      {shipped.length > 0 && (
        <>
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
                {item.platforms && item.platforms.length > 0 && (
                  <ul className="platforms" aria-label="Platforms">
                    {item.platforms.map((pl) => (
                      <li key={pl}>{pl === "ios" ? "iOS" : pl === "server" ? "Server" : pl === "web" ? "Web" : "Android"}</li>
                    ))}
                  </ul>
                )}
                {item.slug && (
                  <ReportLink slug={item.slug}>
                    Field report<span className="sr-only">: {item.title}</span>
                  </ReportLink>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

function Loadout() {
  const slots = loadoutSlots.flatMap(({ slot, groupIndex }) => {
    const group = skillGroups[groupIndex];
    return group ? [{ slot, group }] : [];
  });
  return (
    <Panel id="loadout" eyebrow="Loadout · Skills" title="Full-stack specialist">
      <p className="lede">{site.description}</p>
      <h4 className="section-label">Classes</h4>
      <Chips items={site.roles} />
      {services.length > 0 && (
        <>
          <h4 className="section-label">Abilities</h4>
          <div className="abilities">
            {services.map((s, i) => (
              <article key={s.label} className="ability">
                <span className="ability-n" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{s.label}</h3>
                  <p>{s.text}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {slots.length > 0 && (
        <>
          <h4 className="section-label">Equipped</h4>
          <div className="slots">
            {slots.map(({ slot, group }) => (
              <section key={slot} className="slot" aria-label={`${slot}: ${group.label}`}>
                <header>
                  <span className="slot-name">{slot}</span>
                  <span className="slot-group">{group.label}</span>
                  <span className="slot-count">{group.items.length}</span>
                </header>
                <Chips items={group.items} />
              </section>
            ))}
          </div>
        </>
      )}
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
                aria-pressed={pin ? pin === focus : undefined}
                aria-label={pin ? `${item.org}, ${item.when}. Show on the map` : undefined}
                onPointerEnter={hover}
                onClick={() => {
                  audio.click();
                  lobby.set({ focus: pin });
                }}
              >
                <span className="season-n" aria-hidden>
                  S{season}
                </span>
                <span>
                  <b>{item.org}</b>
                  <small>{item.when}</small>
                </span>
                {pin && <IconPin width={16} height={16} />}
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

      {education.length > 0 && (
        <>
          <h4 className="section-label">Education</h4>
          <ul className="edu">
            {education.map((e) => (
              <li key={e.degree}>
                <b>{e.degree}</b>
                <span>{e.meta}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {commendations.length > 0 && (
        <>
          <h4 className="section-label">Commendations</h4>
          <div className="lb-quotes">
            {commendations.map((t) => (
              <figure key={t.name} className="lb-quote">
                <blockquote>{t.quote}</blockquote>
                <figcaption>
                  <span className="lb-avatar" aria-hidden>
                    {initialsOf(t)}
                  </span>
                  <span>
                    <b>{t.name}</b>
                    <small>{t.role}</small>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
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
      {nowItems.length > 0 && (
        <>
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
        </>
      )}
      <div className="row-btns">
        {site.resumeHref && (
          <a className="btn-amber" href={site.resumeHref} download onPointerEnter={hover} onClick={() => audio.click()}>
            <IconDownload /> Download résumé
          </a>
        )}
        <button
          type="button"
          className={site.resumeHref ? "btn-line" : "btn-amber"}
          data-opener="intel-comms"
          onPointerEnter={hover}
          onClick={openComms}
        >
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
    <Panel id="comms" role="dialog" eyebrow="Comms · Contact" title="Open a channel" onClose={back} closeLabel="Close contact">
      <p className="lede">The fastest way to reach me is email. I usually reply within a day.</p>
      <div className="channel">
        <span className="channel-label">Email</span>
        <b className="channel-value">{site.email}</b>
        <div className="row-btns">
          <button type="button" className="btn-amber" onPointerEnter={hover} onClick={() => copyEmail(site.email)}>
            <IconCopy /> Copy email
          </button>
          <a className="btn-line" href={`mailto:${site.email}`} onPointerEnter={hover}>
            <IconMail /> Send email
          </a>
        </div>
      </div>
      <div className="channels">
        <a href={site.linkedin} target="_blank" rel="noreferrer" onPointerEnter={hover}>
          <IconLinkedin /> LinkedIn<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a href={site.github} target="_blank" rel="noreferrer" onPointerEnter={hover}>
          <IconGithub /> GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
        {site.resumeHref && (
          <a href={site.resumeHref} download onPointerEnter={hover}>
            <IconDownload /> Résumé (PDF)
          </a>
        )}
      </div>
      <p className="fine">
        {site.status}. Based in {site.location}, open to relocation and remote work.
      </p>
    </Panel>
  );
}

const SCREEN_PANELS: Partial<Record<ScreenId, () => ReactNode>> = {
  missions: Missions,
  arsenal: Arsenal,
  loadout: Loadout,
  career: Career,
  intel: Intel,
};

/** Whether a screen has a panel (tabs point aria-controls at it). */
export const hasPanel = (id: ScreenId) => id in SCREEN_PANELS;

export function ScreenPanel() {
  const screen = useLobby((s) => s.screen);
  const comms = useLobby((s) => s.comms);
  if (comms) return null;
  const C = SCREEN_PANELS[screen];
  return C ? <C key={screen} /> : null;
}

export function BackButton() {
  const screen = useLobby((s) => s.screen);
  const comms = useLobby((s) => s.comms);
  if (screen === "lobby" && !comms) return null;
  return (
    <button type="button" className="back-btn" onClick={back} onPointerEnter={hover}>
      <IconBack /> Back{" "}
      <kbd className="kbd-hint" aria-hidden>
        Esc
      </kbd>
    </button>
  );
}
