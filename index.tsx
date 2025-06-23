
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Import Tailwind CSS

// Ensure process.env is available
if (typeof process === 'undefined') {
  window.process = { env: {} };
} else if (typeof process.env === 'undefined') {
  window.process.env = {};
}

// Debug environment variables
console.log("index.tsx - Environment variables check:", {
  API_KEY: process.env.API_KEY ? "set" : "not set",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "set" : "not set"
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
