import React from 'react';
import '../styles/Hero.css';
import profileImage from '../assets/profilePicture.PNG'; // Replace with your image path

function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero-left">
        <h1>Who am I ?</h1>
        <p>
          I’m a developer specializing in building modern, responsive websites and web applications.
        </p>
        <a href="#contact" className="hero-button">Get in Touch</a>
      </div>
      <div className="hero-right">
        <img src={profileImage} alt="Soham" className="hero-image" />
      </div>
    </section>
  );
}

export default Hero;
