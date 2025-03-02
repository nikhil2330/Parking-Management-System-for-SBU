# P4SBU Smart Parking System
## Team SBU01
This project is a web-based smart parking management system for Stony Brook University. It features a React frontend and a Node.js/Express backend that connects to two databases:
- **MongoDB**: A remote database (e.g., via MongoDB Atlas) for storing core application data such as Users, ParkingLots, ParkingSpots, Reservations, Payments, OTPs, Feedback, and OccupancyHistory.
- **Neo4j**: A graph database for managing campus map data and supporting wayfinding queries. *(Note: The current Neo4j driver integration is under development and may have authentication issues that will be resolved in future updates.)*

> **Note:**  
> This project uses a `.env` file for environment configuration. For production, you should remove sensitive data from your repository and set environment variables using your hosting platform’s configuration tools.

---




## Features

- **User Management:** Create and manage user accounts.
- **Parking Management:** View and reserve parking spots.
- **Database Integration:**  
  - **MongoDB:** Remote connection ensures that every update is saved centrally.  
  - **Neo4j:** (Planned) For map and wayfinding functionality.
- **Full-stack Integration:** A React frontend communicates with a Node.js/Express backend via Axios.

---


## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher recommended)
- [Git](https://git-scm.com/)
- A remote MongoDB instance (e.g., [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- Neo4j Aura 

### 1. Clone the Repository
```bash
git clone git@github.com:UrviBhatnagar/CSE416.git
cd CSE416
```
### 2. BackEnd
```bash
cd server 
npm install
npm install express cors body-parser mongoose neo4j-driver dotenv
```
### 3. FrontEnd
```bash
cd client 
npm install
npm install axios
```
### 4. Config

There is a config folder in which a .env file will need to be put with your own variables.

### 5. Running the application
```bash
cd client 
npm start
```
```bash
cd server
node server.js
```




