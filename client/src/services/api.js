// src/services/ApiService.js - updated version

import axios from 'axios';

/* ------------------------------------------------------------------ */
/* Axios instance with auth header                                    */
/* ------------------------------------------------------------------ */
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ------------- generic error helper ------------ */
const handleApiError = (error) => {
  console.error('API Error:', error);

  if (error.response) {
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('p4sbuUsername');
      localStorage.removeItem('isAdmin');
      window.location.href = '/';
    }
    return Promise.reject(error.response.data);
  }

  if (error.request) {
    return Promise.reject({ message: 'Server not responding. Please try again later.' });
  }

  return Promise.reject({ message: 'Error setting up request.' });
};

/* ----- helpers for storing lightweight profile in localStorage ---- */
const saveUserData = (userData) =>
  localStorage.setItem('userData', JSON.stringify(userData));

const getUserData = () => {
  const data = localStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
};

/* ------------------------------------------------------------------ */
/* Exported service                                                   */
/* ------------------------------------------------------------------ */
const ApiService = {
  /* ======================= AUTH ======================= */
  auth: {
    /** POST /auth/login */
    login: async (credentials) => {
      try {
        const response = await API.post('/auth/login', credentials);
        const data = response.data;

        if (data && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('p4sbuUsername', data.username || 'User');

          if (data.role === 'admin') {
            localStorage.setItem('isAdmin', 'true');
          } else {
            localStorage.removeItem('isAdmin');
          }
        }
        return data;
      } catch (error) {
        return handleApiError(error);
      }
    },

    /** POST /auth/register */
    register: async (userData) => {
      try {
        const { data } = await API.post('/auth/register', userData);
        return data; // backend responds with success + message
      } catch (error) {
        return handleApiError(error);
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('p4sbuUsername');
      localStorage.removeItem('userData');
      localStorage.removeItem('paymentMethods');
      localStorage.removeItem('isAdmin');
      return Promise.resolve({ success: true });
    },

    isAdmin: () => localStorage.getItem('isAdmin') === 'true'
  },

  /* ======================= USER ======================= */
  user: {
    getProfile: async () => {
      try {
        // simple client‑side cache first
        const cached = getUserData();
        if (cached) return cached;

        const { data } = await API.get('/users/me');
        saveUserData(data);
        return data;
      } catch (error) {
        return handleApiError(error);
      }
    },

    updateProfile: async (payload) => {
      try {
        const { data } = await API.put('/users/me', payload);
        saveUserData(data.user);
        return data;
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  
  // Map related endpoints - RESTORING MOCK DATA FOR PARKING SEARCH
  map: {
    getParkingSpots: async (lotId) => {
      try {
        // DEMO MODE: Generate mock parking spots
        const features = [];
        
        for (let i = 1; i <= 40; i++) {
          const spotId = i.toString().padStart(3, '0');
          const available = Math.random() > 0.2;
          
          features.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-73.1265 + (Math.random() * 0.001 - 0.0005), 40.9127 + (Math.random() * 0.001 - 0.0005)]
            },
            properties: {
              id: spotId,
              userID: available ? 0 : Math.floor(Math.random() * 1000),
              status: available ? "available" : "occupied",
              price: 2.50,
              timeRestriction: "2 hours",
              type: "regular"
            }
          });
        }
        
        return {
          type: "FeatureCollection",
          features
        };
      } catch (error) {
        return handleApiError(error);
      }
    },
    
    getParkingSpot: async (spotId) => {
      try {
        // DEMO MODE: Return a mock spot
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [-73.1265, 40.9127]
          },
          properties: {
            id: spotId,
            userID: 0,
            status: "available",
            price: 2.50,
            timeRestriction: "2 hours",
            type: "regular"
          }
        };
      } catch (error) {
        return handleApiError(error);
      }
    },
    
    searchNearBuilding: async (buildingName) => {
      try {
        // DEMO MODE: Return mock nearby spots
        return {
          building: {
            name: buildingName,
            coordinates: [-73.1260, 40.9125]
          },
          nearbySpots: [
            {
              id: 'lot1',
              name: 'Main Library Lot',
              distance: '5 min walk',
              availableSpots: 12,
              totalSpots: 50,
              pricePerHour: 2.0,
              coordinates: [-73.1265, 40.9127]
            },
            {
              id: 'lot2',
              name: 'Engineering Building Lot',
              distance: '8 min walk',
              availableSpots: 8,
              totalSpots: 30,
              pricePerHour: 2.0,
              coordinates: [-73.1275, 40.9137]
            }
          ]
        };
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  
  // Reservation related endpoints
  reservation: {
    create: async (reservationData) => {
      try {
        // DEMO MODE: Create a mock reservation response
        // Create a reservation ID
        const reservationId = `res-${Date.now().toString().slice(-6)}`;
        
        // Calculate price
        const startTime = new Date(reservationData.startTime);
        const endTime = new Date(reservationData.endTime);
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        const totalPrice = parseFloat((durationHours * 2.50).toFixed(2)); // $2.50 per hour
        
        // Get existing reservations
        const existingReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        // Add new reservation
        const newReservation = {
          id: reservationId,
          ...reservationData,
          status: 'pending',
          totalPrice,
          paymentStatus: 'unpaid',
          createdAt: new Date().toISOString()
        };
        
        existingReservations.push(newReservation);
        localStorage.setItem('reservations', JSON.stringify(existingReservations));
        
        return {
          success: true,
          message: 'Reservation created successfully',
          reservationId,
          totalPrice
        };
      } catch (error) {
        return handleApiError(error);
      }
    },
    
    getAll: async () => {
      try {
        // DEMO MODE: Return reservations from localStorage or create defaults
        const savedReservations = localStorage.getItem('reservations');
        if (savedReservations) {
          return JSON.parse(savedReservations);
        }
        
        // Create default reservations if none exist
        const defaultReservations = [
          {
            id: `res-${(Date.now() - 100000).toString().slice(-6)}`,
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            totalPrice: 5.00,
            paymentStatus: 'unpaid',
            spot: {
              id: '001',
              lotId: 'cpc01',
              coordinates: [-73.1265, 40.9127]
            }
          },
          {
            id: `res-${(Date.now() - 200000).toString().slice(-6)}`,
            startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() + 52 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            totalPrice: 10.00,
            paymentStatus: 'paid',
            spot: {
              id: '007',
              lotId: 'cpc01',
              coordinates: [-73.1268, 40.9130]
            }
          }
        ];
        
        localStorage.setItem('reservations', JSON.stringify(defaultReservations));
        return defaultReservations;
      } catch (error) {
        return handleApiError(error);
      }
    },
    
    getById: async (id) => {
      try {
        // Get all reservations
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        // Find the specific reservation
        const reservation = reservations.find(r => r.id === id);
        
        if (reservation) {
          return reservation;
        }
        
        // If not found, return a mock reservation
        return {
          id: id,
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          totalPrice: 5.00,
          paymentStatus: 'unpaid',
          spot: {
            id: '001',
            lotId: 'cpc01',
            coordinates: [-73.1265, 40.9127]
          }
        };
      } catch (error) {
        return handleApiError(error);
      }
    },
    
    update: async (id, data) => {
      try {
        // Get all reservations
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        // Find and update the specific reservation
        const updatedReservations = reservations.map(reservation => {
          if (reservation.id === id) {
            // Calculate new price if start/end times changed
            let totalPrice = reservation.totalPrice;
            
            if (data.startTime && data.endTime) {
              const startTime = new Date(data.startTime);
              const endTime = new Date(data.endTime);
              const durationHours = (endTime - startTime) / (1000 * 60 * 60);
              totalPrice = parseFloat((durationHours * 2.50).toFixed(2)); // $2.50 per hour
            }
            
            return {
              ...reservation,
              ...data,
              totalPrice
            };
          }
          return reservation;
        });
        
        // Save updated reservations
        localStorage.setItem('reservations', JSON.stringify(updatedReservations));
        
        // Find the updated reservation
        const updatedReservation = updatedReservations.find(r => r.id === id);
        
        return {
          success: true,
          message: 'Reservation updated successfully',
          reservation: updatedReservation
        };
      } catch (error) {
        return handleApiError(error);
      }
    },
    
    cancel: async (id) => {
      try {
        // Get all reservations
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        // Update the status of the specific reservation to 'cancelled'
        const updatedReservations = reservations.map(reservation => {
          if (reservation.id === id) {
            return {
              ...reservation,
              status: 'cancelled'
            };
          }
          return reservation;
        });
        
        // Save updated reservations
        localStorage.setItem('reservations', JSON.stringify(updatedReservations));
        
        return {
          success: true,
          message: 'Reservation cancelled successfully'
        };
      } catch (error) {
        return handleApiError(error);
      }
    }
  },
  
  // Payment related endpoints
  payment: {
     createCheckoutSession: async (reservationId) => {
        try {
         const { data } = await API.post('/payments/checkout', { reservationId });
         return data;
       } catch (error) {
         return handleApiError(error);
       }
     },  
     createTicketCheckoutSession: async (ticketId) => {
            try {
              const { data } = await API.post('/payments/tickets/checkout', { ticketId });
              return data;
            } catch (error) { return handleApiError(error); }
          },
          confirmTicket: async (sessionId) => {
            try {
              const { data } = await API.get(`/payments/tickets/confirm/${sessionId}`);
              return data;
            } catch (error) { return handleApiError(error); }
          },
      createEventReservationCheckoutSession: async (eventReservationId) => {
                  try {
                    const { data } = await API.post(
                      '/payments/event-reservations/checkout',
                      { eventReservationId }
                    );
                    return data;          // { url }
                  } catch (err) { return handleApiError(err); }
                },          
     confirm: async (sessionId) => {
            try {
              const { data } = await API.get(`/payments/confirm/${sessionId}`);
              return data;          
            } catch (error) {
              return handleApiError(error);
            }
          },
      confirmEventReservation: async (sessionId) => {
                  try {
                    const { data } = await API.get(
                      `/payments/event-reservations/confirm/${sessionId}`
                    );
                    return data;
                  } catch (err) { return handleApiError(err); }
                },
      
    getMethods: async () => {
      try {
        // DEMO MODE: Get payment methods from localStorage
        const savedMethods = localStorage.getItem('paymentMethods');
        return savedMethods ? JSON.parse(savedMethods) : [];
      } catch (error) {
        return handleApiError(error);
      }
    },
    
    addMethod: async (paymentMethod) => {
      try {
        // Generate a payment method ID
        const paymentMethodId = `pm-${Date.now()}`;
        
        // Get existing payment methods
        const existingMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
        
        // If this is set as default, update existing methods
        if (paymentMethod.isDefault) {
          existingMethods.forEach(method => {
            method.isDefault = false;
          });
        }
        
        // Add new payment method
        const newMethod = {
          id: paymentMethodId,
          ...paymentMethod
        };
        
        existingMethods.push(newMethod);
        
        // Save to localStorage
        localStorage.setItem('paymentMethods', JSON.stringify(existingMethods));
        
        return {
          success: true,
          message: 'Payment method added successfully',
          paymentMethodId
        };
      } catch (error) {
        return handleApiError(error);
      }
    },
    
    deleteMethod: async (id) => {
      try {
        // Get existing payment methods
        const existingMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]');
        
        // Check if the method to delete is default
        const methodToDelete = existingMethods.find(m => m.id === id);
        const wasDefault = methodToDelete?.isDefault || false;
        
        // Filter out the method to delete
        const updatedMethods = existingMethods.filter(method => method.id !== id);
        
        // If deleted method was default and there are others left, set a new default
        if (wasDefault && updatedMethods.length > 0) {
          updatedMethods[0].isDefault = true;
        }
        
        // Save to localStorage
        localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
        
        return {
          success: true,
          message: 'Payment method deleted successfully'
        };
      } catch (error) {
        return handleApiError(error);
      }
    },
    
    process: async (paymentData) => {
      try {
        // Get all reservations
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        // Find and update the specific reservation payment status
        const updatedReservations = reservations.map(reservation => {
          if (reservation.id === paymentData.reservationId) {
            return {
              ...reservation,
              paymentStatus: 'paid'
            };
          }
          return reservation;
        });
        
        // Save updated reservations
        localStorage.setItem('reservations', JSON.stringify(updatedReservations));
        
        return {
          success: true,
          message: 'Payment processed successfully',
          paymentId: `pmt-${Date.now()}`,
          amount: paymentData.amount || 5.00
        };
      } catch (error) {
        return handleApiError(error);
      }
    }
  }
};

export default ApiService;