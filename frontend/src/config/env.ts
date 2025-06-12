export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:7070',
  TOKEN_KEY: import.meta.env.VITE_TOKEN_KEY || 'skillarix_token',
  WS_URL: import.meta.env.VITE_WS_URL, // Add WebSocket URL
} as const;
