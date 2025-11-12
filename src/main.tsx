import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './app/providers/AuthProvider';
import { QueryProvider } from './app/providers/QueryProvider';
import './styles/globals.css';

async function enableMocking() {
  // FIX: Cast `import.meta` to `any` to access `env` property in a Vite project without custom type declarations.
  if ((import.meta as any).env.DEV) {
    const { worker } = await import('./api/mocks/browser');
    // `worker.start()` returns a Promise that resolves
    // once the Service Worker is up and running.
    return worker.start({
        onUnhandledRequest: 'bypass'
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

enableMocking().then(() => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <QueryProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryProvider>
        </BrowserRouter>
      </React.StrictMode>,
    );
});
