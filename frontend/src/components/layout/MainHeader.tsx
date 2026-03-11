import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, HelpCircle, Search, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "./Breadcrumbs";
import { SearchDialog } from "./SearchDialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface MainHeaderProps {
  showBreadcrumbs?: boolean;
  breadcrumbs?: BreadcrumbItem[];
}

interface Notification {
  id: string;
  type: "warning" | "info" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_link?: string;
}

const MainHeader = ({ showBreadcrumbs = false, breadcrumbs = [] }: MainHeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.get<Notification[]>("/notifications");
        setNotifications(data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (notification.action_link) {
      navigate(notification.action_link);
    }
  };

  return (
    <>
      <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm shadow-sm animate-fade-in">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="transition-transform hover:scale-105" />

          {showBreadcrumbs && (
            <div className="animate-slide-in">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          )}
        </div>

        {/* Header-specific options */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="transition-colors hover:bg-accent rounded-full"
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="transition-colors hover:bg-accent rounded-full relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b bg-muted/50">
                <h4 className="font-semibold text-sm">Notifications</h4>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No new notifications
                  </div>
                ) : (
                  <div className="grid divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 items-start",
                          !notification.read && "bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="mt-0.5">
                          {notification.type === 'warning' && <AlertCircle className="h-4 w-4 text-amber-500" />}
                          {notification.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                          {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Today
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="transition-colors hover:bg-accent rounded-full"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
};

export default MainHeader;
