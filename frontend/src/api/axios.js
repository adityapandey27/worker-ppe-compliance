import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL|| 'https://worker-ppe-compliance.onrender.com/api',
  withCredentials: true,
});

// || 'https://worker-ppe-compliance.onrender.com/api',


// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
