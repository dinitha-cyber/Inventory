import { useState, useEffect } from 'react';
import { supabaseSync } from './lib/supabase';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (supabaseSync) {
        const keepLoggedIn = localStorage.getItem('keepLoggedIn') === 'true';
        
        if (!keepLoggedIn) {
          // If the user hasn't explicitly checked "Keep me logged in", clear the session on startup
          await supabaseSync.auth.signOut();
        }

        supabaseSync.auth.getSession().then(({ data: { session } }: any) => {
          setSession(session);
          setLoading(false);
        });

        const {
          data: { subscription },
        } = supabaseSync.auth.onAuthStateChange((_event: any, session: any) => {
          setSession(session);
        });

        return () => subscription.unsubscribe();
      } else {
        const mockEmail = localStorage.getItem('mock_session_email');
        if (mockEmail) {
          setSession({ user: { email: mockEmail } });
        }
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  // Determine role. If user metadata has 'role', use it, otherwise default to 'user'
  const role = session.user.app_metadata?.role || session.user.user_metadata?.role || 'user';
  const email = (session.user.email || '').toLowerCase().trim();
  let computedRole = role;
  if (email === 'plmttit@gmail.com') computedRole = 'admin';
  if (email === 'backup.plmtt@gmail.com') computedRole = 'user';
  if (email === 'hr@plmtt.com') computedRole = 'hr';

  return <Dashboard session={session} role={computedRole} />;
}

export default App;
