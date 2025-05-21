import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext(null);

// Setup axios interceptors
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
      if (location.pathname !== "/login") {
        navigate("/login");
      }
    }
  }, [navigate, location.pathname]);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log("Attempting login with:", { email });
      const response = await axios.post("/api/auth/login", { email, password });
      console.log("Login response:", response.data);
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid server response - missing token or user data");
      }

      localStorage.setItem("token", token);
      setUser(user);
      navigate("/");
      return true;
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);

      if (error.response?.status === 401) {
        throw new Error("Invalid email or password");
      } else if (error.response?.status === 400) {
        throw new Error(
          error.response.data.errors?.[0]?.msg || "Invalid input"
        );
      } else {
        throw new Error("An error occurred during login. Please try again");
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
