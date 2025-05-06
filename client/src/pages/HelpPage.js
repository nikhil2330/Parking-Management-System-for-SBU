import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FeedbackForm from '../components/FeedbackForm';
import { FaSearch, FaRegLightbulb, FaRegQuestionCircle, FaHeadset, FaArrowRight, FaChevronDown, FaChevronUp, FaCalendarAlt, FaCreditCard, FaDesktop, FaInfoCircle, FaPhone, FaCommentAlt } from 'react-icons/fa';
import { FiUser } from 'react-icons/fi';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { MdOutlineEmail } from 'react-icons/md';
import './HelpPage.css';

function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // FAQ data
  const faqData = [
    {
      id: 1,
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'To reset your password, click on the "Forgot Password" link on the login page. You will receive an email with instructions to reset your password. Follow the link in the email and create a new password. Make sure to use a secure password that includes numbers, symbols, and both uppercase and lowercase letters.'
    },
    {
      id: 2,
      category: 'account',
      question: 'How do I update my vehicle information?',
      answer: 'You can update your vehicle information by clicking on your profile icon in the top right corner of the screen. Then select "Edit Profile" and navigate to the "Vehicles" section. Here you can add, edit, or remove vehicles associated with your account. You can register up to 5 vehicles per account.'
    },
    {
      id: 3,
      category: 'reservation',
      question: 'How do I cancel my parking reservation?',
      answer: 'To cancel a parking reservation, go to "Reservations" in the main navigation. Find the reservation you want to cancel and click the "Cancel" button. Please note that cancellations made less than 24 hours before the scheduled time may be subject to a cancellation fee. You\'ll receive a confirmation email once your cancellation is processed.'
    },
    {
      id: 4,
      category: 'reservation',
      question: 'Can I extend my parking time?',
      answer: 'Yes, you can extend your parking time if space is available. Go to "Reservations" in the main navigation, find your active reservation, and click "Extend". You can add more time as needed, subject to availability. If the extension option is unavailable, it means the parking spot is already reserved for someone else after your time slot.'
    },
    {
      id: 5,
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards (Visa, MasterCard, American Express, Discover), debit cards, Apple Pay, and Google Pay. For students and faculty, you can also link your SBU account for direct charges. All payment information is securely stored using industry-standard encryption.'
    },
    {
      id: 6,
      category: 'payment',
      question: 'How do I get a receipt for my parking?',
      answer: 'Receipts are automatically sent to your email after each transaction. You can also view and download your receipts at any time by going to "Payment Methods" in the main navigation and clicking on "Transaction History". From there, you can filter by date and download receipts in PDF format.'
    },
    {
      id: 7,
      category: 'general',
      question: 'What are the campus parking hours?',
      answer: 'Campus parking hours vary by lot. Most general lots are available 24/7, while faculty and restricted lots have specific hours of operation. You can see the hours for each lot when you search for parking. Premium lots typically operate from 6:00 AM to 11:00 PM, while resident lots are available 24/7 for permit holders.'
    },
    {
      id: 8,
      category: 'general',
      question: 'Is there a mobile app available?',
      answer: 'Yes, the P4SBU mobile app is available for both iOS and Android devices. Search for "P4SBU" in the App Store or Google Play Store. The mobile app offers all the same features as the website, plus mobile check-in/out and push notifications for your parking reservations. You can also use the app to quickly extend parking time.'
    },
    {
      id: 9,
      category: 'technical',
      question: 'Why is the website not loading properly?',
      answer: 'If the website is not loading properly, try clearing your browser cache and cookies, or try using a different browser. Make sure your internet connection is stable. If problems persist, please contact our support team at support@p4sbu.edu with details about the issue, including screenshots if possible.'
    },
    {
      id: 10,
      category: 'technical',
      question: 'How do I enable notifications?',
      answer: 'To enable notifications, go to your profile settings by clicking on your profile icon in the top right corner. Navigate to the "Notifications" tab and choose your preferred notification methods (email, SMS, or push notifications if using the mobile app). You can customize which events trigger notifications, such as reservation reminders, expiration alerts, or special offers.'
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

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const toggleFeedbackForm = () => {
    setShowFeedbackForm(!showFeedbackForm);
  };

  const handleFeedbackSubmitSuccess = () => {
    // Automatically hide the form after successful submission
    setTimeout(() => {
      setShowFeedbackForm(false);
    }, 3000);
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
          <div className="help-search-container">
            <FaSearch className="help-search-icon" />
            <input
              type="text"
              placeholder="Search for help topics..."
              className="help-search-input"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </section>
      
      {/* Main content */}
      <div className="help-content-container">
        {/* Quick links */}
        <section className="help-quick-links">
          <div className="help-link-card">
            <div className="help-link-icon">
              <IoDocumentTextOutline />
            </div>
            <h3>User Guides</h3>
            <p>Step-by-step instructions for using P4SBU</p>
            <div className="help-link-action">
              View Guides <FaArrowRight className="help-arrow-icon" />
            </div>
          </div>
          
          <div className="help-link-card">
            <div className="help-link-icon">
              <FaRegLightbulb />
            </div>
            <h3>Tips & Tricks</h3>
            <p>Get the most out of your parking experience</p>
            <div className="help-link-action">
              Learn More <FaArrowRight className="help-arrow-icon" />
            </div>
          </div>
          
          <div className="help-link-card feedback-card" onClick={toggleFeedbackForm}>
            <div className="help-link-icon">
              <FaCommentAlt />
            </div>
            <h3>Share Feedback</h3>
            <p>Help us improve your parking experience</p>
            <div className="help-link-action">
              Give Feedback <FaArrowRight className="help-arrow-icon" />
            </div>
          </div>
        </section>

        {/* Feedback Form (toggleable) */}
        {showFeedbackForm && (
          <section className="help-feedback-section">
            <FeedbackForm onSubmitSuccess={handleFeedbackSubmitSuccess} />
          </section>
        )}
        
        {/* FAQ section */}
        <section className="help-faq-section">
          <div className="help-section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Find quick answers to common questions</p>
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
        
        {/* Contact support section */}
        <section className="help-contact-section">
          <div className="help-contact-card">
            <div className="help-contact-content">
              <h2>Still need help?</h2>
              <p>Our dedicated support team is ready to assist you with any issues or questions you might have.</p>
              <div className="help-contact-methods">
                <div className="help-contact-method">
                  <div className="help-contact-icon">
                    <FaHeadset />
                  </div>
                  <div className="help-contact-info">
                    <h4>Live Chat</h4>
                    <p>Available Monday-Friday, 9am-5pm EST</p>
                    <button className="help-contact-button">Start Chat</button>
                  </div>
                </div>
                
                <div className="help-contact-method">
                  <div className="help-contact-icon">
                    <MdOutlineEmail />
                  </div>
                  <div className="help-contact-info">
                    <h4>Email Support</h4>
                    <p>We'll respond within 24 hours</p>
                    <button className="help-contact-button">Send Email</button>
                  </div>
                </div>
                
                <div className="help-contact-method">
                  <div className="help-contact-icon">
                    <FaPhone />
                  </div>
                  <div className="help-contact-info">
                    <h4>Phone Support</h4>
                    <p>(631) 555-1234, Mon-Fri 8am-6pm</p>
                    <button className="help-contact-button">Call Now</button>
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