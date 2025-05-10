import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LegalPages.css';

function CookiePolicyPage() {
  return (
    <div className="legal-page">
      <Header />
      
      <div className="legal-container">
        <div className="legal-header">
          <h1>Cookie Policy</h1>
          <p>Last Updated: May 10, 2025</p>
        </div>
        
        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              This Cookie Policy explains how P4SBU ("we", "us", or "our") uses cookies and similar technologies 
              on our website and application. It explains what these technologies are and why we use them, as well 
              as your rights to control our use of them.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>2. What Are Cookies?</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. 
              Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well 
              as to provide reporting information.
            </p>
            <p>
              Cookies set by the website owner (in this case, P4SBU) are called "first-party cookies". Cookies set by 
              parties other than the website owner are called "third-party cookies". Third-party cookies enable third-party 
              features or functionality to be provided on or through the website (e.g., advertising, interactive content, 
              and analytics).
            </p>
          </section>
          
          <section className="legal-section">
            <h2>3. Types of Cookies We Use</h2>
            <h3>3.1 Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable basic functions like page 
              navigation and access to secure areas of the website. The website cannot function properly without these cookies.
            </p>
            
            <h3>3.2 Functionality Cookies</h3>
            <p>
              These cookies allow the website to remember choices you make (such as your username, language, or the region 
              you are in) and provide enhanced, more personal features. They may also be used to provide services you have 
              requested, such as watching a video or commenting on a blog.
            </p>
            
            <h3>3.3 Performance Cookies</h3>
            <p>
              These cookies collect information about how visitors use a website, for instance which pages visitors go to 
              most often. They help us improve how our website works and understand user behavior.
            </p>
            
            <h3>3.4 Targeting/Advertising Cookies</h3>
            <p>
              These cookies are used to deliver advertisements more relevant to you and your interests. They are also used 
              to limit the number of times you see an advertisement as well as help measure the effectiveness of advertising campaigns.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>4. Specific Cookies We Use</h2>
            <div className="cookie-table-container">
              <table className="cookie-table">
                <thead>
                  <tr>
                    <th>Cookie Name</th>
                    <th>Purpose</th>
                    <th>Duration</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>p4sbu_session</td>
                    <td>Maintains user session state across page requests</td>
                    <td>Session</td>
                    <td>Essential</td>
                  </tr>
                  <tr>
                    <td>p4sbu_auth</td>
                    <td>Authenticates users and maintains login status</td>
                    <td>30 days</td>
                    <td>Essential</td>
                  </tr>
                  <tr>
                    <td>p4sbu_preferences</td>
                    <td>Remembers user preferences (theme, language, etc.)</td>
                    <td>1 year</td>
                    <td>Functionality</td>
                  </tr>
                  <tr>
                    <td>p4sbu_analytics</td>
                    <td>Collects anonymous statistical data to improve user experience</td>
                    <td>1 year</td>
                    <td>Performance</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          
          <section className="legal-section">
            <h2>5. How to Manage Cookies</h2>
            <p>
              You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, 
              you may still use our website though your access to some functionality and areas may be restricted.
            </p>
            <p>
              The specific way to manage cookies via your web browser controls varies from browser to browser. You should 
              visit your browser's help menu for more information.
            </p>
            <h3>Browser Cookie Settings:</h3>
            <ul>
              <li>
                <strong>Google Chrome</strong>: Menu → Settings → Privacy and Security → Cookies and other site data
              </li>
              <li>
                <strong>Mozilla Firefox</strong>: Menu → Options → Privacy & Security → Cookies and Site Data
              </li>
              <li>
                <strong>Safari</strong>: Preferences → Privacy → Cookies and website data
              </li>
              <li>
                <strong>Microsoft Edge</strong>: Settings → Site permissions → Cookies and site data
              </li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>6. Changes to This Cookie Policy</h2>
            <p>
              We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new 
              Cookie Policy on this page and updating the "Last Updated" date.
            </p>
            <p>
              We encourage you to review this Cookie Policy periodically for any changes.
            </p>
          </section>
          
          <section className="legal-section">
            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at:
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

export default CookiePolicyPage;