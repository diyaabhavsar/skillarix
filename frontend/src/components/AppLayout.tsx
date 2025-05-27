
import { useLocation } from "react-router-dom";
import { 
  Sidebar, 
  SidebarProvider, 
  useSidebar
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

import SidebarHeader from "./layout/SidebarHeader";
import SidebarNav from "./layout/SidebarNav";
import UserFooter from "./layout/UserFooter";
import MainHeader from "./layout/MainHeader";
import { useEffect } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
  breadcrumbs?: Array<{
    label: string;
    path: string;
  }>;
}

// This component handles sidebar state changes based on viewport
const SidebarController = () => {
  const { isMobile, setOpen } = useSidebar();
  
  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);
  
  return null;
}

const AppLayout = ({ 
  children, 
  showBreadcrumbs = false, 
  breadcrumbs = []
}: AppLayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarController />
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader />
          <SidebarNav isActive={isActive} />
          <UserFooter user={user} />
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <MainHeader 
            showBreadcrumbs={showBreadcrumbs}
            breadcrumbs={breadcrumbs}
          />

          <main className="flex-1 p-4 md:p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
