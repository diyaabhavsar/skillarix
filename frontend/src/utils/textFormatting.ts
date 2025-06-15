export const capitalizeTitle = (text: string): string => {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1))
    .join(' ');
};

/**
 * Formats a date string into a localized format
 * @param dateString The date string to format
 * @returns A formatted date string in the format "MMM D, YYYY" or "-" if no date provided
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
