import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initSupabaseSync } from './lib/supabase';

// Initialize Supabase async then render the app
const renderApp = async () => {
  await initSupabaseSync();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

renderApp();
