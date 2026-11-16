import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tt_unik_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatZAR(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(Number(amount || 0));
}

export default api;