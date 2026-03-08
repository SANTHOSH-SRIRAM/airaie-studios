import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { defaultQueryConfig } from '@airaie/shared';
import { ToastProvider } from '@airaie/ui';
import App from './App';
import { installNetworkInterceptor } from './utils/networkInterceptor';
import './styles/globals.css';

installNetworkInterceptor();

const queryClient = new QueryClient(defaultQueryConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
