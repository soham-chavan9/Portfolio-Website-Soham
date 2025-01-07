import React from 'react';
import '../styles/About.css';

function About() {
  const techStack = [
    { name: 'HTML', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
    { name: 'CSS', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
    { name: 'JavaScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
    { name: 'React.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
    { name: 'Node.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
    { name: 'MongoDB', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
    { name: 'MySQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
    { name: 'GitHub', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' },
   
   
  ];

  return (
    <section id="about" className="about">
      <div className="skills-container">
        {techStack.map((tech, index) => (
          <div className="skill-card" key={index}>
            <img src={tech.logo} alt={`${tech.name} logo`} className="skill-logo" />
            <p className="skill-name">{tech.name}</p>
          </div>
        ))}
      </div>
      <div className="about-info">
        <h2 className="about-title">About Me</h2>
        <p className="about-description">
          I’m a passionate developer with experience in building responsive websites 
          and web applications. Skilled in React, JavaScript, and modern web technologies.
        </p>
      </div>
    </section>
  );
}

export default About;
