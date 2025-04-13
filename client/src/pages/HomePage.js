/* -----------------------------------------------------------------------
   HomePage.js — full file with loader, header/footer, and all sections
   ----------------------------------------------------------------------- */

   import React, { useState, useEffect } from 'react';
   import { useNavigate } from 'react-router-dom';
   import Header from '../components/Header';
   import Footer from '../components/Footer';
   import LoadingScreen from '../components/LoadingScreen';   // car loader
   import './premium-home.css';
   
   /* ------------------------------------------------------------------ */
   /* Hook: detects the user’s OS “reduce motion” preference             */
   /* ------------------------------------------------------------------ */
   function usePrefersReducedMotion() {
     const [prefers, setPrefers] = useState(false);
     useEffect(() => {
       const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
       setPrefers(mq.matches);
       const handler = () => setPrefers(mq.matches);
       mq.addEventListener('change', handler);
       return () => mq.removeEventListener('change', handler);
     }, []);
     return prefers;
   }
   
   /* ------------------------------------------------------------------ */
   /* Home Page Component                                                */
   /* ------------------------------------------------------------------ */
   function HomePage() {
     const navigate = useNavigate();
     const [booting, setBooting] = useState(true);           // show loader
     const [currentDate, setCurrentDate] = useState('');
     const [username, setUsername] = useState('User');
     const prefersReducedMotion = usePrefersReducedMotion();
   
     /* simulate short boot delay */
     useEffect(() => {
       const t = setTimeout(() => setBooting(false), 1200);
       return () => clearTimeout(t);
     }, []);
   
     /* initialise date, username & reduced‑motion flag */
     useEffect(() => {
       const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
       setCurrentDate(new Date().toLocaleDateString('en-US', opts));
   
       const stored = localStorage.getItem('p4sbuUsername');
       if (stored) setUsername(stored);
   
       document.body.classList.toggle('reduced-motion', prefersReducedMotion);
     }, [prefersReducedMotion]);
   
     /* navigation helpers */
     const goToSearchParking  = () => navigate('/search-parking');
     const goToReservations   = () => navigate('/reservations');
     const goToPaymentMethods = () => navigate('/payment-methods');
     const handleModify       = () => navigate('/modify-reservation/1'); // example id
     const handleClaim        = () => navigate('/claim-offer');
   
     /* render loader first */
     if (booting) return <LoadingScreen />;
   
     /* ---------------------------------------------------------------- */
     /* Render dashboard                                                 */
     /* ---------------------------------------------------------------- */
     return (
       <div className="premium-home">
         {/* Decorative blobs */}
         <div className="bg-shape shape-1" aria-hidden="true" />
         <div className="bg-shape shape-2" aria-hidden="true" />
   
         {/* Global header */}
         <Header />
   
         {/* ----------------------- DASHBOARD --------------------------- */}
         <div className="dashboard-content">
           <div className="dashboard-grid">
   
             {/* ===== Welcome ===== */}
             <section className="welcome-section">
               <div className="welcome-text">
                 <h1>Welcome back, {username}!</h1>
                 <p>Manage your parking reservations and account details</p>
               </div>
               <div className="welcome-date" role="note" aria-label="Current date">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                 <span>{currentDate}</span>
               </div>
             </section>
   
             {/* ===== Action cards ===== */}
             <div className="action-cards">
               {/* Search */}
               <div className="action-card" role="button" tabIndex="0"
                    onClick={goToSearchParking} aria-label="Search for parking">
                 <div className="card-icon">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="#900"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <circle cx="11" cy="11" r="8" />
                     <line x1="21" y1="21" x2="16.65" y2="16.65" />
                   </svg>
                 </div>
                 <div className="card-content">
                   <h3>Search for Parking</h3>
                   <p>Find available parking spots across campus based on your destination building or preferences.</p>
                 </div>
                 <div className="card-footer">Find Parking<span className="card-arrow">→</span></div>
               </div>
   
               {/* Reservations */}
               <div className="action-card" role="button" tabIndex="0"
                    onClick={goToReservations} aria-label="View reservations">
                 <div className="card-icon">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="#0A2541"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                     <line x1="16" y1="2" x2="16" y2="6" />
                     <line x1="8" y1="2" x2="8" y2="6" />
                     <line x1="3" y1="10" x2="21" y2="10" />
                   </svg>
                 </div>
                 <div className="card-content">
                   <h3>View Reservations</h3>
                   <p>Manage your upcoming parking reservations, modify booking details, or cancel if needed.</p>
                 </div>
                 <div className="card-footer">Manage Reservations<span className="card-arrow">→</span></div>
               </div>
   
               {/* Payments */}
               <div className="action-card" role="button" tabIndex="0"
                    onClick={goToPaymentMethods} aria-label="Manage payment methods">
                 <div className="card-icon">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="#d4af37"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                     <line x1="1" y1="10" x2="23" y2="10" />
                   </svg>
                 </div>
                 <div className="card-content">
                   <h3>Payment Methods</h3>
                   <p>Manage your payment options, view transaction history, and update billing information.</p>
                 </div>
                 <div className="card-footer">Manage Payments<span className="card-arrow">→</span></div>
               </div>
             </div>
   
             {/* ===== Recent Activity ===== */}
             <div className="activity-section">
               <div className="section-container">
                 <div className="section-header">
                   <div className="section-title">
                     <div className="section-icon">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                       </svg>
                     </div>
                     Recent Activity
                   </div>
                   <div className="view-all">View All</div>
                 </div>
   
                 <div className="activity-list">
                   {/* Activity 1 */}
                   <div className="activity-item">
                     <div className="activity-icon">
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                         <line x1="16" y1="2" x2="16" y2="6" />
                         <line x1="8" y1="2" x2="8" y2="6" />
                         <line x1="3" y1="10" x2="21" y2="10" />
                       </svg>
                     </div>
                     <div className="activity-details">
                       <div className="activity-title">Reserved Parking Spot</div>
                       <div className="activity-meta">
                         <div><span className="meta-icon">📍</span> Downtown Garage</div>
                         <div><span className="meta-icon">🕒</span> Oct 15, 2023</div>
                       </div>
                     </div>
                     <div className="activity-amount">$15.00</div>
                   </div>
   
                   {/* Activity 2 */}
                   <div className="activity-item">
                     <div className="activity-icon" style={{ color: '#3b82f6',
                       boxShadow: '0 3px 8px rgba(59,130,246,.1)' }}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                         <polyline points="14 2 14 8 20 8" />
                         <path d="M16 13H8" />
                         <path d="M16 17H8" />
                         <path d="M10 9H8" />
                       </svg>
                     </div>
                     <div className="activity-details">
                       <div className="activity-title">Monthly Parking Report</div>
                       <div className="activity-meta">
                         <div><span className="meta-icon">📊</span> Usage Summary</div>
                         <div><span className="meta-icon">🕒</span> Oct 10, 2023</div>
                       </div>
                     </div>
                   </div>
   
                   {/* Activity 3 */}
                   <div className="activity-item">
                     <div className="activity-icon" style={{ color: '#f59e0b',
                       boxShadow: '0 3px 8px rgba(245,158,11,.1)' }}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <line x1="12" y1="1" x2="12" y2="23" />
                         <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                       </svg>
                     </div>
                     <div className="activity-details">
                       <div className="activity-title">Payment Processed</div>
                       <div className="activity-meta">
                         <div><span className="meta-icon">💳</span> Credit Card</div>
                         <div><span className="meta-icon">🕒</span> Oct 5, 2023</div>
                       </div>
                     </div>
                     <div className="activity-amount">$22.50</div>
                   </div>
                 </div>
               </div>
             </div>
   
             {/* ===== Notifications ===== */}
             <div className="notifications-section">
               <div className="section-container">
                 <div className="section-header">
                   <div className="section-title">
                     <div className="section-icon"
                          style={{ backgroundColor: 'var(--red-50)',
                                   color: 'var(--primary-red)' }}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                         <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                       </svg>
                     </div>
                     Notifications
                   </div>
                   <div className="view-all">View All</div>
                 </div>
   
                 <div className="notification-list">
                   {/* Urgent */}
                   <div className="notification-item urgent">
                     <div className="notification-header">
                       <div className="notification-type">Urgent</div>
                       <div className="notification-time">2 days ago</div>
                     </div>
                     <div className="notification-message">
                       Your reservation at Main St. Lot expires in 2 days. Would you like to extend your parking time?
                     </div>
                     <div className="notification-actions">
                       <button className="notification-btn action-primary"
                               onClick={handleModify}>
                         Modify
                       </button>
                       <button className="notification-btn action-secondary">
                         Dismiss
                       </button>
                     </div>
                   </div>
   
                   {/* Promo */}
                   <div className="notification-item promotional">
                     <div className="notification-header">
                       <div className="notification-type promotional">Offer</div>
                       <div className="notification-time">1 week ago</div>
                     </div>
                     <div className="notification-message">
                       Weekend special: Get 10% off when you reserve parking for Saturday and Sunday.
                     </div>
                     <div className="notification-actions">
                       <button className="notification-btn action-primary"
                               onClick={handleClaim}>
                         Claim Offer
                       </button>
                       <button className="notification-btn action-secondary">
                         Dismiss
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
   
             {/* ===== Stats ===== */}
             <div className="stats-section">
               <div className="stats-grid">
                 {/* Hours parked */}
                 <div className="stat-card">
                   <div className="stat-icon"
                        style={{ backgroundColor: 'var(--red-50)',
                                 color: 'var(--primary-red)' }}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <circle cx="12" cy="12" r="10" />
                       <polyline points="12 6 12 12 16 14" />
                     </svg>
                   </div>
                   <div className="stat-content">
                     <h4>Hours Parked</h4>
                     <div className="stat-value">24.5</div>
                     <div className="stat-trend trend-up">
                       <span className="trend-icon">↑</span> 12% from last month
                     </div>
                   </div>
                 </div>
   
                 {/* Total reservations */}
                 <div className="stat-card">
                   <div className="stat-icon"
                        style={{ backgroundColor: 'var(--blue-50)',
                                 color: 'var(--info-blue)' }}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                       <circle cx="9" cy="7" r="4" />
                       <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                       <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                     </svg>
                   </div>
                   <div className="stat-content">
                     <h4>Total Reservations</h4>
                     <div className="stat-value">12</div>
                     <div className="stat-trend trend-up">
                       <span className="trend-icon">↑</span> 8% from last month
                     </div>
                   </div>
                 </div>
   
                 {/* Total spent */}
                 <div className="stat-card">
                   <div className="stat-icon"
                        style={{ backgroundColor: 'var(--gold-50)',
                                 color: 'var(--warning-orange)' }}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                       <line x1="1" y1="10" x2="23" y2="10" />
                     </svg>
                   </div>
                   <div className="stat-content">
                     <h4>Total Spent</h4>
                     <div className="stat-value">$128.50</div>
                     <div className="stat-trend trend-down">
                       <span className="trend-icon">↓</span> 5% from last month
                     </div>
                   </div>
                 </div>
   
                 {/* Favorite location */}
                 <div className="stat-card">
                   <div className="stat-icon"
                        style={{ backgroundColor: '#e8f5e9',
                                 color: 'var(--success-green)' }}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                          viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                       <polyline points="9 22 9 12 15 12 15 22" />
                     </svg>
                   </div>
                   <div className="stat-content">
                     <h4>Favorite Location</h4>
                     <div className="stat-value">Downtown Garage</div>
                     <div className="stat-trend">
                       <span className="trend-icon">⭐</span> 7 visits this month
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             {/* ===== /Stats ===== */}
           </div>
         </div>
         {/* -------------------- /DASHBOARD ----------------------------- */}
   
         {/* Global footer */}
         <Footer />
       </div>
     );
   }
   
   export default HomePage;
   