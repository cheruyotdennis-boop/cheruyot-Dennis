import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Safety handler for sandboxed iframes to prevent benign third-party exceptions from breaking the app
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('Illegal constructor')) {
      event.preventDefault();
      console.warn('Suppressed benign sandboxed constructor exception:', event.message);
    }
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

