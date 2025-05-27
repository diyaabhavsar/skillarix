import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, HelpCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "./Breadcrumbs";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface MainHeaderProps {
  showBreadcrumbs?: boolean;
  breadcrumbs?: BreadcrumbItem[];
}

const MainHeader = ({ showBreadcrumbs = false, breadcrumbs = [] }: MainHeaderProps) => {
  return (
    <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur-sm shadow-sm animate-fade-in">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="transition-transform hover:scale-105" />
        
        {showBreadcrumbs && (
          <div className="animate-slide-in">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
      </div>
      
      {/* Header-specific options - only keeping search */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="transition-colors hover:bg-accent rounded-full"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="transition-colors hover:bg-accent rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Button>
        
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
  );
};

export default MainHeader;
