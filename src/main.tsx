import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SessionProvider, RealtimeProvider } from '@/context';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('No se encontró #root en index.html');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
