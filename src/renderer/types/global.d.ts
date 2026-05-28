export {};

declare global {
  interface Window {
    electronAPI: {
      getEnv: () => Promise<{ SUPABASE_URL: string; SUPABASE_ANON_KEY: string }>;
    };
  }
}
