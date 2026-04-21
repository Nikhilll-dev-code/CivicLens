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

// Complaints API
export const createComplaint = (formData) => API.post('/complaints', formData);
export const getComplaints = () => API.get('/complaints');
export const getMyComplaints = () => API.get('/complaints/my');
export const updateComplaintStatus = (id, status) => API.put(`/complaints/${id}`, { status });
export const markComplaintRead = (id, isRead) => API.put(`/complaints/${id}/read`, { isRead });
export const forwardComplaint = (id) => API.post(`/complaints/forward/${id}`);
