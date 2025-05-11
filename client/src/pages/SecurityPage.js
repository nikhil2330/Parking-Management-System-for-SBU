import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaShieldAlt, FaLock, FaUserShield, FaServer, FaCode, FaExclamationTriangle } from 'react-icons/fa';
import './LegalPages.css';

function SecurityPage() {
  return (
    <div className="legal-page">
      <Header />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>Security Policy</h1>
          <p>Last Updated: May 10, 2025</p>
        </div>
        
        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Our Commitment to Security</h2>
            <div className="security-icon-container">
              <FaShieldAlt className="security-icon" />
            </div>
            <p>
              At P4SBU, we are committed to protecting the security and integrity of your data. We implement industry-standard 
              security measures to prevent unauthorized access, disclosure, modification, or destruction of your information.
            </p>
            <p>
              Our security practices are continuously reviewed and improved to ensure that we maintain the highest standards 
              of data protection. This Security Policy outlines the measures we take to safeguard your information.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>2. Data Protection Measures</h2>
            <div className="security-icon-container">
              <FaLock className="security-icon" />
            </div>
            <p>We employ the following measures to protect your data:</p>
            <ul>
              <li>
                <strong>Encryption:</strong> All sensitive data is encrypted both in transit and at rest using industry-standard 
                encryption protocols (TLS/SSL, AES-256).
              </li>
              <li>
                <strong>Access Controls:</strong> We implement strict access controls and authentication mechanisms to ensure 
                that only authorized personnel can access user data.
              </li>
              <li>
                <strong>Secure Infrastructure:</strong> Our systems are hosted in secure, SOC 2 compliant data centers with 
                physical security measures, redundant power, and environmental controls.
              </li>
              <li>
                <strong>Regular Security Audits:</strong> We conduct regular security assessments and vulnerability scans to 
                identify and address potential security issues.
              </li>
              <li>
                <strong>Data Minimization:</strong> We collect and retain only the information necessary to provide our services.
              </li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>3. Account Security</h2>
            <div className="security-icon-container">
              <FaUserShield className="security-icon" />
            </div>
            <p>
              We implement several measures to ensure the security of your account:
            </p>
            <ul>
              <li>
                <strong>Secure Authentication:</strong> We use secure authentication methods to verify your identity when you 
                log in to your account.
              </li>
              <li>
                <strong>Password Security:</strong> We enforce strong password requirements and securely hash all passwords 
                using modern cryptographic algorithms.
              </li>
              <li>
                <strong>Session Management:</strong> We implement secure session handling to prevent unauthorized access to 
                your account.
              </li>
              <li>
                <strong>Account Activity Monitoring:</strong> We monitor account activity for suspicious behavior to help 
                detect and prevent unauthorized access.
              </li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>4. Application Security</h2>
            <div className="security-icon-container">
              <FaCode className="security-icon" />
            </div>
            <p>
              We follow secure software development practices to ensure the security of our application:
            </p>
            <ul>
              <li>
                <strong>Secure Development Lifecycle:</strong> We integrate security into every phase of our development process.
              </li>
              <li>
                <strong>Code Reviews:</strong> All code changes undergo security-focused code reviews before deployment.
              </li>
              <li>
                <strong>Security Testing:</strong> We perform regular security testing, including penetration testing and 
                security code scans.
              </li>
              <li>
                <strong>Vulnerability Management:</strong> We promptly address security vulnerabilities and apply security 
                patches to our systems.
              </li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>5. Infrastructure Security</h2>
            <div className="security-icon-container">
              <FaServer className="security-icon" />
            </div>
            <p>
              Our infrastructure is designed with security as a fundamental principle:
            </p>
            <ul>
              <li>
                <strong>Network Security:</strong> We implement network security controls, including firewalls, intrusion 
                detection systems, and network segmentation.
              </li>
              <li>
                <strong>System Hardening:</strong> Our systems are configured according to security best practices to minimize 
                vulnerabilities.
              </li>
              <li>
                <strong>Monitoring and Logging:</strong> We maintain comprehensive logs and monitoring systems to detect and 
                respond to security events.
              </li>
              <li>
                <strong>Backup and Recovery:</strong> We regularly back up data and have disaster recovery procedures in place 
                to ensure service continuity.
              </li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>6. Security Incident Response</h2>
            <div className="security-icon-container">
              <FaExclamationTriangle className="security-icon" />
            </div>
            <p>
              In the event of a security incident, we have established procedures to:
            </p>
            <ul>
              <li>Quickly identify and contain the incident</li>
              <li>Investigate the cause and impact</li>
              <li>Implement corrective actions</li>
              <li>Notify affected users and authorities as required by law</li>
              <li>Review and improve our security measures based on lessons learned</li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>7. User Responsibilities</h2>
            <p>
              While we take extensive measures to protect your data, security is a shared responsibility. We recommend that you:
            </p>
            <ul>
              <li>Use strong, unique passwords for your P4SBU account</li>
              <li>Keep your login credentials confidential</li>
              <li>Log out of your account when using shared devices</li>
              <li>Keep your devices and browsers updated</li>
              <li>Be alert to phishing attempts and suspicious communications</li>
              <li>Contact us immediately if you suspect unauthorized access to your account</li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>8. Security Updates and Changes</h2>
            <p>
              We regularly review and update our security practices to address emerging threats and implement improved security 
              technologies. We may update this Security Policy from time to time to reflect these changes.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about our security practices or want to report a security concern, please contact us at:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> security@p4sbu.com</p>
              <p><strong>Address:</strong> Department of Computer Science, Stony Brook University, Stony Brook, NY 11794</p>
            </div>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default SecurityPage;