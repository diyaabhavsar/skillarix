import React from "react";
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
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EyeIcon, PlusIcon } from "lucide-react";

export interface ShadcnColumn<T = any> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface ShadcnTableProps<T = any> {
  columns: ShadcnColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T) => void;
}

const scoreColorConfig = {
  excellent: {
    light: {
      gradient: "from-emerald-500 to-teal-400",
      ring: "ring-emerald-500/20",
      background: "bg-emerald-50",
      text: "text-emerald-700"
    },
    dark: {
      gradient: "from-emerald-400 to-teal-300",
      ring: "ring-emerald-400/20",
      background: "bg-emerald-500/10",
      text: "text-emerald-300"
    }
  },
  good: {
    light: {
      gradient: "from-green-500 to-emerald-400",
      ring: "ring-green-500/20",
      background: "bg-green-50",
      text: "text-green-700"
    },
    dark: {
      gradient: "from-green-400 to-emerald-300",
      ring: "ring-green-400/20",
      background: "bg-green-500/10",
      text: "text-green-300"
    }
  },
  average: {
    light: {
      gradient: "from-amber-500 to-yellow-400",
      ring: "ring-amber-500/20",
      background: "bg-amber-50",
      text: "text-amber-700"
    },
    dark: {
      gradient: "from-amber-400 to-yellow-300",
      ring: "ring-amber-400/20",
      background: "bg-amber-500/10",
      text: "text-amber-300"
    }
  },
  poor: {
    light: {
      gradient: "from-red-500 to-rose-400",
      ring: "ring-red-500/20",
      background: "bg-red-50",
      text: "text-red-700"
    },
    dark: {
      gradient: "from-red-400 to-rose-300",
      ring: "ring-red-400/20",
      background: "bg-red-500/10",
      text: "text-red-300"
    }
  }
} as const;

export const renderScore = (score: number, maxScore: number = 10) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const percentage = (score / maxScore) * 100;
  
  const getColorConfig = () => {
    if (percentage >= 70) return scoreColorConfig.excellent;
    if (percentage >= 40) return scoreColorConfig.good;
    if (percentage >= 20) return scoreColorConfig.average;
    return scoreColorConfig.poor;
  };

  const colorConfig = getColorConfig();
  const themeColors = isDark ? colorConfig.dark : colorConfig.light;
  
  const getScoreDescription = () => {
    if (percentage >= 70) return "Excellent";
    if (percentage >= 40) return "Good";
    if (percentage >= 20) return "Average";
    return "Needs Improvement";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative w-14 h-14 flex items-center justify-center group cursor-help">
            {/* Background with hover effect */}
            <div className={cn(
              "absolute inset-0 rounded-full transition-all duration-300",
              themeColors.background,
              "group-hover:scale-110"
            )} />
            
            {/* Gradient ring */}
            <div className={cn(
              "absolute inset-[2px] rounded-full ring-[4px] transition-all duration-300",
              themeColors.ring,
              isDark ? "bg-slate-900" : "bg-white",
              "group-hover:ring-opacity-100"
            )} />
            
            {/* SVG Progress Circle */}
            <div className="absolute inset-0">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className={cn(
                    "transition-all duration-500 ease-out",
                    isDark ? "text-slate-800" : "text-slate-100"
                  )}
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke={`url(#score-gradient-${score})`}
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                  strokeDasharray={`${percentage * 1.51} 999`}
                />
                <defs>
                  <linearGradient
                    id={`score-gradient-${score}`}
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" className={themeColors.gradient.split(' ')[0]} />
                    <stop offset="100%" className={themeColors.gradient.split(' ')[1]} />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Score Text */}
            <div className="relative text-center z-10 transition-transform group-hover:scale-105">
              <span className={cn(
                "text-base font-semibold",
                themeColors.text
              )}>
                {score}
              </span>
              <span className={cn(
                "text-xs ml-0.5",
                isDark ? "text-slate-500" : "text-slate-400"
              )}>
                /{maxScore}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-sm">
          <p><span className={themeColors.text}>{getScoreDescription()}</span></p>
          <p className="text-xs text-muted-foreground">Score: {score} out of {maxScore}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
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
    <Badge variant="secondary" className={cn(
      "transition-all duration-200 hover:scale-105",
      getStatusColor()
    )}>
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

const ShadcnTable = <T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  emptyMessage = "Click 'New Session' to start your assessment",
  className,
  rowClassName,
  onRowClick,
}: ShadcnTableProps<T>) => {
  const getRowClassName = (row: T, index: number) => {
    if (typeof rowClassName === "function") {
      return rowClassName(row, index);
    }
    return rowClassName;
  };

  if (isLoading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="w-full p-12 text-center border rounded-lg bg-muted/5">
        <div className="max-w-sm mx-auto space-y-4">
          <div className="p-4 rounded-full bg-muted/10 w-fit mx-auto">
            <PlusIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">No data available</h3>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative w-full overflow-auto rounded-lg border bg-card",
      "transition duration-200 hover:shadow-md",
      className
    )}>
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
          {data.map((row, rowIndex) => (
            <TableRow
              key={row.id || rowIndex}
              className={cn(
                "transition-all duration-200",
                "hover:bg-muted/50 hover:shadow-sm",
                getRowClassName(row, rowIndex),
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <TableCell
                  key={`${rowIndex}-${column.key}`}
                  className={cn(
                    "py-4",
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ShadcnTable;
