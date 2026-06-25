'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@gmail.com');
  const [password, setPassword] = useState('owner123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userData', JSON.stringify(result.user));
        
        // Let AuthGuard or redirect handle routing
        const targetPath = result.redirect.replace('.html', '');
        router.push(targetPath);
      } else {
        setError(result.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please check backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-neutral-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-wider text-white bg-gradient-to-r from-blue-500 to-indigo-500 inline-block px-4 py-2 rounded-xl shadow-lg shadow-blue-500/15 mb-4">
            TURBIFY NEWSLETTER
          </h1>
          <p className="text-neutral-400 font-medium text-sm">Sign in to your collaboration workspace</p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-800/80 p-8 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs font-semibold text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white text-sm placeholder:text-neutral-500 transition-all"
                placeholder="Enter email (owner@gmail.com)"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white text-sm placeholder:text-neutral-500 transition-all"
                placeholder="Enter password (owner123)"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="ml-2 text-xs text-neutral-400 font-semibold">Remember me</span>
              </label>
              <a href="#" className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl h-12 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">login</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
