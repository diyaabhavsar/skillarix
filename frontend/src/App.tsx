import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Practice from "./pages/Practice";
import PracticeSessionPage from "./pages/PracticeSession";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import AppLayout from "./components/AppLayout";

// New admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import SessionSetupPage from "@/pages/session/setup";
import ChatSessionPage from "@/pages/session/chat";

// Import the new TestSetup page component
import TestSetup from "./pages/TestSetup";
import Categories from "./pages/Categories";
import SessionFeedback from "./pages/feedback/SessionFeedback";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />

              {/* Regular user routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute>
                    <AppLayout
                      showBreadcrumbs={true}
                      breadcrumbs={[
                        { label: "Categories", path: "/categories" },
                      ]}
                    >
                      <Categories />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <AppLayout
                      showBreadcrumbs={true}
                      breadcrumbs={[{ label: "Products", path: "/products" }]}
                    >
                      <Products />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test-setup"
                element={
                  <ProtectedRoute>
                    <AppLayout
                      showBreadcrumbs={true}
                      breadcrumbs={[
                        { label: "Dashboard", path: "/dashboard" },
                        { label: "Test Setup", path: "/test-setup" },
                      ]}
                    >
                      <TestSetup />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice"
                element={
                  <ProtectedRoute>
                    <AppLayout
                      showBreadcrumbs={true}
                      breadcrumbs={[
                        { label: "Dashboard", path: "/dashboard" },
                        { label: "Practice", path: "/practice" },
                      ]}
                    >
                      <Practice />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/session/setup"
                element={
                  <ProtectedRoute>
                    <SessionSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/session/chat"
                element={
                  <ProtectedRoute>
                    <ChatSessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/practice-session"
                element={
                  <ProtectedRoute>
                    <PracticeSessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/final-session"
                element={
                  <ProtectedRoute>
                    <PracticeSessionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppLayout
                      showBreadcrumbs={true}
                      breadcrumbs={[
                        { label: "Dashboard", path: "/dashboard" },
                        { label: "Settings", path: "/settings" },
                      ]}
                    >
                      <Settings />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin-only routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <AppLayout
                      showBreadcrumbs={true}
                      breadcrumbs={[
                        { label: "Admin Dashboard", path: "/admin/dashboard" },
                      ]}
                    >
                      <AdminDashboard />
                    </AppLayout>
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <AppLayout
                      showBreadcrumbs={true}
                      breadcrumbs={[
                        { label: "Admin Dashboard", path: "/admin/dashboard" },
                        { label: "Manage Users", path: "/admin/users" },
                      ]}
                    >
                      <ManageUsers />
                    </AppLayout>
                  </RoleProtectedRoute>
                }
              />

              <Route
                path="/feedback/:sessionId"
                element={
                  <ProtectedRoute>
                    <AppLayout
                      showBreadcrumbs={true}
                      breadcrumbs={[
                        { label: "Practice", path: "/practice" },
                        { label: "Session Feedback", path: "" },
                      ]}
                    >
                      <SessionFeedback />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
