import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    setLocalError(null);
    setIsSubmitting(true);
    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      // Error is handled by context, but we catch here to stop spinner
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden px-4">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] pointer-events-none opacity-20 blur-[120px]">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-600"></div>
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-purple-600"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10">
        
        {/* Crest Logo */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <img src="/logo.png" alt="K-CRIME Logo" className="h-20 w-20 object-contain rounded-2xl bg-[#FFFFFF] border border-[#D6DCE5] p-2 shadow-[0_4px_12px_rgba(0,0,0,0.10)]" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">K-CRIME</h1>
            <span className="block text-xs font-semibold tracking-widest text-indigo-400 uppercase mt-0.5">Karnataka Police Intelligence</span>
          </div>
        </div>

        {/* Errors */}
        {(localError || error) && (
          <div className="flex items-start gap-2.5 p-3.5 mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm leading-relaxed animate-shake">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <span className="font-medium">{localError || error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter officer/analyst username"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-600 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-600 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-indigo-800 disabled:to-indigo-900 disabled:cursor-not-allowed font-semibold text-white text-sm shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <span>Secure Access Gateway</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Tip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500">
            For evaluation, use seeded credentials:
          </p>
          <div className="mt-2.5 flex justify-center gap-4 text-xs font-medium text-slate-400">
            <div>
              <span className="text-slate-600">User:</span> <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-400">admin</code>
            </div>
            <div>
              <span className="text-slate-600">Pass:</span> <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-400">password123</code>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
