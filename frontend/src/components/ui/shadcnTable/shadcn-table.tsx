import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, PlusIcon } from "lucide-react";
import { ScoreDisplay } from "../score-display";
import { ShadcnColumn, ShadcnTableProps } from "../../../types/table-types";
import { TablePagination } from "./table-pagination";

interface MemoizedTableRowProps {
  columns: ShadcnColumn[];
  row: any;
  rowIndex: number;
  rowClassName?: string;
  onRowClick?: (row: any) => void;
}

export const renderScore = (score: number, maxScore: number = 10) => {
  return <ScoreDisplay score={score} maxScore={maxScore} size="sm" />;
};

export const renderStatus = (status: string) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300";
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300";
      case "in progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300";
    }
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "transition-all duration-200 hover:scale-105",
        getStatusColor()
      )}
    >
      {status}
    </Badge>
  );
};

export const renderAction = (
  label: string,
  onClick: () => void,
  disabled?: boolean
) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 text-primary hover:text-primary hover:bg-primary/10 transition-colors"
    >
      <EyeIcon className="w-4 h-4" />
      {label}
    </Button>
  );
};

const MemoizedTableRow = React.memo<MemoizedTableRowProps>(
  ({ columns, row, rowIndex, rowClassName, onRowClick }) => {
    return (
      <TableRow
        className={cn(
          "transition-all duration-200",
          "hover:bg-muted/50 hover:shadow-sm",
          rowClassName,
          onRowClick && "cursor-pointer"
        )}
        onClick={() => onRowClick?.(row)}
      >
        {columns.map((column) => (
          <TableCell
            key={`${rowIndex}-${column.key}`}
            className={cn("py-4", column.className)}
          >
            {column.render
              ? column.render(row[column.key], row, rowIndex)
              : row[column.key]}
          </TableCell>
        ))}
      </TableRow>
    );
  }
);

MemoizedTableRow.displayName = "MemoizedTableRow";

const ShadcnTable = React.memo(
  <T extends Record<string, any>>({
    columns,
    data,
    isLoading,
    emptyMessage = "Click 'New Session' to start your assessment",
    className,
    rowClassName,
    onRowClick,
    searchable = false,
    searchPlaceholder = "Search...",
    searchKeys = [],
    filters,
    showPagination = false,
    currentPage = 1,
    paginationData,
    onPageChange,
    defaultSearch = "",
  }: ShadcnTableProps<T> & { defaultSearch?: string }) => {
    const [search, setSearch] = React.useState(defaultSearch);

    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
    };

    const filteredData = useMemo(() => {
      if (!searchable || !search.trim()) return data;
      const lower = search.toLowerCase();
      return data.filter((row) =>
        (searchKeys.length ? searchKeys : columns.map((c) => c.key)).some(
          (key) => {
            const value = getNestedValue(row, String(key));
            return value && String(value).toLowerCase().includes(lower);
          }
        )
      );
    }, [search, data, searchable, searchKeys, columns]);

    if (isLoading) {
      return (
        <div className="w-full h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (!filteredData?.length) {
      return (
        <div className="w-full p-12 text-center border rounded-lg bg-muted/5">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="p-4 rounded-full bg-muted/10 w-fit mx-auto">
              <PlusIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              No data available
            </h3>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div
          className={cn(
            "relative w-full overflow-auto rounded-lg border bg-card",
            "transition duration-200 hover:shadow-md",
            className
          )}
        >
          {searchable && (
            <div className="flex items-center gap-2 p-4 border-b bg-muted/10">
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md border text-sm bg-background"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {filters}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "uppercase text-xs tracking-wide font-medium bg-muted/50 py-4",
                      column.headerClassName
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, rowIndex) => (
                <MemoizedTableRow
                  key={row.id || rowIndex}
                  columns={columns}
                  row={row}
                  rowIndex={rowIndex}
                  rowClassName={
                    typeof rowClassName === "function"
                      ? rowClassName(row, rowIndex)
                      : rowClassName
                  }
                  onRowClick={onRowClick}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {showPagination && paginationData && paginationData.total_pages > 1 && (
          <TablePagination
            currentPage={currentPage}
            paginationData={paginationData}
            onPageChange={onPageChange}
          />
        )}
      </div>
    );
  }
);

ShadcnTable.displayName = "ShadcnTable";

export default ShadcnTable;
