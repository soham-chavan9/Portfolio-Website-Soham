"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { featuredWork } from "@/content/portfolio";

export default function FeaturedWork() {
  const [activeId, setActiveId] = useState(featuredWork.systems[0].id);
  const [activeStep, setActiveStep] = useState(0);

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

      {featuredWork.systems.map((system) => (
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

          {system.steps ? (
            <div className="flow" aria-label={`${system.label} flow`}>
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
          ) : (
            <dl className="system-facts">
              {system.facts?.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ))}
    </article>
  );
}
