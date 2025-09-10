# P4SBU Smart Parking System

## 🚗 Overview

**P4SBU Smart Parking System** is a sophisticated, scalable web application crafted to revolutionize parking management at Stony Brook University (SBU). Designed for both everyday users and administrators, it utilizes a React frontend, Node.js/Express backend, and powerful databases (MongoDB + Neo4j) to deliver real-time parking analytics, secure spot reservations, seamless payments, automated campus guidance, and robust admin controls.

---

## 👥 Team SBU01

---

## 📦 Technology Stack

- **Frontend:** React.js, Axios, React Router, Material UI
- **Backend:** Node.js, Express.js, RESTful API
- **Databases:**
  - **MongoDB:** Central repository for users, lots, spots, reservations, payments, feedback, occupancy analytics
  - **Neo4j:** Graph database for campus map, wayfinding, route optimization
- **Authentication & Authorization:** JWT-based authentication, role-based access (Admin, Staff, Student)
- **DevOps & Configuration:** dotenv for environment variables, CORS, body-parser, mongoose, neo4j-driver

---

## 🚀 Key Features

### 👤 User & Admin Management
- **User Registration/Login:** Secure JWT login for all users
- **Role-Based Access:**  
  - **Admin:** Full control over parking lots, spot allocation, user management, analytics, and system configuration  
  - **Students & Visitors:** Access to spot reservation, payments, and feedback

### 🅿️ Parking & Reservation
- **Live Lot Status:** Real-time availability and occupancy per lot
- **Spot Reservation:** Book spots with OTP verification and conflict-free scheduling
- **Admin Tools:** Add/remove lots/spots, override reservations, 

### 💳 Payment Integration
- **Secure Payments:** Reserve spots and permits with integrated payment gateways (Stripe, PayPal planned)
- **Transaction History:** View and download payment receipts

### 🗺️ Wayfinding & Campus Navigation
- **Graph-Based Routing:** Neo4j-powered optimal pathfinding to lots/spots
- **Map Visualization:** Interactive campus maps for users

### 📊 Analytics & Feedback
- **Occupancy History:** Trends, peak times, predictive analysis for admins
- **Feedback System:** Collect ratings/comments for ongoing system improvement

### 🔒 Security & Environment
- **JWT-secured API:** Robust session control and data protection
- **Configurable via `.env`:** Flexible deployment without exposing sensitive data

---

## 🏗️ Architecture Diagram

```
[React Frontend] ⇄ [Node.js/Express Backend]
       |                       |
   [Axios]                 [REST API]
       |                       |
   [MongoDB]             [Neo4j GraphDB]
```

---

## ⚡ Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+ recommended)
- [Git](https://git-scm.com/)
- Remote MongoDB (e.g., [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Neo4j Aura or local Neo4j instance

---

### 1. Clone the Repository

```bash
git clone https://github.com/nikhil2330/Parking-Management-System-for-SBU.git
cd Parking-Management-System-for-SBU
```

---

### 2. Install Backend Dependencies

```bash
cd server
npm install
# Installs express, cors, body-parser, mongoose, neo4j-driver, dotenv
```

---

### 3. Install Frontend Dependencies

```bash
cd client
npm install
# Installs axios, react-router-dom, material-ui, etc.
```

---

### 4. Configure Environment Variables

Create a `.env` file in `/server/config/` and `/client/config/` as needed. Example:

**server/.env**
```
MONGO_URI=your_mongo_connection_string
NEO4J_URI=bolt://your_neo4j_host:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
PORT=5000
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

**client/.env**
```
REACT_APP_API_BASE_URL=http://localhost:5000
```

> **IMPORTANT:** Never commit your `.env` files or secrets to version control!

---

### 5. Run The Application

#### Backend

```bash
cd server
npm start      # or: node server.js
```

#### Frontend

```bash
cd client
npm start
```

---

## 🧩 Folder Structure

```
Parking-Management-System-for-SBU/
├── client/         # React frontend
├── server/         # Node.js backend
│   ├── config/     # .env and configuration files
│   ├── models/     # Mongoose schemas for MongoDB
│   ├── routes/     # Express route controllers
│   ├── neo4j/      # Neo4j integration & queries
│   └── utils/      # Utility functions
└── README.md
```

---

## 🗺️ Database Models Overview

### MongoDB Collections

- **User:** `{ id, name, email, passwordHash, role (admin/staff/student), reservations, ... }`
- **ParkingLot:** `{ id, name, location, spots, occupancyHistory, ... }`
- **ParkingSpot:** `{ id, lotId, number, status, reservationId, ... }`
- **Reservation:** `{ id, userId, spotId, startTime, endTime, paymentId, otp, ... }`
- **Payment:** `{ id, reservationId, amount, status, timestamp, ... }`
- **Feedback:** `{ id, userId, text, rating, timestamp, ... }`
- **OccupancyHistory:** `{ lotId, timestamp, occupancyPercent, ... }`

### Neo4j Graph

- **Nodes:** Buildings, ParkingSpots, Intersections
- **Relationships:** CONNECTED_TO_SPOT, CONNECTED_TO, CONNECTED_TO_BUILDING

---

## 🔒 Security & Best Practices

- All sensitive config is stored in `.env` files (never commit secrets).
- JWT authentication and HTTPS recommended for production.
- Role-based API endpoints for admin operations.
- RESTful design principles and modular architecture.

---

## 🛠️ Planned Enhancements

- **Neo4j-powered Wayfinding:** Advanced routing from user location to available spots
- **Mobile App:** React Native or Flutter frontend
- **Automated Occupancy Sensors:** IoT for real-time spot status
- **Multi-campus Support:** Extend to other universities
- **Role-Based Dashboards:** Custom tools for admins, staff, students

---

## 🏫 License & Attribution

This project is an academic initiative for Stony Brook University.  
See [LICENSE](LICENSE) for details.

---

## 🤝 Contribution Guidelines

We welcome pull requests and suggestions!  
For major changes, please discuss in advance via [GitHub Issues](https://github.com/nikhil2330/Parking-Management-System-for-SBU/issues).

---

## 📧 Contact & Support

For questions, contact Team SBU0 or reach out to [nikhil2330](https://github.com/nikhil2330), who can also help you contact the rest of the team members.

