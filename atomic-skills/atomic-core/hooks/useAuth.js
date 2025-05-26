import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "@core/utils/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }

      // Ensure axios is configured with the token
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Try to get user info with current token
      const response = await axios.get("/api/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Auth check error:", error);
      // Clear token and user state for any auth-related error
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);

      if (location.pathname !== "/login") {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);
  const login = async (email, password) => {
    try {
      // Clear existing auth state
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);

      const response = await axios.post("/api/auth/login", { email, password });
      console.log("Login response:", response.data); // Debug log

      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error("Некорректный ответ от сервера");
      }

      const { token, user: userData } = response.data;

      // Store token
      localStorage.setItem("token", token);

      // Set auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Update user state and navigate
      setUser(userData);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      // Clear auth state on error
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);

      if (error.response?.status === 401) {
        throw new Error("Неверный email или пароль");
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Произошла ошибка при входе в систему");
      }
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }
  return context;
};
