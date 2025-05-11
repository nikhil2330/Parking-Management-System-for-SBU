import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AboutPage.css';

// Import team member images
import abidMalikImg from '../assets/abid-malik.png';
import raghavDheriImg from '../assets/raghav-dheri.png';
import urviBhatnagarImg from '../assets/urvi-bhatnagar.png';
import shivKananiImg from '../assets/shiv-kanani.png';
import nikhilSundaresanImg from '../assets/nikhil-sundaresan.png';

function AboutPage() {
  return (
    <div className="about-page">
      {/* Decorative blobs */}
      <div className="bg-shape about-shape-1" aria-hidden="true" />
      <div className="bg-shape about-shape-2" aria-hidden="true" />
      
      {/* Header */}
      <Header />
      
      {/* Hero section */}
      <section className="about-hero-section">
        <div className="about-hero-content">
          <h1>Our Team</h1>
          <p>Meet the talented individuals behind P4SBU.</p>
        </div>
      </section>
      
      {/* Main content */}
      <div className="about-content-container">
        {/* Mentor section */}
        <section className="about-mentor-section">
          <div className="section-header">
            <h2>Faculty Mentor</h2>
            <div className="section-divider"></div>
          </div>
          
          <div className="mentor-profile">
            <div className="mentor-image-container">
              <img src={abidMalikImg} alt="Professor Abid Malik" className="mentor-image" />
            </div>
            <div className="mentor-info">
              <h3>Dr. Abid M. Malik</h3>
              <h4>Associate Professor of Practice</h4>
              <p>Department of Computer Science <br />Room 131 Stony Brook, NY 11794-2424</p>
              <div className="mentor-contact">
                <p><strong>Phone:</strong> (631) 632-2111</p>
                <p><strong>Email:</strong> amalik@cs.stonybrook.edu</p>
              </div>
              <p className="mentor-bio">
                Dr. Malik serves as the faculty mentor for the P4SBU project, providing guidance and expertise to the team. His research interests include computer science education, software engineering, and distributed systems.
              </p>
            </div>
          </div>
        </section>
        
        {/* Student team section */}
        <section className="about-team-section">
          <div className="section-header">
            <h2>Student Development Team</h2>
            <div className="section-divider"></div>
          </div>
          
          <div className="team-grid">
            {/* Raghav Dheri */}
            <div className="team-member">
              <div className="team-member-image-container">
                <img src={raghavDheriImg} alt="Raghav Dheri" className="team-member-image" />
              </div>
              <h3>Raghav Dheri</h3>
              <h4>Junior</h4>
              <p>Computer Science & Applied Mathematics and Statistics</p>
              <div className="team-member-bio">
                <p>
                  Raghav is a junior at Stony Brook University pursuing a double major in Computer Science and Applied Mathematics. 
                  Outside of his academic pursuits, Raghav enjoys working out, playing FIFA, and playing the piano. 
                  His adventurous spirit and technical expertise have been invaluable to the P4SBU project.
                </p>
              </div>
            </div>
            
            {/* Urvi Bhatnagar */}
            <div className="team-member">
              <div className="team-member-image-container">
                <img src={urviBhatnagarImg} alt="Urvi Bhatnagar" className="team-member-image" />
              </div>
              <h3>Urvi Bhatnagar</h3>
              <h4>Senior</h4>
              <p>Computer Science & Applied Mathematics and Statistics</p>
              <div className="team-member-bio">
                <p>
                  Urvi is a senior at Stony Brook University and is also pursuing a double major in Computer Science and Applied 
                  Mathematics and Statistics. She is a member of the WISE Honors program and brings a wealth of academic excellence 
                  to the team. When she's not coding, Urvi enjoys reading, cooking, eating, and painting.
                </p>
              </div>
            </div>
            
            {/* Shiv Kanani */}
            <div className="team-member">
              <div className="team-member-image-container">
                <img src={shivKananiImg} alt="Shiv Kanani" className="team-member-image" />
              </div>
              <h3>Shiv Kanani</h3>
              <h4>Junior</h4>
              <p>Computer Science</p>
              <div className="team-member-bio">
                <p>
                  Shiv is a junior at Stony Brook University majoring in Computer Science. Outside of his academic
                  commitments, Shiv spends his time working out, playing soccer, and reading about current events
                  around the world.
                </p>
              </div>
            </div>
            
            {/* Nikhil Sundaresan */}
            <div className="team-member">
              <div className="team-member-image-container">
                <img src={nikhilSundaresanImg} alt="Nikhil Sundaresan" className="team-member-image" />
              </div>
              <h3>Nikhil Sundaresan</h3>
              <h4>Senior</h4>
              <p>Computer Science</p>
              <div className="team-member-bio">
                <p>
                  Nikhil is a senior at Stony Brook University majoring in Computer Science. Beyond his technical 
                  contributions to P4SBU, Nikhil is a professional basketball player. He also enjoys working out 
                  and playing the piano in his spare time.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Mission section */}
        <section className="about-mission-section">
          <div className="section-header">
            <h2>Our Mission</h2>
            <div className="section-divider"></div>
          </div>
          
          <div className="mission-content">
            <p>
              P4SBU was developed to revolutionize parking management at Stony Brook University. Our team recognized the 
              frustration and inefficiency of the campus parking system and set out to create a solution that makes parking 
              easier, more accessible, and more equitable for all members of the SBU community.
            </p>
            <p>
              Our platform leverages modern technology to provide real-time parking availability, streamlined reservations, 
              and a user-friendly interface that puts control in the hands of drivers. By reducing the time spent searching 
              for parking, we aim to decrease traffic congestion, minimize environmental impact, and improve the overall 
              campus experience.
            </p>
            <p>
              What began as a class project has evolved into a robust system with the potential to transform how universities 
              approach parking management. We're proud of what we've built and excited about the positive impact it will have 
              on the Stony Brook community.
            </p>
          </div>
        </section>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default AboutPage;