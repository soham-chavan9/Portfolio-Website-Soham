"use client";

import { useEffect, useLayoutEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { experiencePins, projectPins, screens, type ScreenId } from "@/content/scene";
import { resume, spanLabel, type Bullet, type Role } from "@/content/resume";
import { audio } from "../audio";
import { back, copyEmail } from "../actions";
import { isLandmark, markerCode, pinLabel } from "../marker-meta";
import { lobby, useLobby } from "../store";
import {
  IconBack,
  IconCheck,
  IconClose,
  IconCopy,
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

// ---------------------------------------------------------------- Shell --

/** Panel shell: reports its footprint so the 3D camera re-centers beside it. */
function Panel({
  id,
  eyebrow,
  title,
  children,
  role = "tabpanel",
  onClose = back,
  closeLabel = "Back to home",
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

/** "02 · Experience": the tab's position, so the eyebrow doubles as a map. */
function eyebrowFor(id: ScreenId) {
  const i = screens.findIndex((x) => x.id === id);
  const label = screens[i]?.label ?? id;
  return `${String(i + 1).padStart(2, "0")} · ${label}`;
}

function BulletList({ bullets }: { bullets: Bullet[] }) {
  if (bullets.length === 0) return null;
  return (
    <ul className="objectives">
      {bullets.map((b) => (
        <li key={b.id}>
          <IconCheck width={15} height={15} />
          <span>{b.text}</span>
        </li>
      ))}
    </ul>
  );
}

function RoleHead({ role }: { role: Role }) {
  return (
    <>
      <h3>{role.org}</h3>
      <p className="sub">
        {role.title} · {role.location} · {spanLabel(role.span)}
      </p>
    </>
  );
}

/** A role whose bullets are pinned on towers: pick one to fly the camera to it. */
function PinnedRole({ role }: { role: Role }) {
  const focus = useLobby((s) => s.focus);
  const pinned = role.bullets.filter((b) => isLandmark(experiencePins[b.id]));
  const rest = role.bullets.filter((b) => !isLandmark(experiencePins[b.id]));
  const active = pinned.find((b) => b.id === focus) ?? pinned[0];
  return (
    <section className="lb-role" aria-labelledby={`role-${role.id}`}>
      <h3 id={`role-${role.id}`}>{role.org}</h3>
      <p className="sub">
        {role.title} · {role.location} · {spanLabel(role.span)}
      </p>
      <BulletList bullets={rest} />
      {pinned.length > 0 && (
        <div className="list" role="group" aria-label={`${role.org} work`}>
          {pinned.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={b.id === active?.id}
              className="list-item"
              onPointerEnter={hover}
              onClick={() => {
                audio.click();
                lobby.set({ focus: b.id });
              }}
            >
              <span className="list-code">{markerCode("E", i)}</span>
              <span className="list-name">{b.label}</span>
              {b.highlight && <span className="list-status">{b.highlight.value}</span>}
            </button>
          ))}
        </div>
      )}
      {active && (
        <article className="detail" key={active.id}>
          <PinnedOn landmark={experiencePins[active.id]} />
          <h4>{active.label}</h4>
          <p>{active.text}</p>
        </article>
      )}
    </section>
  );
}

function Experience() {
  return (
    <Panel id="experience" eyebrow={eyebrowFor("experience")} title="Experience">
      {resume.experience.map((role) =>
        role.bullets.some((b) => isLandmark(experiencePins[b.id])) ? (
          <PinnedRole key={role.id} role={role} />
        ) : (
          <section key={role.id} className="lb-role" aria-label={role.org}>
            <RoleHead role={role} />
            <BulletList bullets={role.bullets} />
          </section>
        ),
      )}
    </Panel>
  );
}

function Projects() {
  const focus = useLobby((s) => s.focus);
  const list = resume.projects;
  const p = list.find((x) => x.id === focus) ?? list[0];
  return (
    <Panel id="projects" eyebrow={eyebrowFor("projects")} title="Projects">
      {list.length > 1 && (
        <div className="cards" role="group" aria-label="Projects">
          {list.map((proj) => (
            <button
              key={proj.id}
              type="button"
              aria-pressed={proj.id === p?.id}
              className="card"
              onPointerEnter={hover}
              onClick={() => {
                audio.click();
                lobby.set({ focus: proj.id });
              }}
            >
              <img src={proj.image} alt="" width={160} height={160} loading="lazy" decoding="async" />
              <span>{proj.name}</span>
            </button>
          ))}
        </div>
      )}

      {p && (
        <article className="detail" key={p.id}>
          <PinnedOn landmark={projectPins[p.id]} />
          <figure className="lb-shot">
            <img src={p.image} alt={p.alt} width={1024} height={1024} decoding="async" />
          </figure>
          <h3>{p.name}</h3>
          <p className="sub">
            {p.subtitle} · {spanLabel(p.span)}
          </p>
          <BulletList bullets={p.bullets} />
          <Chips items={p.stack} />
          <a className="btn-line" href={p.repo} target="_blank" rel="noreferrer" onPointerEnter={hover}>
            <IconGithub /> View code on GitHub<span className="sr-only">: {p.name} (opens in a new tab)</span>
          </a>
        </article>
      )}
    </Panel>
  );
}

function Skills() {
  return (
    <Panel id="skills" eyebrow={eyebrowFor("skills")} title="Technical skills">
      <div className="slots">
        {resume.skills.map((group) => (
          <section key={group.id} className="slot" aria-label={group.label}>
            <header>
              <span className="slot-group">{group.label}</span>
              <span className="slot-count">{group.items.length}</span>
            </header>
            <Chips items={group.items} />
          </section>
        ))}
      </div>
    </Panel>
  );
}

function Education() {
  const focus = useLobby((s) => s.focus);
  return (
    <Panel id="education" eyebrow={eyebrowFor("education")} title="Education">
      <ol className="seasons">
        {resume.education.map((e) => (
          <li key={e.id} className={e.id === focus ? "on" : ""}>
            <button
              type="button"
              className="season-head"
              aria-pressed={e.id === focus}
              aria-label={`${e.school}, ${e.location}. Show on the map`}
              onPointerEnter={hover}
              onClick={() => {
                audio.click();
                lobby.set({ focus: e.id });
              }}
            >
              <span>
                <b>{e.school}</b>
                <small>
                  {e.location} · {spanLabel(e.span)}
                </small>
              </span>
              <IconPin width={16} height={16} />
            </button>
            <h3>{e.degree}</h3>
            {e.coursework.length > 0 && (
              <>
                <h4>Coursework</h4>
                <Chips items={e.coursework} />
              </>
            )}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function Contact() {
  return (
    <Panel id="contact" eyebrow={eyebrowFor("contact")} title="Contact">
      <div className="channel">
        <span className="channel-label">Email</span>
        <b className="channel-value">{resume.email}</b>
        <div className="row-btns">
          <button type="button" className="btn-amber" onPointerEnter={hover} onClick={() => copyEmail(resume.email)}>
            <IconCopy /> Copy email
          </button>
          <a className="btn-line" href={`mailto:${resume.email}`} onPointerEnter={hover}>
            <IconMail /> Send email
          </a>
        </div>
      </div>
      <div className="channels">
        <a href={resume.linkedin} target="_blank" rel="noreferrer" onPointerEnter={hover}>
          <IconLinkedin /> LinkedIn<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <a href={resume.github} target="_blank" rel="noreferrer" onPointerEnter={hover}>
          <IconGithub /> GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <p className="fine">{resume.location}</p>
    </Panel>
  );
}

const SCREEN_PANELS: Partial<Record<ScreenId, () => ReactNode>> = {
  experience: Experience,
  projects: Projects,
  skills: Skills,
  education: Education,
  contact: Contact,
};

/** Whether a screen has a panel (tabs point aria-controls at it). */
export const hasPanel = (id: ScreenId) => id in SCREEN_PANELS;

export function ScreenPanel() {
  const screen = useLobby((s) => s.screen);
  const C = SCREEN_PANELS[screen];
  return C ? <C key={screen} /> : null;
}

export function BackButton() {
  const screen = useLobby((s) => s.screen);
  if (screen === "home") return null;
  return (
    <button type="button" className="back-btn" onClick={back} onPointerEnter={hover}>
      <IconBack /> Back{" "}
      <kbd className="kbd-hint" aria-hidden>
        Esc
      </kbd>
    </button>
  );
}
