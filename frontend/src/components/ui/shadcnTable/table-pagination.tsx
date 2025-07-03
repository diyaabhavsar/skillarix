import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/shadcnTable/pagination";
import { PaginationData } from "@/types/table-types";

interface TablePaginationProps {
  currentPage: number;
  paginationData: PaginationData;
  onPageChange?: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  paginationData,
  onPageChange,
}) => {
  // Function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const { total_pages } = paginationData;
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
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="mt-4 px-6 py-4 bg-white border rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          Showing{" "}
          <span className="font-medium text-foreground">
            {(currentPage - 1) * paginationData.limit + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {Math.min(currentPage * paginationData.limit, paginationData.total_count)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">
            {paginationData.total_count}
          </span>{" "}
          entries
        </p>

        <Pagination>
          <PaginationContent className="gap-2">
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => currentPage > 1 && onPageChange?.(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "h-9 w-9 rounded-md border-muted transition-all duration-200",
                  currentPage === 1 ? "opacity-50" : "hover:bg-muted/50"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>

            {getPageNumbers().map((pageNum, index) => {
              if (pageNum === "...") {
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <div className="h-9 w-9 flex items-center justify-center">
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
                    variant={isActive ? "default" : "outline"}
                    size="icon"
                    onClick={() => onPageChange?.(page)}
                    className={cn(
                      "h-9 w-9 rounded-md transition-all duration-200",
                      isActive ? "bg-primary hover:bg-primary/90" : "hover:bg-muted/50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-primary-foreground" : "text-foreground"
                      )}
                    >
                      {page}
                    </span>
                  </Button>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  currentPage < paginationData.total_pages &&
                  onPageChange?.(currentPage + 1)
                }
                disabled={currentPage === paginationData.total_pages}
                className={cn(
                  "h-9 w-9 rounded-md border-muted transition-all duration-200",
                  currentPage === paginationData.total_pages
                    ? "opacity-50"
                    : "hover:bg-muted/50"
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
