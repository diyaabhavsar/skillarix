export const env = {
  API_URL: import.meta.env.VITE_API_URL,
  TOKEN_KEY: import.meta.env.VITE_TOKEN_KEY,
  WS_URL: import.meta.env.VITE_WS_URL, // Add WebSocket URL
} as const;
