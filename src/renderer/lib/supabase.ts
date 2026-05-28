import { createClient } from '@supabase/supabase-js';

// We fetch the environment variables from the main process securely via IPC
// If running in pure web mode (dev), fallback to Vite's import.meta.env
const getEnvVariables = async () => {
  let env = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  // If Vite didn't inject them (e.g., pure Electron Node execution), fallback to IPC
  if (!env.SUPABASE_URL && window.electronAPI) {
    const mainEnv = await window.electronAPI.getEnv();
    if (mainEnv.SUPABASE_URL) {
      env = mainEnv;
    }
  }

  return env;
};

let supabaseInstance: any = null;

export const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;

  const env = await getEnvVariables();
  
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not found. Authentication and Database features will not work.');
    // Return a dummy client to avoid crashing the app entirely if env is missing
    supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder');
  } else {
    supabaseInstance = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }

  return supabaseInstance;
};

// Also export a synchronous placeholder for immediate React context usage if needed,
// though it's better to initialize it asynchronously before rendering the app.
export let supabaseSync: any = null;

export const initSupabaseSync = async () => {
  supabaseSync = await getSupabase();
};
