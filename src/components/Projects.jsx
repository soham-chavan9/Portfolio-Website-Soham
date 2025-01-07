import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../styles/Projects.css";

import fundFlowImage from "../assets/fundFlowImage.jpg";
import portfolioImage from "../assets/portfolioImage.jpg";
import universityManagementImage from "../assets/universityManagementImage.jpg";

function Projects() {
  const projects = [
    {
      title: "Fund Flow",
      description: "A full-stack web application for expense tracking and budgeting.",
      image: fundFlowImage,
    },
    {
      title: "Portfolio Website",
      description: "A sleek, personal portfolio built with React.",
      image: portfolioImage,
    },
    {
      title: "University Management System",
      description: "Designed an integrated University Management System to address various inefficiencies in campus operations, including class registration, grade management, and auxiliary services.",
      image: universityManagementImage,
    },
  ];

  return (
    <section id="projects" className="projects">
      <h2 className="projects-title">My Projects</h2>
      <div
        id="projectsCarousel"
        className="carousel slide"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner">
          {projects.map((project, index) => (
            <div
              key={index}
              className={`carousel-item ${index === 0 ? "active" : ""}`}
            >
              <div className="card-deck d-flex justify-content-center">
                <div className="card project-card">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="card-img-top project-image"
                  />
                  <div className="card-body">
                    <h5 className="card-title">{project.title}</h5>
                    <p className="card-text">{project.description}</p>
                    <a
                      href={project.link}
                      className="btn btn-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Project
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {projects.map((_, index) => (
            <button
              key={index}
              type="button"
              data-bs-target="#projectsCarousel"
              data-bs-slide-to={index}
              className={index === 0 ? "active" : ""}
              aria-current={index === 0 ? "true" : "false"}
              aria-label={`Slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Projects;
