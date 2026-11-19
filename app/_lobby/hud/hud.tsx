"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { landmarks, operatorAvatar, rangeLabel, screens } from "@/content/scene";
import { currentRole, currentSchool, highlights, resume, spanLabel } from "@/content/resume";
import { audio } from "../audio";
import {
  cycle,
  deploy,
  emote,
  go,
  openContact,
  setMusic,
  setQuality,
  setReducedMotion,
  setSound,
  toggleSettings,
} from "../actions";
import { focusLandmark, markerMeta, markerScreen } from "../marker-meta";
import { lobby, useLobby } from "../store";
import {
  IconArrow,
  IconExpand,
  IconGear,
  IconGithub,
  IconLinkedin,
  IconMail,
  IconMute,
  IconSound,
  IconWave,
  TabGlyph,
} from "./icons";
import { BackButton, ScreenPanel, hasPanel, hover, restoreFocus, trackOpeners } from "./panels";

function PlayerCard() {
  return (
    <div
      className="player"
      onMouseEnter={() => lobby.set({ hovered: "player" })}
      onMouseLeave={() => lobby.get().hovered === "player" && lobby.set({ hovered: null })}
    >
      <button
        type="button"
        className="player-avatar"
        data-opener="avatar"
        onClick={() => go("contact")}
        onPointerEnter={hover}
        aria-label={`Contact ${resume.name}`}
      >
        <img src={operatorAvatar} alt="" width={128} height={128} decoding="async" />
      </button>
      <div className="player-info">
        <p className="player-name">{resume.name}</p>
        <p className="player-rank">
          <span className="rank-long">
            {resume.headline} · {resume.location}
          </span>
          <span className="rank-short">{resume.headline}</span>
        </p>
        <p className="xp-label">
          {currentSchool.degree}, {currentSchool.school.split(" ")[0]} · {currentSchool.span.end}
        </p>
      </div>
    </div>
  );
}

/** Arrow / Home / End move between tabs and select them (automatic activation). */
function tabKeys(prefix: "lb-tab" | "lb-mtab") {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey || screens.length === 0) return;
    const i = Math.max(0, screens.findIndex((s) => s.id === lobby.get().screen));
    let n: number;
    if (e.key === "ArrowRight") n = (i + 1) % screens.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + screens.length) % screens.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = screens.length - 1;
    else return;
    e.preventDefault();
    const id = screens[n].id;
    go(id);
    document.getElementById(`${prefix}-${id}`)?.focus();
  };
}

function Tabs() {
  const screen = useLobby((s) => s.screen);
  return (
    <nav className="lb-tabs" aria-label="Sections">
      <button type="button" className="kbd-btn" onClick={() => cycle(-1)} aria-label="Previous screen (Q)" onPointerEnter={hover}>
        <kbd aria-hidden>Q</kbd>
      </button>
      <div className="lb-tablist" role="tablist" aria-label="Screens" onKeyDown={tabKeys("lb-tab")}>
        {screens.map((s) => {
          const selected = s.id === screen;
          return (
            <button
              key={s.id}
              id={`lb-tab-${s.id}`}
              type="button"
              role="tab"
              className={`lb-tab${selected ? " is-active" : ""}`}
              aria-selected={selected}
              aria-controls={selected && hasPanel(s.id) ? `lb-panel-${s.id}` : undefined}
              tabIndex={selected ? 0 : -1}
              data-opener={`tab-${s.id}`}
              onPointerEnter={hover}
              onClick={() => go(s.id)}
            >
              <span className="tab-label">{s.label}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="kbd-btn" onClick={() => cycle(1)} aria-label="Next screen (E)" onPointerEnter={hover}>
        <kbd aria-hidden>E</kbd>
      </button>
    </nav>
  );
}

function Meta() {
  const sound = useLobby((s) => s.sound);
  const settings = useLobby((s) => s.settings);
  const [canFullscreen] = useState(() => typeof document !== "undefined" && document.fullscreenEnabled === true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!canFullscreen) return;
    const sync = () => setFullscreen(document.fullscreenElement !== null);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [canFullscreen]);

  return (
    <div className="lb-meta">
      <div className="meta-btns">
        <button
          type="button"
          className="icon-btn"
          onPointerEnter={hover}
          aria-label="Sound"
          aria-pressed={sound}
          onClick={() => setSound(!sound)}
        >
          {sound ? <IconSound /> : <IconMute />}
        </button>
        <button
          type="button"
          id="lb-settings-btn"
          className="icon-btn"
          data-opener="settings"
          onPointerEnter={hover}
          aria-label="Settings"
          aria-haspopup="dialog"
          aria-expanded={settings}
          aria-controls={settings ? "lb-settings" : undefined}
          onClick={() => toggleSettings()}
        >
          <IconGear />
        </button>
        {canFullscreen && (
          <button
            type="button"
            className="icon-btn hide-touch"
            onPointerEnter={hover}
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={() => {
              audio.click();
              const req = document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen();
              req.catch(() => {});
            }}
          >
            <IconExpand />
          </button>
        )}
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
  pressed,
  onToggle,
}: {
  label: string;
  value: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="setting"
      aria-pressed={pressed}
      onPointerEnter={hover}
      onClick={() => {
        audio.click();
        onToggle();
      }}
    >
      <span>{label}</span>
      <b>{value}</b>
    </button>
  );
}

function SettingsDialog() {
  const sound = useLobby((s) => s.sound);
  const music = useLobby((s) => s.music);
  const quality = useLobby((s) => s.quality);
  const reduced = useLobby((s) => s.reducedMotion);
  const ref = useRef<HTMLDivElement>(null);

  // Focus moves in on open and back to the gear on close; a press anywhere
  // outside (including the city) dismisses it like any popover.
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true });
    const dismiss = (e: Event) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("#lb-settings, #lb-settings-btn")) return;
      lobby.set({ settings: false });
    };
    document.addEventListener("pointerdown", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss, true);
      restoreFocus();
    };
  }, []);

  return (
    <div ref={ref} id="lb-settings" className="settings" role="dialog" aria-modal={false} aria-labelledby="lb-settings-title">
      <p className="lb-eyebrow" id="lb-settings-title">
        Settings
      </p>
      <SettingRow label="Sound effects" value={sound ? "On" : "Off"} pressed={sound} onToggle={() => setSound(!sound)} />
      <SettingRow label="Lobby music" value={music ? "On" : "Off"} pressed={music} onToggle={() => setMusic(!music)} />
      <SettingRow
        label="Graphics"
        value={quality === "high" ? "High" : "Performance"}
        pressed={quality === "high"}
        onToggle={() => setQuality(quality === "high" ? "low" : "high")}
      />
      <SettingRow
        label="Camera motion"
        value={reduced ? "Reduced" : "Full"}
        pressed={!reduced}
        onToggle={() => setReducedMotion(!reduced)}
      />
      <Link className="setting" href="/classic" onPointerEnter={hover}>
        <span>Classic view</span>
        <b>Plain page</b>
      </Link>
    </div>
  );
}

function Settings() {
  const open = useLobby((s) => s.settings);
  return open ? <SettingsDialog /> : null;
}

function Brief() {
  return (
    <aside className="banners" aria-label="Highlights">
      <div className="banner banner-brief">
        <span className="banner-kicker">
          <i className="live" aria-hidden /> Highlights
        </span>
        <dl className="brief-stats">
          {highlights.map((h) => (
            <div key={h.label} title={`${h.value} ${h.label}`}>
              <dt>{h.label}</dt>
              <dd>{h.value}</dd>
            </div>
          ))}
        </dl>
        <div className="brief-cta">
          <button type="button" className="brief-primary" data-opener="brief-contact" onPointerEnter={hover} onClick={openContact}>
            Contact <IconArrow width={14} height={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function ModeCard() {
  return (
    <aside className="mode" aria-label="Most recent role">
      <div className="mode-card">
        <p className="mode-kicker">Most recent role</p>
        <p className="mode-title">{currentRole.org}</p>
        <p className="mode-meta">{currentRole.title}</p>
        <p className="mode-target">
          {currentRole.location} · {spanLabel(currentRole.span)}
        </p>
      </div>
      <button
        type="button"
        className="deploy"
        data-opener="deploy"
        aria-label="Open Experience"
        onPointerEnter={hover}
        onClick={deploy}
      >
        <span>Experience</span>
        <small className="deploy-sub" aria-hidden>
          View work history
        </small>
        <kbd className="kbd-hint" aria-hidden>
          Enter
        </kbd>
      </button>
      <div className="mode-alt">
        <button type="button" data-opener="alt-projects" onPointerEnter={hover} onClick={() => go("projects")}>
          Projects
        </button>
        <button type="button" data-opener="alt-skills" onPointerEnter={hover} onClick={() => go("skills")}>
          Skills
        </button>
        <button type="button" className="show-mobile" data-opener="alt-contact" onClick={openContact}>
          Contact
        </button>
      </div>
    </aside>
  );
}

function Dock() {
  const touch = useLobby((s) => s.touch);
  return (
    <div className="dock">
      {!touch && (
        <p className="hints" aria-hidden>
          <span><kbd>Q</kbd><kbd>E</kbd> Tabs</span>
          <span><kbd>C</kbd> Contact</span>
          <span><kbd>G</kbd> Wave</span>
          <span>Drag to look</span>
        </p>
      )}
      <div className="dock-row">
        <button type="button" className="icon-btn" onPointerEnter={hover} onClick={emote} aria-label="Emote: wave (G)">
          <IconWave />
        </button>
        <a className="icon-btn" href={resume.github} target="_blank" rel="noreferrer" onPointerEnter={hover} aria-label="GitHub (opens in a new tab)">
          <IconGithub />
        </a>
        <a className="icon-btn" href={resume.linkedin} target="_blank" rel="noreferrer" onPointerEnter={hover} aria-label="LinkedIn (opens in a new tab)">
          <IconLinkedin />
        </a>
        <button type="button" className="comms-btn" data-opener="dock-contact" onPointerEnter={hover} onClick={openContact}>
          <IconMail /> Contact
        </button>
      </div>
    </div>
  );
}

function Scope() {
  const screen = useLobby((s) => s.screen);
  const focus = useLobby((s) => s.focus);
  const inset = useLobby((s) => s.panelInset);
  if (screen !== "experience" && screen !== "projects") return null;
  const landmark = focusLandmark(screen, focus);
  if (!landmark) return null;
  return (
    <div className="scope" style={{ right: inset }} aria-hidden>
      <span className="scope-corner tl" />
      <span className="scope-corner tr" />
      <span className="scope-corner bl" />
      <span className="scope-corner br" />
      <span className="scope-cross" />
      <p className="scope-read">
        <b>{landmarks[landmark].name}</b>
        <span>Range {rangeLabel(landmark)}</span>
      </p>
    </div>
  );
}

/**
 * Clickable labels for the in-world markers, glued to their 3D anchors.
 * Pointer shortcuts only: every marker has an equivalent control in the open
 * panel, so they stay out of the tab order and the accessibility tree.
 */
function MarkerLabels() {
  const screen = useLobby((s) => s.screen);
  const focus = useLobby((s) => s.focus);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const list = markerMeta.filter((m) => m.screen === screen);
  const live = list.length > 0;

  useEffect(() => {
    if (!live) return;
    let raf = 0;
    const loop = () => {
      for (const m of markerMeta) {
        if (m.screen !== screen) continue;
        const el = refs.current[m.id];
        const p = markerScreen[m.id];
        if (!el || !p) continue;
        // Keep the whole label on screen when its anchor sits near an edge.
        const half = el.offsetWidth / 2;
        const vw = el.parentElement?.clientWidth ?? window.innerWidth;
        const x = Math.min(Math.max(p.x, half + 12), vw - half - 12);
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        el.style.visibility = p.on ? "visible" : "hidden";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [screen, live]);

  if (!live) return null;
  return (
    <div className="mk-layer" aria-hidden>
      {list.map((m) => (
        <button
          key={m.id}
          ref={(el) => {
            refs.current[m.id] = el;
          }}
          type="button"
          tabIndex={-1}
          className={`mk-btn${focus === m.id ? " is-selected" : ""}`}
          onPointerEnter={hover}
          onClick={() => {
            audio.click();
            lobby.set({ focus: m.id });
          }}
        >
          <span className="mk-code">{m.code}</span>
          <span className="mk-title">{m.title}</span>
          <span className="mk-sub">{m.sub}</span>
        </button>
      ))}
    </div>
  );
}

function MobileNav() {
  const screen = useLobby((s) => s.screen);
  return (
    <nav className="mnav" aria-label="Sections">
      <div className="mnav-list" role="tablist" aria-label="Screens" onKeyDown={tabKeys("lb-mtab")}>
        {screens.map((s) => {
          const selected = s.id === screen;
          return (
            <button
              key={s.id}
              id={`lb-mtab-${s.id}`}
              type="button"
              role="tab"
              className={selected ? "is-active" : undefined}
              aria-selected={selected}
              aria-controls={selected && hasPanel(s.id) ? `lb-panel-${s.id}` : undefined}
              tabIndex={selected ? 0 : -1}
              data-opener={`mtab-${s.id}`}
              onClick={() => go(s.id)}
            >
              <TabGlyph id={s.id} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** One persistent live region; the keyed span re-announces repeat messages. */
function Toast() {
  const text = useLobby((s) => s.toast);
  const open = useLobby((s) => s.toastOpen);
  const id = useLobby((s) => s.toastId);
  return (
    <p className={`lb-toast${open ? " show" : ""}`} role="status" aria-live="polite">
      {text && <span key={id}>{text}</span>}
    </p>
  );
}

export default function Hud() {
  const phase = useLobby((s) => s.phase);
  const screen = useLobby((s) => s.screen);
  useEffect(trackOpeners, []);
  if (phase !== "lobby") return null;
  const inLobby = screen === "home";
  return (
    <div className={`hud ${inLobby ? "is-lobby" : "is-screen"}`}>
      <h1 className="sr-only">{resume.name}</h1>
      <MarkerLabels />
      <header className="hud-top">
        <PlayerCard />
        <Tabs />
        <Meta />
      </header>
      {inLobby && (
        <>
          <Brief />
          <ModeCard />
          <footer className="hud-bottom">
            <Dock />
          </footer>
        </>
      )}
      <Scope />
      <ScreenPanel />
      <BackButton />
      <Settings />
      <MobileNav />
      <Toast />
    </div>
  );
}
