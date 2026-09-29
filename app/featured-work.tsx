"use client";

import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { featuredWork } from "@/content/portfolio";

export default function FeaturedWork() {
  const [activeId, setActiveId] = useState(featuredWork.systems[0].id);
  const [activeStep, setActiveStep] = useState(0);

  const activeIndex = featuredWork.systems.findIndex((s) => s.id === activeId);
  const active = featuredWork.systems[activeIndex] ?? featuredWork.systems[0];
  const activeDetail = useMemo(
    () => active.steps?.[activeStep]?.detail,
    [active.steps, activeStep]
  );

  function select(id: string) {
    setActiveId(id);
    setActiveStep(0);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    const direction =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

    if (!direction) return;

    event.preventDefault();
    const next =
      featuredWork.systems[
        (i + direction + featuredWork.systems.length) %
          featuredWork.systems.length
      ];
    select(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <article className="feature">
      <div className="feature-top">
        <div>
          <p className="eyebrow">Featured work</p>
          <h3>{featuredWork.title}</h3>
          <p>{featuredWork.role}</p>
        </div>
        <dl className="fact-grid">
          {featuredWork.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="tabs" role="tablist" aria-label="OurFreedom systems">
        {featuredWork.systems.map((system, i) => (
          <button
            aria-controls={`panel-${system.id}`}
            aria-selected={system.id === active.id}
            className="tab"
            id={`tab-${system.id}`}
            key={system.id}
            onClick={() => select(system.id)}
            onKeyDown={(event) => onTabKeyDown(event, i)}
            role="tab"
            tabIndex={system.id === active.id ? 0 : -1}
            type="button"
          >
            {system.label}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`tab-${active.id}`}
        className="panel"
        id={`panel-${active.id}`}
        role="tabpanel"
      >
        <div className="panel-copy">
          <h4>{active.title}</h4>
          <p>{active.intro}</p>
          <ul>
            {active.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>

        {active.steps ? (
          <div className="flow" aria-label={`${active.label} flow`}>
            <ol className="flow-steps">
              {active.steps.map((step, i) => (
                <li key={step.title}>
                  <button
                    aria-pressed={i === activeStep}
                    onClick={() => setActiveStep(i)}
                    type="button"
                  >
                    <span className="step-number">{i + 1}</span>
                    <span>
                      <b>{step.title}</b>
                      <small>{step.note}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="flow-detail" aria-live="polite">
              {activeDetail}
            </p>
          </div>
        ) : (
          <dl className="system-facts">
            {active.facts?.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
