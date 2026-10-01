"use client";

import { useState } from "react";

export default function ContactActions({
  email,
  github,
}: {
  email: string;
  github: string;
}) {
  const [message, setMessage] = useState("");

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setMessage("Email copied");
    } catch {
      setMessage(email);
    }

    window.setTimeout(() => setMessage(""), 2200);
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
