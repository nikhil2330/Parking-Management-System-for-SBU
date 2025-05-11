import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FeedbackForm from '../components/FeedbackForm';
import { FaSearch, FaRegLightbulb, FaRegQuestionCircle, FaChevronDown, FaChevronUp, FaCalendarAlt, FaCreditCard, FaDesktop, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { FiUser } from 'react-icons/fi';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { MdOutlineEmail } from 'react-icons/md';
import './HelpPage.css';
// Import the PDF file
import userManualPdf from '../assets/SBU01-UserManual.pdf';

function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const searchInputRef = useRef(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Focus search input when component mounts
  useEffect(() => {
    // Add event listener for keyboard shortcuts
    const handleKeyDown = (e) => {
      // CTRL/CMD + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Updated FAQ data based on client requirements
  const faqData = [
    {
      id: 1,
      category: 'account',
      question: 'How do I update my vehicle information?',
      answer: 'You can update your vehicle information by clicking on your profile icon on the home page. From there, select "Edit Profile" and navigate to the "Vehicles" section. Here you can add, edit, or remove vehicles associated with your account. You can register up to 5 vehicles per account.'
    },
    {
      id: 2,
      category: 'reservation',
      question: 'How do I cancel my parking reservation?',
      answer: 'To cancel a parking reservation, go to the "Reservations" page from the main navigation. Find the reservation you want to cancel and simply click the "Cancel" button. The reservation will be immediately cancelled, and the spot will become available to other users.'
    },
    {
      id: 3,
      category: 'reservation',
      question: 'Can I extend my parking time?',
      answer: 'Currently, you cannot extend your parking time after booking. Parking spots are reserved quickly, and spot times can only be changed by cancelling your current reservation and making a new one if the spot is still available. We recommend booking for the maximum time you might need initially.'
    },
    {
      id: 4,
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We currently accept credit and debit cards as payment methods. All payment information is securely stored using industry-standard encryption.'
    },
    {
      id: 5,
      category: 'payment',
      question: 'How do I get a receipt for my parking?',
      answer: 'A receipt is automatically shown when you complete your payment. You can download this receipt as a PDF for your records. Additionally, all your past transaction receipts can be accessed from your account history.'
    },
    {
      id: 6,
      category: 'general',
      question: 'What are the campus parking hours?',
      answer: 'Campus parking hours vary by lot. Most general lots are available 24/7, while faculty and restricted lots have specific hours of operation. You can see the hours for each lot when you search for parking.'
    },
    {
      id: 7,
      category: 'general',
      question: 'Is there a mobile app available?',
      answer: 'There is currently no mobile app available, but we are actively working on developing one. The mobile app will offer convenient features like mobile check-in/out and push notifications for your parking reservations. Stay tuned for updates!'
    },
    {
      id: 8,
      category: 'technical',
      question: 'Why is the website not loading properly?',
      answer: 'If the website is not loading properly, try clearing your browser cache and cookies, or try using a different browser. Make sure your internet connection is stable. If problems persist, please contact our support team at parking4sbu@gmail.com with details about the issue, including screenshots if possible.'
    },
    {
      id: 9,
      category: 'technical',
      question: 'How do notifications work?',
      answer: 'Notifications are enabled by default on the home page. You will receive alerts about your upcoming and current reservations, as well as any important system announcements. Currently, notifications are delivered through the website while you are using it.'
    }
  ];

  // Filter FAQs based on search term and active category
  const filteredFaqs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Focus on FAQ section after search
    const faqSection = document.querySelector('.help-faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const toggleFeedbackForm = () => {
    setShowFeedbackForm(!showFeedbackForm);
    if (!showFeedbackForm) {
      setFeedbackSubmitted(false);
    }
  };

  const handleFeedbackSubmitSuccess = () => {
    setFeedbackSubmitted(true);
    // Automatically hide the form after successful submission
    setTimeout(() => {
      setShowFeedbackForm(false);
    }, 3000);
  };

  // Function to open email client
  const handleEmailSupport = () => {
    window.location.href = 'mailto:parking4sbu@gmail.com?subject=P4SBU Support Request';
  };

  // Function to show PDF user guide
  const handleViewGuides = () => {
    setShowUserGuide(true);
  };

  const closeUserGuide = () => {
    setShowUserGuide(false);
  };

  // Function to view tips & tricks
  const handleViewTips = () => {
    alert('Tips & tricks will be available soon! Check back later.');
  };

  return (
    <div className="premium-help-page">
      {/* Decorative blobs */}
      <div className="bg-shape help-shape-1" aria-hidden="true" />
      <div className="bg-shape help-shape-2" aria-hidden="true" />
      
      {/* Header */}
      <Header />
      
      {/* Hero section */}
      <section className="help-hero-section">
        <div className="help-hero-content">
          <h1>How can we help you?</h1>
          <p>Find answers to your questions or contact our support team</p>
          <form onSubmit={handleSearchSubmit} className="help-search-container">
            <FaSearch className="help-search-icon" />
            <input
              type="text"
              placeholder="Click enter to search!"
              className="help-search-input"
              value={searchTerm}
              onChange={handleSearchChange}
              ref={searchInputRef}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="help-search-clear" 
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </form>
          {searchTerm && (
            <div className="help-search-hint">
              <p>Press Enter to search or scroll down to see results</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Main content */}
      <div className="help-content-container">
        {/* Quick links */}
        <section className="help-quick-links">
          <div className="help-link-card" onClick={handleViewGuides}>
            <div className="help-link-icon">
              <IoDocumentTextOutline />
            </div>
            <h3>User Guides</h3>
            <p>Step-by-step instructions for using P4SBU</p>
            <div className="help-link-action">
              View Guide
            </div>
          </div>
          
          <div className="help-link-card" onClick={handleViewTips}>
            <div className="help-link-icon">
              <FaRegLightbulb />
            </div>
            <h3>Tips & Tricks</h3>
            <p>Get the most out of your parking experience</p>
            <div className="help-link-action">
              Coming Soon
            </div>
          </div>
          
          <div className="help-link-card feedback-card" onClick={toggleFeedbackForm}>
            <div className="help-link-icon">
              <MdOutlineEmail />
            </div>
            <h3>Share Feedback</h3>
            <p>Help us improve your parking experience</p>
            <div className="help-link-action">
              Give Feedback
            </div>
          </div>
        </section>

        {/* User Guide PDF Modal */}
        {showUserGuide && (
          <div className="user-guide-modal">
            <div className="user-guide-modal-content">
              <div className="user-guide-header">
                <h2>P4SBU User Guide</h2>
                <button className="close-modal-btn" onClick={closeUserGuide}>
                  <FaTimes />
                </button>
              </div>
              <div className="user-guide-body">
                <iframe 
                  src={userManualPdf} 
                  title="P4SBU User Manual"
                  className="user-guide-pdf"
                ></iframe>
              </div>
              <div className="user-guide-footer">
                <button className="download-pdf-btn" onClick={() => window.open(userManualPdf, '_blank')}>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Form (toggleable) */}
        {showFeedbackForm && (
          <section className="help-feedback-section">
            {feedbackSubmitted ? (
              <div className="feedback-success">
                <h3>Thank you for your feedback!</h3>
                <p>We appreciate your input and will use it to improve our services.</p>
              </div>
            ) : (
              <FeedbackForm onSubmitSuccess={handleFeedbackSubmitSuccess} />
            )}
          </section>
        )}
        
        {/* FAQ section */}
        <section className="help-faq-section" id="faq-section">
          <div className="help-section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Find quick answers to common questions</p>
            {searchTerm && (
              <div className="search-results-info">
                <p>Showing results for: <strong>"{searchTerm}"</strong></p>
                <button onClick={clearSearch} className="clear-search-btn">
                  Clear Search
                </button>
              </div>
            )}
          </div>
          
          {/* FAQ categories */}
          <div className="help-category-tabs">
            <button 
              className={`help-category-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('all')}
            >
              <FaRegQuestionCircle className="help-category-icon" />
              All
            </button>
            <button 
              className={`help-category-tab ${activeCategory === 'account' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('account')}
            >
              <FiUser className="help-category-icon" />
              Account
            </button>
            <button 
              className={`help-category-tab ${activeCategory === 'reservation' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('reservation')}
            >
              <FaCalendarAlt className="help-category-icon" />
              Reservations
            </button>
            <button 
              className={`help-category-tab ${activeCategory === 'payment' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('payment')}
            >
              <FaCreditCard className="help-category-icon" />
              Payments
            </button>
            <button 
              className={`help-category-tab ${activeCategory === 'technical' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('technical')}
            >
              <FaDesktop className="help-category-icon" />
              Technical
            </button>
            <button 
              className={`help-category-tab ${activeCategory === 'general' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('general')}
            >
              <FaInfoCircle className="help-category-icon" />
              General
            </button>
          </div>
          
          {/* FAQ accordion */}
          <div className="help-faq-list">
            {loading ? (
              // Loading skeleton
              [...Array(3)].map((_, i) => (
                <div key={i} className="help-faq-skeleton">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line"></div>
                </div>
              ))
            ) : filteredFaqs.length > 0 ? (
              filteredFaqs.map(faq => (
                <div 
                  key={faq.id} 
                  className={`help-faq-item ${expandedFaq === faq.id ? 'expanded' : ''}`}
                  onClick={() => toggleFaq(faq.id)}
                >
                  <div className="help-faq-question">
                    <h3>{faq.question}</h3>
                    {expandedFaq === faq.id ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  <div className="help-faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="help-no-results">
                <FaSearch size={32} />
                <h3>No matching results found</h3>
                <p>Try using different keywords or browse through our categories</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Contact support section - simplified with only email */}
        <section className="help-contact-section">
          <div className="help-contact-card">
            <div className="help-contact-content">
              <h2>Still need help?</h2>
              <p>Our dedicated support team is ready to assist you with any issues or questions you might have.</p>
              <div className="help-contact-methods">
                <div className="help-contact-method">
                  <div className="help-contact-icon">
                    <MdOutlineEmail />
                  </div>
                  <div className="help-contact-info">
                    <h4>Email Support</h4>
                    <p>We'll respond within 24 hours</p>
                    <button className="help-contact-button" onClick={handleEmailSupport}>Contact Support</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="help-contact-decoration"></div>
          </div>
        </section>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default HelpPage;