import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000', // replace with your backend URL if different
});

// Automatically attach JWT token if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

export const getAllPitches = () => API.get('/pitches');
export const createPitch = (data) => API.post('/pitches', data);
export const likePitch = (pitchId) => API.post(`/pitches/${pitchId}/like`);
export const dislikePitch = (pitchId) => API.post(`/pitches/${pitchId}/dislike`);

export default API;