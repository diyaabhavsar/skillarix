
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Get the root element and check if it exists
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// Create a root and render the app
createRoot(rootElement).render(<App />);
