import { useState } from 'react';
import { supabaseSync } from '../lib/supabase';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(() => localStorage.getItem('keepLoggedIn') === 'true');
  const [showWarningModal, setShowWarningModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!supabaseSync || supabaseSync.supabaseUrl === 'https://placeholder.supabase.co') {
      // Mock login for testing without real credentials
      if (email === 'plmttit@gmail.com' || email === 'backup.plmtt@gmail.com') {
        localStorage.setItem('mock_session_email', email);
        window.location.reload();
        return;
      }
      setError('Supabase client is not configured. Use a mock email (plmttit@gmail.com) to test locally.');
      setLoading(false);
      return;
    }

    const { error } = await supabaseSync.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // On successful login, save their preference
      localStorage.setItem('keepLoggedIn', keepLoggedIn ? 'true' : 'false');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Decorative background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="glass-dark w-full max-w-md rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Secure Access</h1>
          <p className="text-gray-400">Inventory & Asset Management System</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                required
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="keep-logged-in"
              type="checkbox"
              checked={keepLoggedIn}
              onChange={(e) => {
                if (e.target.checked) {
                  setShowWarningModal(true);
                } else {
                  setKeepLoggedIn(false);
                  localStorage.setItem('keepLoggedIn', 'false');
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700 cursor-pointer"
            />
            <label htmlFor="keep-logged-in" className="ml-2 block text-sm text-gray-300 cursor-pointer">
              Keep me logged in
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-gray-400 text-sm">
        Design and Developed by : <a href="https://dinithaweb.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium">Dinitha Serasinghe</a>
      </div>

      {/* Security Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowWarningModal(false)}></div>
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col relative z-10 animate-in fade-in zoom-in duration-200 p-6">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Security Warning</h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Checking this option will keep you logged into the administrative panel even after closing the application. 
              <br/><br/>
              <strong>Do not enable this on a shared or public computer.</strong>
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setKeepLoggedIn(true);
                  localStorage.setItem('keepLoggedIn', 'true');
                  setShowWarningModal(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded-lg transition-colors font-bold text-sm shadow-sm"
              >
                Accept & Keep Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
