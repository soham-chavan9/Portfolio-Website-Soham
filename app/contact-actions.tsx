"use client";

import { useEffect, useRef, useState } from "react";

export default function ContactActions({
  email,
  github,
  linkedin,
  resumeHref,
}: {
  email: string;
  github: string;
  linkedin?: string;
  resumeHref?: string;
}) {
  const [message, setMessage] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setMessage("Email copied");
    } catch {
      // Clipboard blocked: show the address so it can be copied by hand.
      setMessage(email);
    }

    // Restart the timer so a second click does not clear the new message early.
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(""), 2200);
  }

  return (
    <div>
      <div className="btns contact-actions">
        <button className="btn" onClick={copyEmail} type="button">
          Copy email
        </button>
        <a className="btn ghost" href={`mailto:${email}`}>
          Send email
        </a>
        {resumeHref && (
          <a className="btn ghost" href={resumeHref} download>
            Resume (PDF)
          </a>
        )}
        {linkedin && (
          <a className="btn ghost" href={linkedin}>
            LinkedIn
          </a>
        )}
        <a className="btn ghost" href={github}>
          GitHub
        </a>
      </div>
      <p
        className={message ? "toast show" : "toast"}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message}
      </p>
    </div>
  );
}
