
import { ReactNode } from 'react';
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Array<"admin" | "employee">;
}

const RoleProtectedRoute = ({ children, allowedRoles }: RoleProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  // Show nothing while checking authentication status
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Redirect to dashboard if not authorized for this role
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authorized, render the protected content
  return <>{children}</>;
};

export default RoleProtectedRoute;
