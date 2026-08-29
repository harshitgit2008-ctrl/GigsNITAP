import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Security: Attach JWT Token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const getGigs = (params) => API.get('/gigs', { params });
export const getAllGigsAdmin = () => API.get('/gigs/admin/all');
export const getUserGigs = (userId) => API.get(`/gigs/user/${userId}`);
export const completeGig = (gigId, data) => API.patch(`/gigs/${gigId}/complete`, data);
export const createGig = (gigData) => API.post('/gigs', gigData);
export const acceptGig = (gigId, userId) => API.patch(`/gigs/${gigId}/accept`, { userId });
export const registerUser = (userData) => API.post('/users/register', userData);
export const getAllUsers = () => API.get('/users');
export const getUser = (id) => API.get(`/users/${id}`);
export const updateUser = (id, data) => API.patch(`/users/${id}`, data);
export const toggleAvailability = (id) => API.patch(`/users/${id}/availability`);
