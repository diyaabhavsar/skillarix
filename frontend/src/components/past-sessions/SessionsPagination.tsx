import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

export interface PaginationData {
  skip: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}

interface SessionsPaginationProps {
  currentPage: number;
  paginationData: PaginationData;
  onPageChange: (page: number) => void;
}

const SessionsPagination = ({ 
  currentPage, 
  paginationData,
  onPageChange 
}: SessionsPaginationProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { limit, total_pages } = paginationData;

  // Function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show before and after current page
    const range = [];
    const rangeWithDots = [];

    // Always show first page
    range.push(1);

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < total_pages) {
        range.push(i);
      }
    }

    // Always show last page
    if (total_pages > 1) {
      range.push(total_pages);
    }

    // Add ellipsis where needed
    let l;
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className={cn(
      "py-6 border-t",
      isDark ? "border-slate-800" : "border-slate-200"
    )}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className={cn(
          "text-sm",
          isDark ? "text-slate-400" : "text-slate-600"
        )}>
          Showing <span className="font-medium text-foreground">
            {(currentPage - 1) * limit + 1}
          </span> to <span className="font-medium text-foreground">
            {Math.min(currentPage * limit, paginationData.total_count)}
          </span> of{" "}
          <span className="font-medium text-foreground">
            {paginationData.total_count}
          </span> entries
        </p>
        
        <Pagination>
          <PaginationContent className="gap-1">
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "h-8 w-8 transition-all duration-200",
                  currentPage === 1 ? "opacity-50" : "hover:bg-muted",
                  isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>

            {getPageNumbers().map((pageNum, index) => {
              if (pageNum === '...') {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <div className="h-8 w-8 flex items-center justify-center">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </PaginationItem>
                );
              }

              const page = Number(pageNum);
              const isActive = currentPage === page;

              return (
                <PaginationItem key={page}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onPageChange(page)}
                    className={cn(
                      "h-8 w-8 transition-all duration-200",
                      isActive 
                        ? "bg-primary hover:bg-primary/90"
                        : cn(
                            "hover:bg-muted",
                            isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                          )
                    )}
                  >
                    <span className={cn(
                      "text-sm",
                      isActive ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {page}
                    </span>
                  </Button>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => currentPage < total_pages && onPageChange(currentPage + 1)}
                disabled={currentPage === total_pages}
                className={cn(
                  "h-8 w-8 transition-all duration-200",
                  currentPage === total_pages ? "opacity-50" : "hover:bg-muted",
                  isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default SessionsPagination;
