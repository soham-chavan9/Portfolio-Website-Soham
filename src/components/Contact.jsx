import React from 'react';
import '../styles/Contact.css';


function Contact() {
  return (
    <section id="contact" className="contact">
      <h2>Want to reach out to me ?</h2>
      <p>Feel free to reach out to me at <a href="chavansoham9@gmail.com">chavansoham9@gmail.com</a></p>
      <ul className="social-links">
        <li><a href="https://www.linkedin.com/in/soham-chavan9/" target="_blank" rel="noreferrer">LinkedIn</a></li>
        <li><a href="https://github.com/soham-chavan9" target="_blank" rel="noreferrer">GitHub</a></li>
        <li><a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a></li>
      </ul>
    </section>
  );
}

export default Contact;
