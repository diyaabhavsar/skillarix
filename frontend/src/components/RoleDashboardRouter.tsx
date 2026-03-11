import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import SalesmanDashboard from "@/pages/SalesmanDashboard";

/**
 * RoleDashboardRouter - Routes users to their role-specific dashboard
 * 
 * - Admin → AdminDashboard
 * - Salesman → SalesmanDashboard  
 * - Employee → Dashboard (standard employee dashboard)
 */
const RoleDashboardRouter = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // Route based on user role
    const normalizedRole = user.role?.toLowerCase() || "salesman";

    switch (normalizedRole) {
        case "admin":
            return <AdminDashboard />;
        case "salesman":
        case "employee":
        case "user":
            return <SalesmanDashboard />;
        default:
            // Fallback to SalesmanDashboard as the default user dashboard
            // The original Dashboard component had mock data
            return <SalesmanDashboard />;
    }
};

export default RoleDashboardRouter;
