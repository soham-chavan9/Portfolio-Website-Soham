import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../styles/Projects.css";

function Projects() {
  const projects = [
    {
      title: "E-Commerce Website",
      description: "A responsive e-commerce platform with shopping cart functionality.",
      image: "https://via.placeholder.com/300x200",
      link: "#",
    },
    {
      title: "Portfolio Website",
      description: "A sleek, personal portfolio built with React.",
      image: "https://via.placeholder.com/300x200",
      link: "#",
    },
    {
      title: "Weather App",
      description: "A weather forecasting app using OpenWeatherMap API.",
      image: "https://via.placeholder.com/300x200",
      link: "#",
    },
    {
      title: "Blog Website",
      description: "A blogging platform with content management features.",
      image: "https://via.placeholder.com/300x200",
      link: "#",
    },
    {
      title: "Task Tracker",
      description: "A task management tool with a user-friendly interface.",
      image: "https://via.placeholder.com/300x200",
      link: "#",
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
