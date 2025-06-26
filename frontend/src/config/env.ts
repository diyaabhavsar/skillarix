export const env = {
  API_URL: import.meta.env.VITE_API_URL,
  TOKEN_KEY: import.meta.env.VITE_TOKEN_KEY,
  WS_URL: import.meta.env.VITE_WS_URL,
  AGENT_ID: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
  API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY,
  FILE_URL_ENDPOINT: import.meta.env.FILE_URL_ENDPOINT
} as const;
