export const capitalizeTitle = (text: string): string => {
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1))
    .join(' ');
};
