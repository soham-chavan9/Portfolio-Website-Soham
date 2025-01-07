import React from 'react';
import '../styles/Contact.css';


function Contact() {
  return (
    <section id="contact" className="contact">
      <h2>Contact Me</h2>
      <p>Feel free to reach out to me at <a href="mailto:yourname@example.com">yourname@example.com</a></p>
      <ul className="social-links">
        <li><a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a></li>
        <li><a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a></li>
        <li><a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a></li>
      </ul>
    </section>
  );
}

export default Contact;
