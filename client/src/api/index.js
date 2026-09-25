import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth API
export const loginUser = (formData) => API.post('/auth/login', formData);
export const registerUser = (formData) => API.post('/auth/register', formData);
export const getMe = () => API.get('/auth/me');

// Complaints API
export const createComplaint = (formData) => API.post('/complaints', formData);
export const getComplaints = () => API.get('/complaints');
export const getMyComplaints = () => API.get('/complaints/mine');
export const getAssignedComplaints = () => API.get('/complaints/assigned');
export const updateComplaintStatus = (id, status) => API.patch(`/complaints/${id}/status`, { status });
export const markComplaintRead = (id, isRead) => API.patch(`/complaints/${id}/read`, { isRead });
export const reassignComplaint = (id, authorityId) => API.patch(`/complaints/${id}/reassign`, { authorityId });

// Authorities API
export const getAuthorities = () => API.get('/authorities');
export const createAuthority = (data) => API.post('/authorities', data);
export const updateAuthority = (id, data) => API.patch(`/authorities/${id}`, data);
export const deleteAuthority = (id) => API.delete(`/authorities/${id}`);

// Analytics API
export const getAnalytics = () => API.get('/analytics');
