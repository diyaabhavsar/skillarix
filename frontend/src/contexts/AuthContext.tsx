import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserRole } from "@/types/session";

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
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  loginWithDemo: (role?: UserRole) => Promise<void>;
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
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is logged in and token exists when component mounts
  useEffect(() => {
    const checkAuthStatus = () => {
      // Check local storage for user info
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      if (storedToken) {
        setToken(storedToken);
      }

      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || "Login failed");
        throw new Error(data.detail || "Login failed");
      }
  
      const userData = {
        id: "", // Set this if your backend returns a user id
        email,
        name: data.username, // or data.name if your backend returns it
        role: data.role,
      };
  
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
  
      setUser(userData);
      navigate("/dashboard");
      toast.success(`Login successful as ${data.role}!`);
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login with demo account
  const loginWithDemo = async (role: UserRole = "employee") => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Demo user data
      const demoUser = {
        id: `demo-${role}-123`,
        email: `demo-${role}@example.com`,
        name: `Demo ${role === "admin" ? "Admin" : "User"}`,
        role,
      };
      
      localStorage.setItem("user", JSON.stringify(demoUser));
      setUser(demoUser);
      navigate("/dashboard");
      toast.success(`Logged in as Demo ${role === "admin" ? "Admin" : "Employee"}`);
    } catch (error) {
      console.error("Demo login failed:", error);
      toast.error("Failed to login with demo account");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (email: string, name: string, password: string, role: UserRole = "employee") => {
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

  // Logout function
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    toast.success("Logged out successfully");
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // Simulate API call to backend
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  // Helper functions for role checking
  const isAdmin = () => user?.role === "admin";
  const isEmployee = () => user?.role === "employee";

  const value = {
    user,
    isLoading,
    token,
    login,
    register,
    logout,
    forgotPassword,
    loginWithDemo,
    isAdmin,
    isEmployee,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
