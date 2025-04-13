import React from 'react';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  
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
                  <li><a href="/about">About Us</a></li>
                  <li><a href="/team">Our Team</a></li>
                  <li><a href="/careers">Careers</a></li>
                  <li><a href="/contact">Contact</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Resources</h4>
                <ul>
                  <li><a href="/faq">FAQ</a></li>
                  <li><a href="/help">Help Center</a></li>
                  <li><a href="/campus-map">Campus Map</a></li>
                  <li><a href="/accessibility">Accessibility</a></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Legal</h4>
                <ul>
                  <li><a href="/terms">Terms of Service</a></li>
                  <li><a href="/privacy">Privacy Policy</a></li>
                  <li><a href="/cookies">Cookie Policy</a></li>
                  <li><a href="/security">Security</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-social">
              <a href="https://github.com" aria-label="GitHub" className="social-icon">
                <FaGithub />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="social-icon">
                <FaLinkedin />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className="social-icon">
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