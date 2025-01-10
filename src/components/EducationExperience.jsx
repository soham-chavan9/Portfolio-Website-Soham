import React from "react";
import "../styles/EducationExperience.css";

function EducationExperience() {
  const education = [
    {
      institution: "Northeastern University",
      location: "Boston, MA",
      period: "September 2024 – December 2026",
      degree: "Master of Science in Information Systems",
      coursework: "Web development, Application Engineering and Development",
    },
    {
      institution: "Mumbai University",
      location: "Mumbai, India",
      period: "June 2020 – July 2023",
      degree: "Bachelor of Technology in Electronics and Telecommunication Engineering",
      coursework: "Python, Cloud Computing, Project Management, Wireless Networks",
    },
  ];

  const workExperience = [
    {
      title: "Network Engineer",
      company: "ACN FIBER PVT. LTD.",
      period: "June 2023 – July 2024",
      responsibilities: [
        "Designed and implemented new network solutions improving efficiency by 20%.",
        "Audited network infrastructure to optimize both efficiency and security.",
        "Investigated faults in the network and upgraded equipment to the latest firmware.",
      ],
    },
    {
      title: "Assistant Network Engineering Intern",
      company: "SPEEDGLOBAL TELECOM PVT. LTD.",
      period: "June 2016 – August 2019",
      responsibilities: [
        "Monitored network infrastructure and decreased downtime by 5%.",
        "Documented solutions for network-related issues.",
        "Installed hardware and software, created backups, and monitored system performance.",
      ],
    },
  ];

  return (
    <section id="education-experience" className="education-experience">
      <h2 className="section-title">Education</h2>
      <div className="grid-container">
        {education.map((edu, index) => (
          <div key={index} className="education-item">
            <h3>{edu.institution}</h3>
            <p className="degree">{edu.degree}</p>
            <p>{edu.coursework}</p>
            <span>{edu.location} | {edu.period}</span>
          </div>
        ))}
      </div>

      <h2 className="section-title">Work Experience</h2>
      <div className="grid-container">
        {workExperience.map((work, index) => (
          <div key={index} className="work-item">
            <h3>{work.title}</h3>
            <p className="company">{work.company}</p>
            <span>{work.period}</span>
            <ul>
              {work.responsibilities.map((responsibility, idx) => (
                <li key={idx}>{responsibility}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default EducationExperience;
