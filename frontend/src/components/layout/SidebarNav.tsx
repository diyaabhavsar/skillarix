import { NavLink } from "react-router-dom";
import { 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileUp,
  MessageSquare,
  Settings,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarNavProps {
  isActive: (path: string) => boolean;
}

const SidebarNav = ({ isActive }: SidebarNavProps) => {
  const { user, isAdmin } = useAuth();
  
  // Common navigation items for all users
  const commonNavItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Setup", icon: FileUp, path: "/setup" },
    { label: "Test Setup", icon: Settings, path: "/test-setup" },
    { label: "Practice", icon: MessageSquare, path: "/practice" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  // Admin-specific navigation items
  const adminNavItems = [
    { label: "Admin Dashboard", icon: ShieldCheck, path: "/admin/dashboard" },
    { label: "Manage Users", icon: Users, path: "/admin/users" },
  ];

  // Determine which items to show based on user role
  const navItems = isAdmin() ? [...adminNavItems, ...commonNavItems] : commonNavItems;

  return (
    <SidebarContent className="pt-4">
      <SidebarGroup>
        <SidebarGroupLabel>{isAdmin() ? "Admin Navigation" : "Navigation"}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive(item.path)}
                  tooltip={item.label}
                >
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => 
                      `flex items-center gap-2 transition-all duration-200 hover:bg-sidebar-accent/70 relative
                      ${isActive ? 
                        'before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary before:rounded-r animate-fade-in' : 
                        'hover:translate-x-1'
                      }`
                    }
                  >
                    <item.icon className={`h-4 w-4 transition-colors duration-200`} />
                    <span>{item.label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
};

export default SidebarNav;
