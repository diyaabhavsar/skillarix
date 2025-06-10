import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserRole } from "@/types/session";
import { authService } from '@/services/authService';
import { sessionService } from '@/services/sessionService';
import { env } from '@/config/env';

// Define types for our auth context
export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    name: string,
    password: string,
    role?: UserRole
  ) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  isAdmin: () => boolean;
  isEmployee: () => boolean;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          sessionService.initSession(); // Initialize session monitoring
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        localStorage.removeItem("user");
        localStorage.removeItem(env.TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
    return () => sessionService.cleanup();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      const userData: User = {
        id: data.id,
        email,
        name: data.username,
        role: data.role,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem(env.TOKEN_KEY, data.access_token);
      setUser(userData);
      sessionService.initSession(); // Initialize session monitoring
      navigate("/dashboard");
      toast.success(`Login successful!`);
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem(env.TOKEN_KEY);
    setUser(null);
    navigate("/");
    toast.success("Logged out successfully");
  }, [navigate]);

  // Register function
  const register = async (
    email: string,
    name: string,
    password: string,
    role: UserRole = "employee"
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email,
          password,
          role,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.detail || "Registration failed");
        throw new Error(err.detail || "Registration failed");
      }
      toast.success("Registration successful! Please log in.");
      // Optionally, you can auto-login or redirect here
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // Simulate API call to backend
      // Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Password reset email sent
      toast.success(`Password reset link sent to ${email}`);
    } catch (error) {
      console.error("Password reset failed:", error);
      toast.error("Password reset failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    isAdmin: () => user?.role === "admin",
    isEmployee: () => user?.role === "employee",
  }), [user, isLoading, login, register, logout, forgotPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
