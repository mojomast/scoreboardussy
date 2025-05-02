import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 
import './index.css'; 
import './i18n'; 

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
