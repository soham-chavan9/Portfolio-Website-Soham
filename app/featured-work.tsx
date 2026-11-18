"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { featuredWork, type FeaturedSystem } from "@/content/portfolio";

// Typed as the shared shape so systems can be added or removed in content
// without this component assuming which fields each one carries.
const systems: readonly FeaturedSystem[] = featuredWork.systems;

export default function FeaturedWork() {
  const [activeId, setActiveId] = useState(systems[0]?.id ?? "");
  const [activeStep, setActiveStep] = useState(0);

  function select(id: string) {
    setActiveId(id);
    setActiveStep(0);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    const last = systems.length - 1;
    let target: number;
    if (event.key === "ArrowRight") target = i === last ? 0 : i + 1;
    else if (event.key === "ArrowLeft") target = i === 0 ? last : i - 1;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = last;
    else return;

    event.preventDefault();
    const next = systems[target];
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

      {systems.length > 0 && (
        <div
          className="tabs"
          role="tablist"
          aria-label={`${featuredWork.title} systems`}
        >
          {systems.map((system, i) => (
            <button
              aria-controls={`panel-${system.id}`}
              aria-selected={system.id === activeId}
              className="tab"
              id={`tab-${system.id}`}
              key={system.id}
              onClick={() => select(system.id)}
              onKeyDown={(event) => onTabKeyDown(event, i)}
              role="tab"
              tabIndex={system.id === activeId ? 0 : -1}
              type="button"
            >
              {system.label}
            </button>
          ))}
        </div>
      )}

      {systems.map((system) => (
        <div
          aria-labelledby={`tab-${system.id}`}
          className="panel"
          hidden={system.id !== activeId}
          id={`panel-${system.id}`}
          key={system.id}
          role="tabpanel"
          tabIndex={0}
        >
          <div className="panel-copy">
            <h4>{system.title}</h4>
            <p>{system.intro}</p>
            <ul>
              {system.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

          {system.steps && system.steps.length > 0 ? (
            <div
              className="flow"
              role="group"
              aria-label={`${system.label} flow`}
            >
              <ol className="flow-steps">
                {system.steps.map((step, i) => (
                  <li key={step.title}>
                    <button
                      aria-controls={`detail-${system.id}-${i}`}
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
              <div aria-live="polite" aria-atomic="true">
                {system.steps.map((step, i) => (
                  <p
                    className="flow-detail"
                    hidden={i !== activeStep}
                    id={`detail-${system.id}-${i}`}
                    key={step.title}
                  >
                    {step.detail}
                  </p>
                ))}
              </div>
            </div>
          ) : system.facts && system.facts.length > 0 ? (
            <dl className="system-facts">
              {system.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ))}
    </article>
  );
}
