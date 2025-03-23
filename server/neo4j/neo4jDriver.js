// server/neo4j/neo4jDriver.js - Mock Version
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// In-memory storage for development
const mockDatabase = {
  users: [],
  parkingSpots: [],
  reservations: [],
  paymentMethods: []
};

// Mock session that implements the Neo4j session interface
class MockSession {
  constructor() {
    this.closed = false;
  }

  async run(query, params = {}) {
    console.log('Mock DB Query:', query);
    console.log('Params:', params);

    // Parse the query to determine what operation to perform
    if (query.includes('CREATE (u:User')) {
      // Handle user creation
      const userId = params.userId || Date.now().toString();
      const newUser = {
        id: userId,
        username: params.username,
        email: params.email,
        password: params.hashedPassword,
        sbuId: params.sbuId,
        driversLicense: params.driversLicense,
        vehicleInfo: params.vehicleInfo,
        contactInfo: params.contactInfo,
        address: params.address,
        createdAt: new Date().toISOString()
      };
      
      mockDatabase.users.push(newUser);
      
      return {
        records: [{
          get: (field) => ({ properties: newUser })
        }]
      };
    }
    
    if (query.includes('MATCH (u:User {email: $email})')) {
      // Handle user login
      const user = mockDatabase.users.find(u => u.email === params.email);
      
      if (!user) {
        return { records: [] };
      }
      
      return {
        records: [{
          get: (field) => ({ properties: user })
        }]
      };
    }
    
    if (query.includes('MATCH (u:User {id: $userId})')) {
      // Handle get user profile
      const user = mockDatabase.users.find(u => u.id === params.userId);
      
      if (!user) {
        return { records: [] };
      }
      
      return {
        records: [{
          get: (field) => ({ properties: user })
        }]
      };
    }
    
    // Handle parking spot queries
    if (query.includes('ParkingSpot') || query.includes('parking-spots')) {
      // Generate mock parking spots if none exist
      if (mockDatabase.parkingSpots.length === 0) {
        generateMockParkingSpots();
      }
      
      return {
        records: mockDatabase.parkingSpots.map(spot => ({
          get: (field) => ({ properties: spot })
        }))
      };
    }
    
    // Default response for unhandled queries
    return { records: [] };
  }

  async close() {
    this.closed = true;
  }
}

// Function to generate mock parking spots
function generateMockParkingSpots() {
  for (let i = 1; i <= 40; i++) {
    const spotId = i.toString().padStart(3, '0');
    const isAvailable = Math.random() > 0.2;
    
    mockDatabase.parkingSpots.push({
      id: spotId,
      lotId: 'cpc01',
      userID: isAvailable ? 0 : Math.floor(Math.random() * 1000) + 1,
      status: isAvailable ? "available" : "occupied",
      price: 2.50,
      timeRestriction: "2 hours",
      type: "regular",
      coordinates: [-73.1265 + (Math.random() * 0.002), 40.9127 + (Math.random() * 0.002)]
    });
  }
}

// Mock driver object that implements the Neo4j driver interface
const mockDriver = {
  session: () => new MockSession(),
  close: () => console.log('Mock Neo4j driver closed')
};

// Test connection
console.log('Using mock Neo4j database for development');

// Handle application termination
process.on('exit', () => {
  console.log('Mock Neo4j driver closed');
});

module.exports = mockDriver;