import "./index.css";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <>
      <main className="hero-main">
        <div className="hero">
          <div className="hero-text">
            A Particle-Based
            <br />
            Fluid Simulator
          </div>
          <div
            className="launch-button"
            onClick={() => {
              void navigate("/app");
            }}
          >
            Launch
          </div>
        </div>
      </main>
      <footer className="hero-footer">
        <div className="footer-container">
          <div className="author">By Tarang Janawalkar</div>
          <div className="footer-bottom">
            <div className="footer-sections">
              <div className="footer-section">
                <div className="footer-section-title">Contact</div>
                <div className="footer-section-links">
                  <div className="footer-section-link">
                    <span
                      onClick={() => {
                        window.open("mailto:t.janawalkar@qut.edu.au");
                      }}
                      tabIndex={0}
                    >
                      t.janawalkar@qut.edu.au
                    </span>
                  </div>
                </div>
              </div>

              <div className="footer-section">
                <div className="footer-section-title">Socials</div>
                <div className="footer-section-links">
                  <div className="footer-section-link">
                    <span
                      onClick={() => {
                        window.open(
                          "https://linkedin.com/in/tarang-janawalkar",
                        );
                      }}
                      tabIndex={0}
                    >
                      LinkedIn
                    </span>
                  </div>
                  <div className="footer-section-link">
                    <span
                      onClick={() => {
                        window.open("https://github.com/Tarang74");
                      }}
                      tabIndex={0}
                    >
                      GitHub
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="disclaimer">
              <div className="rule" />
              <div className="disclaimer-text">
                This project was developed for the unit <i>Cloud Computing</i>{" "}
                at Queensland University of Technology in Semester 2, 2025.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
