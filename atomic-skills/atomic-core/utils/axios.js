import axios from "axios";
import config from "../config";

axios.defaults.baseURL = config.API_BASE_URL;
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.withCredentials = true;

// Request interceptor to add token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Ensure token is properly formatted
      const authHeader = `Bearer ${token}`;
      config.headers["Authorization"] = authHeader;
      console.log("Request to:", config.url);
      console.log("Auth header:", authHeader);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axios.interceptors.response.use(
  (response) => {
    console.log("Response received:", response.config.url); // Debug log
    return response;
  },
  (error) => {
    console.error("Response error:", error.response?.status, error.config?.url);

    if (error.response?.status === 401) {
      // Clear auth state
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];

      // Only redirect if not already on login page
      if (window.location.pathname !== "/login") {
        console.log("Redirecting to login due to 401");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
