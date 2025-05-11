import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  const handleContactEmail = () => {
    window.location.href = 'mailto:parking4sbu@gmail.com?subject=P4SBU Inquiry';
  };
  
  return (
    <>
      {/* Add a spacer to create a smooth transition */}
      <div className="pre-footer-spacer"></div>
      
      <footer className="premium-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="footer-logo-text">P4SBU</span>
              </div>
              <p className="footer-tagline">Smart parking management at Stony Brook University.</p>
              <p className="footer-copyright">© {currentYear} P4SBU. All rights reserved.</p>
            </div>
            
            <div className="footer-links">
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><Link to="/about">About Us</Link></li>
                  <li><Link to="/team">Our Team</Link></li>
                  <li><Link to="/careers">Careers</Link></li>
                  <li><a href="#" onClick={handleContactEmail}>Contact</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Resources</h4>
                <ul>
                  <li><Link to="/help">FAQ</Link></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li><Link to="/privacy">Privacy Policy</Link></li>
                  <li><Link to="/cookies">Cookie Policy</Link></li>
                  <li><Link to="/security">Security</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-social">
              <a href="https://github.com" aria-label="GitHub" className="social-icon" target="_blank" rel="noopener noreferrer">
                <FaGithub />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="social-icon" target="_blank" rel="noopener noreferrer">
                <FaLinkedin />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="social-icon" target="_blank" rel="noopener noreferrer">
                <FaTwitter />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;