import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Fonts are bundled, never fetched from a CDN — the app has to work with the
// network unplugged.
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles/globals.css';

import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Matches the deploy base so routes work under a /<repo>/ path too. */}
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
