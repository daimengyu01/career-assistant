import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { HashRouter } from 'react-router-dom';
import App from './App';
import '@mantine/core/styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <MantineProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </MantineProvider>
    );
    console.log('React render complete');
  } catch (e) {
    console.error('React render failed:', e);
  }
}
