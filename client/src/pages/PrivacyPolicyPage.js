import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LegalPages.css';

function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <Header />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <p>Last Updated: May 10, 2025</p>
        </div>
        
        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              At P4SBU, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              parking management platform. Please read this policy carefully to understand our practices regarding your personal data.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <h3>2.1 Personal Information</h3>
            <ul>
              <li>Contact information (name, email address, phone number)</li>
              <li>Account credentials (username, password)</li>
              <li>Vehicle information (license plate number, make, model, color)</li>
              <li>Stony Brook University affiliation (student, faculty, staff)</li>
              <li>Payment information (processed securely through third-party payment processors)</li>
            </ul>
            
            <h3>2.2 Usage Information</h3>
            <ul>
              <li>Parking reservation history</li>
              <li>Log data (IP address, browser type, pages visited, time spent)</li>
              <li>Device information (device type, operating system)</li>
              <li>Location data (when using location-based features)</li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process and manage parking reservations</li>
              <li>Communicate with you about your account and reservations</li>
              <li>Send important notifications about changes to our terms or policies</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Prevent fraudulent activities and enhance security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>4. Data Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li>With Stony Brook University parking administration as necessary for service operation</li>
              <li>With third-party service providers who perform services on our behalf</li>
              <li>To comply with legal obligations, enforce our policies, or protect rights, property, or safety</li>
              <li>In connection with a business transfer, merger, or acquisition</li>
            </ul>
            <p>
              We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. These measures include encryption, 
              secure server facilities, regular security assessments, and restricted access to personal information.
            </p>
            <p>
              While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee 
              its absolute security. We encourage you to use strong passwords and be cautious about the information you share.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>6. Your Rights and Choices</h2>
            <p>You have certain rights regarding your personal information, including:</p>
            <ul>
              <li>Accessing, correcting, or updating your personal information</li>
              <li>Requesting deletion of your personal information</li>
              <li>Opting out of marketing communications</li>
              <li>Setting browser cookies preferences</li>
            </ul>
            <p>
              To exercise these rights, please contact us at privacy@p4sbu.com.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>7. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy 
              Policy periodically for any changes.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> privacy@p4sbu.com</p>
              <p><strong>Address:</strong> Department of Computer Science, Stony Brook University, Stony Brook, NY 11794</p>
            </div>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default PrivacyPolicyPage;