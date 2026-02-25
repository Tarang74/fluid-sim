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
          <div className="author">
            By Tarang Janawalkar <br />& Christina Edwards
          </div>
          <div className="footer-bottom">
            <div className="footer-sections">
              <div className="footer-section">
                <div className="footer-section-title">My Socials</div>
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

              <div className="footer-section">
                <div className="footer-section-title">Her Socials</div>
                <div className="footer-section-links">
                  <div className="footer-section-link">
                    <span
                      onClick={() => {
                        window.open(
                          "https://portfolio-flame-two-36.vercel.app/",
                        );
                      }}
                      tabIndex={0}
                    >
                      Portfolio
                    </span>
                  </div>
                  <div className="footer-section-link">
                    <span
                      onClick={() => {
                        window.open(
                          "https://linkedin.com/in/christina-edwards-7a0a7230a/",
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
                        window.open("https://github.com/Stellarium0-0");
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
                at the Queensland University of Technology in Semester 2, 2025.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
