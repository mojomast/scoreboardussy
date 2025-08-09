import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 
import './i18n';
import { initRoomAuthFromUrl } from './utils/room';
import './i18n'; 

// Capture token from URL early so socket can use it on first connect
initRoomAuthFromUrl(true);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element. Check your index.html file.");
}

ReactDOM.createRoot(rootElement!).render(
  <React.StrictMode>
    <Suspense fallback={<div>Loading translations...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>,
);
