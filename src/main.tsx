import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/onest';
import './styles/tailwind.css';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode><ErrorBoundary><App /></ErrorBoundary></StrictMode>,
);
