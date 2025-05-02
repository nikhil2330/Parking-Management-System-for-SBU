import axios from 'axios';

// Create axios instance with auth header
const API = axios.create({
  baseURL: '/api'
});

// Add request interceptor to automatically include token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const createEventReservation = async (data) => {
  try {
    console.log('Sending event reservation data:', data);
    const response = await API.post('/event-reservation', data);
    console.log('Event Reservation API response:', response);
    return response.data;
  } catch (error) {
    // Detailed error logging
    console.error('Event Reservation API error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.data?.details) {
      console.error('Server error details:', error.response.data.details);
    }
    
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to create event reservation');
    } else {
      throw new Error(error.message || 'Network error when creating event reservation');
    }
  }
};

const getEventReservations = async () => {
  try {
    const response = await API.get('/event-reservation');
    return response.data;
  } catch (error) {
    console.error('Error fetching event reservations:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to fetch event reservations');
    } else {
      throw new Error(error.message || 'Network error when fetching event reservations');
    }
  }
};

const getPendingEventReservations = async () => {
  try {
    const response = await API.get('/event-reservation/pending');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending event reservations:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to fetch pending event reservations');
    } else {
      throw new Error(error.message || 'Network error when fetching pending event reservations');
    }
  }
};

const approveEventReservation = async (id, notes) => {
  try {
    const response = await API.patch(`/event-reservation/${id}/approve`, { adminNotes: notes });
    return response.data;
  } catch (error) {
    console.error('Error approving event reservation:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to approve event reservation');
    } else {
      throw new Error(error.message || 'Network error when approving event reservation');
    }
  }
};

const rejectEventReservation = async (id, notes) => {
  try {
    const response = await API.patch(`/event-reservation/${id}/reject`, { adminNotes: notes });
    return response.data;
  } catch (error) {
    console.error('Error rejecting event reservation:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to reject event reservation');
    } else {
      throw new Error(error.message || 'Network error when rejecting event reservation');
    }
  }
};

const cancelEventReservation = async (id) => {
  try {
    const response = await API.delete(`/event-reservation/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling event reservation:', error);
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Failed to cancel event reservation');
    } else {
      throw new Error(error.message || 'Network error when cancelling event reservation');
    }
  }
};

export default {
  createEventReservation,
  getEventReservations,
  getPendingEventReservations,
  approveEventReservation,
  rejectEventReservation,
  cancelEventReservation
};