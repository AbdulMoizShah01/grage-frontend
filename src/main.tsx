import React from 'react';
import ReactDOM from 'react-dom/client';

import { AppProviders } from './providers/app-providers';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
