"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  degreeProgress,
  landmarks,
  missionTargets,
  operatorAvatar,
  projectTargets,
  rangeLabel,
  screens,
  ticker,
  viewpoint,
} from "@/content/lobby";
import { featuredWork, testimonials } from "@/content/portfolio";
import { writeups } from "@/content/writeups";
import { site } from "@/content/site";
import { audio } from "../audio";
import {
  cycle,
  deploy,
  emote,
  go,
  openComms,
  rememberScreen,
  setMusic,
  setQuality,
  setSound,
} from "../actions";
import { markerMeta, markerScreen } from "../marker-meta";
import { lobby, useLobby } from "../store";
import { useNycClock } from "./boot";
import {
  IconArrow,
  IconDownload,
  IconExpand,
  IconGear,
  IconGithub,
  IconLinkedin,
  IconMail,
  IconMute,
  IconSound,
  IconWave,
  RankChevrons,
  TabGlyph,
} from "./icons";
import { BackButton, CommsPanel, ScreenPanel } from "./panels";

const hover = () => audio.hover();

function PlayerCard() {
  const [xp, setXp] = useState(0);
  useEffect(() => setXp(degreeProgress()), []);
  return (
    <div
      className="player"
      onMouseEnter={() => lobby.set({ hovered: "player" })}
      onMouseLeave={() => lobby.get().hovered === "player" && lobby.set({ hovered: null })}
    >
      <button type="button" className="player-avatar" onClick={() => go("intel")} onMouseEnter={hover} aria-label="Open Intel: about Soham">
        <img src={operatorAvatar} alt="" width={128} height={128} />
      </button>
      <div className="player-info">
        <p className="player-name">
          <span className="clan">[NEU]</span> {site.name}
        </p>
        <p className="player-rank">
          <RankChevrons width={16} height={16} />
          Team lead · {site.navHeadline}
        </p>
        <div className="xp" title={`M.S. Information Systems, ${Math.round(xp * 100)}% complete`}>
          <div className="xp-bar">
            <span style={{ transform: `scaleX(${xp})` }} />
          </div>
          <span className="xp-label">
            M.S. Northeastern <b>{Math.round(xp * 100)}%</b>
          </span>
        </div>
      </div>
    </div>
  );
}

function Tabs() {
  const screen = useLobby((s) => s.screen);
  const comms = useLobby((s) => s.comms);
  return (
    <nav className="lb-tabs" aria-label="Lobby">
      <button type="button" className="kbd-btn" onClick={() => cycle(-1)} aria-label="Previous tab" onMouseEnter={hover}>
        <kbd>Q</kbd>
      </button>
      <ul>
        {screens.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="lb-tab"
              aria-current={s.id === screen && !comms ? "page" : undefined}
              onMouseEnter={hover}
              onClick={() => go(s.id)}
            >
              <span className="tab-label">{s.label}</span>
              <span className="tab-plain">{s.plain}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="kbd-btn" onClick={() => cycle(1)} aria-label="Next tab" onMouseEnter={hover}>
        <kbd>E</kbd>
      </button>
    </nav>
  );
}

function Meta() {
  const sound = useLobby((s) => s.sound);
  const settings = useLobby((s) => s.settings);
  return (
    <div className="lb-meta">
      <ul className="lb-stats" aria-label="Highlights">
        {site.stats.map((st) => (
          <li key={st.label} title={st.label}>
            <b>{st.value}</b>
            <span>{st.label.split(" ").slice(0, 2).join(" ")}</span>
            <span className="sr-only">{st.label}</span>
          </li>
        ))}
      </ul>
      <div className="meta-btns">
        <button
          type="button"
          className="icon-btn"
          onMouseEnter={hover}
          aria-label={sound ? "Mute sound" : "Turn sound on"}
          aria-pressed={sound}
          onClick={() => setSound(!sound)}
        >
          {sound ? <IconSound /> : <IconMute />}
        </button>
        <button
          type="button"
          className="icon-btn"
          onMouseEnter={hover}
          aria-label="Settings"
          aria-expanded={settings}
          onClick={() => {
            audio.click();
            lobby.set({ settings: !settings });
          }}
        >
          <IconGear />
        </button>
        <button
          type="button"
          className="icon-btn hide-touch"
          onMouseEnter={hover}
          aria-label="Toggle fullscreen"
          onClick={() => {
            audio.click();
            if (document.fullscreenElement) void document.exitFullscreen();
            else void document.documentElement.requestFullscreen?.().catch(() => {});
          }}
        >
          <IconExpand />
        </button>
      </div>
    </div>
  );
}

function Settings() {
  const open = useLobby((s) => s.settings);
  const sound = useLobby((s) => s.sound);
  const music = useLobby((s) => s.music);
  const quality = useLobby((s) => s.quality);
  const reduced = useLobby((s) => s.reducedMotion);
  if (!open) return null;
  const Row = ({ label, value, onClick, pressed }: { label: string; value: string; onClick: () => void; pressed: boolean }) => (
    <button type="button" className="setting" aria-pressed={pressed} onMouseEnter={hover} onClick={() => { audio.click(); onClick(); }}>
      <span>{label}</span>
      <b>{value}</b>
    </button>
  );
  return (
    <div className="settings" role="dialog" aria-label="Settings">
      <p className="lb-eyebrow">Settings</p>
      <Row label="Sound effects" value={sound ? "On" : "Off"} pressed={sound} onClick={() => setSound(!sound)} />
      <Row label="Lobby music" value={music ? "On" : "Off"} pressed={music} onClick={() => setMusic(!music)} />
      <Row
        label="Graphics"
        value={quality === "high" ? "High" : "Performance"}
        pressed={quality === "high"}
        onClick={() => setQuality(quality === "high" ? "low" : "high")}
      />
      <Row label="Camera motion" value={reduced ? "Reduced" : "Full"} pressed={!reduced} onClick={() => lobby.set({ reducedMotion: !reduced })} />
      <Link className="setting" href="/classic" onMouseEnter={hover}>
        <span>Classic view</span>
        <b>Plain page</b>
      </Link>
    </div>
  );
}

function Banners() {
  return (
    <aside className="banners" aria-label="Updates">
      <button type="button" className="banner banner-status" onMouseEnter={hover} onClick={openComms}>
        <span className="banner-kicker">
          <i className="live" aria-hidden /> Open for recruitment
        </span>
        <b>{site.status}</b>
        <span className="banner-cta">
          Open comms <IconArrow width={14} height={14} />
        </span>
      </button>
      <div className="banner">
        <span className="banner-kicker">Field reports · {writeups.length} new</span>
        <ul className="reports">
          {writeups.map((w) => (
            <li key={w.slug}>
              <Link href={`/work/${w.slug}`} onClick={rememberScreen} onMouseEnter={hover}>
                {w.title}
                <IconArrow width={14} height={14} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <a className="banner banner-drop" href={site.resumeHref} download onMouseEnter={hover} onClick={() => audio.chime()}>
        <span className="banner-kicker">Supply drop</span>
        <b>Résumé dossier</b>
        <span className="banner-cta">
          <IconDownload width={14} height={14} /> PDF · one page
        </span>
      </a>
    </aside>
  );
}

function ModeCard() {
  const target = missionTargets[featuredWork.systems[0].id];
  return (
    <aside className="mode" aria-label="Featured operation">
      <div className="mode-card">
        <p className="mode-kicker">Featured operation</p>
        <p className="mode-title">{featuredWork.title}</p>
        <p className="mode-meta">
          {featuredWork.systems.length} missions · Team lead · {featuredWork.facts[1].value}
        </p>
        <p className="mode-target">
          Target in view: {landmarks[target].name} · {rangeLabel(target)}
        </p>
      </div>
      <button type="button" className="deploy" onMouseEnter={hover} onClick={deploy}>
        <span>Deploy</span>
        <kbd className="kbd-hint">Enter</kbd>
      </button>
      <div className="mode-alt">
        <button type="button" onMouseEnter={hover} onClick={() => go("arsenal")}>
          Arsenal
        </button>
        <button type="button" onMouseEnter={hover} onClick={() => go("career")}>
          Career
        </button>
        <button type="button" className="show-mobile" onClick={openComms}>
          Comms
        </button>
      </div>
    </aside>
  );
}

function Squad() {
  return (
    <button type="button" className="squad" onMouseEnter={hover} onClick={() => go("career")}>
      <span className="squad-kicker">Squad · {testimonials.length} commendations</span>
      <span className="squad-row">
        {testimonials.map((t) => (
          <span key={t.name} className="squad-member">
            <span className="lb-avatar" aria-hidden>
              {t.initials}
            </span>
            <span>
              <b>{t.name}</b>
              <small>{t.role}</small>
            </span>
          </span>
        ))}
      </span>
    </button>
  );
}

function Ticker() {
  const time = useNycClock();
  const items = [...ticker, ...ticker];
  return (
    <div className="ticker-wrap">
      <p className="locline">
        <i className="live" aria-hidden />
        {viewpoint.name} · {viewpoint.lat.toFixed(4)}° N {Math.abs(viewpoint.lon).toFixed(4)}° W
        {time && <> · {time} ET</>}
      </p>
      <div className="ticker" aria-hidden>
        <div className="ticker-track">
          {items.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommsDock() {
  const touch = useLobby((s) => s.touch);
  return (
    <div className="dock">
      {!touch && (
        <p className="hints" aria-hidden>
          <span><kbd>Q</kbd><kbd>E</kbd> Tabs</span>
          <span><kbd>G</kbd> Emote</span>
          <span><kbd>M</kbd> Mute</span>
          <span>Drag to look</span>
        </p>
      )}
      <div className="dock-row">
        <button type="button" className="icon-btn" onMouseEnter={hover} onClick={emote} aria-label="Emote: wave">
          <IconWave />
        </button>
        <a className="icon-btn" href={site.github} target="_blank" rel="noreferrer" onMouseEnter={hover} aria-label="GitHub">
          <IconGithub />
        </a>
        <a className="icon-btn" href={site.linkedin} target="_blank" rel="noreferrer" onMouseEnter={hover} aria-label="LinkedIn">
          <IconLinkedin />
        </a>
        <button type="button" className="comms-btn" onMouseEnter={hover} onClick={openComms}>
          <IconMail /> Comms
        </button>
      </div>
    </div>
  );
}

function Scope() {
  const screen = useLobby((s) => s.screen);
  const focus = useLobby((s) => s.focus);
  const inset = useLobby((s) => s.panelInset);
  const comms = useLobby((s) => s.comms);
  if (comms || (screen !== "missions" && screen !== "arsenal")) return null;
  const landmark =
    screen === "missions"
      ? missionTargets[focus ?? featuredWork.systems[0].id]
      : projectTargets[Number(focus?.slice(1) ?? 0)];
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

/** Clickable labels for the in-world markers, glued to their 3D anchors. */
function MarkerLabels() {
  const screen = useLobby((s) => s.screen);
  const focus = useLobby((s) => s.focus);
  const comms = useLobby((s) => s.comms);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      for (const m of markerMeta) {
        const el = refs.current[m.id];
        const p = markerScreen[m.id];
        if (!el || !p) continue;
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
        el.style.visibility = p.on ? "visible" : "hidden";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  const list = markerMeta.filter((m) => m.screen === screen);
  if (comms || list.length === 0) return null;
  return (
    <div className="mk-layer">
      {list.map((m) => (
        <button
          key={m.id}
          ref={(el) => {
            refs.current[m.id] = el;
          }}
          type="button"
          className={`mk-btn ${focus === m.id ? "is-selected" : ""}`}
          onMouseEnter={hover}
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
    <nav className="mnav" aria-label="Lobby">
      {screens.map((s) => (
        <button key={s.id} type="button" aria-current={s.id === screen ? "page" : undefined} onClick={() => go(s.id)}>
          <TabGlyph id={s.id} />
          <span>{s.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Toast() {
  const text = useLobby((s) => s.toast);
  const id = useLobby((s) => s.toastId);
  return (
    <p className={`lb-toast ${text ? "show" : ""}`} role="status" aria-live="polite" key={id}>
      {text}
    </p>
  );
}

export default function Hud() {
  const phase = useLobby((s) => s.phase);
  const screen = useLobby((s) => s.screen);
  const comms = useLobby((s) => s.comms);
  if (phase !== "lobby") return null;
  const inLobby = screen === "lobby" && !comms;
  return (
    <div className={`hud ${inLobby ? "is-lobby" : "is-screen"}`}>
      <MarkerLabels />
      <header className="hud-top">
        <PlayerCard />
        <Tabs />
        <Meta />
      </header>
      {inLobby && (
        <>
          <Banners />
          <ModeCard />
          <footer className="hud-bottom">
            <Squad />
            <Ticker />
            <CommsDock />
          </footer>
        </>
      )}
      <Scope />
      <ScreenPanel />
      <CommsPanel />
      <BackButton />
      <Settings />
      <MobileNav />
      <Toast />
    </div>
  );
}
