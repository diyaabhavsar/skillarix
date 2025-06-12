import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { User } from "@/contexts/AuthContext";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasRole(user: User | null, role: string | string[]): boolean {
  if (!user) return false;

  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const capitalizeEvaluationTitle = (key: string): string => {
  // Special cases for specific evaluation terms
  const specialTerms: { [key: string]: string } = {
    overall_score: "Overall Score",
    key_successful_moments: "Key Successful Moments",
    critical_missed_opportunities: "Critical Missed Opportunities",
    pattern_analysis: "Pattern Analysis",
    recommendations: "Recommendations",
    specific_analysis: "Specific Analysis",
    overall_progress: "Overall Progress",
    sales_strategy: "Sales Strategy",
    customer_journey: "Customer Journey",
    technical_accuracy: "Technical Accuracy",
    total: "Total Score",
  };

  // If the key exists in special terms, return that
  if (specialTerms[key.toLowerCase()]) {
    return specialTerms[key.toLowerCase()];
  }

  // Otherwise, capitalize each word
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

