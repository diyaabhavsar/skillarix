/**
 * Date utility functions for consistent date formatting across the application
 *
 * Examples:
 * - formatDateToIndianTime("2024-01-15T14:30:00Z") → "15 January 2024 at 8:00 PM"
 * - formatDateToIndianTimeShort("2024-01-15T14:30:00Z") → "Jan 15, 2024, 8:00 PM"
 * - formatDateToIndianDateOnly("2024-01-15T14:30:00Z") → "15 January 2024"
 * - formatRelativeTimeInIndian("2024-01-15T14:30:00Z") → "2 hours ago" or formatted date
 */

/**
 * Formats a date string to Indian timezone (Asia/Kolkata)
 * @param dateString - The date string to format
 * @param options - Intl.DateTimeFormatOptions for customizing the output
 * @returns Formatted date string in Indian timezone
 */
export const formatDateToIndianTime = (
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    ...options,
  };

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", defaultOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Formats a UTC date string to Indian timezone with short format
 * @param dateString - The UTC date string to format
 * @returns Formatted date string in Indian timezone (e.g., "Jan 15, 2024, 2:30 PM")
 */
export const formatDateToIndianTimeShort = (dateString: string): string => {
  return formatDateToIndianTime(dateString, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

/**
 * Formats a UTC date string to Indian timezone with only date (no time)
 * @param dateString - The UTC date string to format
 * @returns Formatted date string in Indian timezone (e.g., "January 15, 2024")
 */
export const formatDateToIndianDateOnly = (dateString: string): string => {
  return formatDateToIndianTime(dateString, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

/**
 * Formats a UTC date string to Indian timezone with full date and time
 * @param dateString - The UTC date string to format
 * @returns Formatted date string in Indian timezone (e.g., "January 15, 2024 at 2:30:45 PM IST")
 */
export const formatDateToIndianTimeFull = (dateString: string): string => {
  return formatDateToIndianTime(dateString, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

/**
 * Gets the current date and time in Indian timezone
 * @returns Current date string in Indian timezone
 */
export const getCurrentIndianTime = (): string => {
  return formatDateToIndianTime(new Date().toISOString());
};

/**
 * Converts any date to Indian timezone with relative formatting (e.g., "2 hours ago")
 * @param dateString - The date string to format
 * @returns Relative time string or formatted date if older than 7 days
 */
export const formatRelativeTimeInIndian = (dateString: string): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else {
      // For older dates, show the actual date in Indian timezone
      return formatDateToIndianTimeShort(dateString);
    }
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return formatDateToIndianTimeShort(dateString);
  }
};

/**
 * Formats a UTC date string to Indian timezone and returns separate date and time strings
 * @param dateString - The UTC date string to format
 * @returns Object with separate date and time strings in Indian timezone
 */
export const formatDateTimeToIndianSeparate = (
  dateString: string
): {
  date: string;
  time: string;
} => {
  if (!dateString) return { date: "", time: "" };

  const date = new Date(dateString);

  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  return {
    date: formattedDate,
    time: formattedTime,
  };
};
