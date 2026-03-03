
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CATEGORIES } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [hasAccounts, setHasAccounts] = useState(false);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('revgame_users') || '[]');
    setHasAccounts(users.length > 0);
    // Explicitly force signup if no accounts are present
    if (users.length === 0) {
      setIsLogin(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const users = JSON.parse(localStorage.getItem('revgame_users') || '[]');

    if (isLogin) {
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError('Invalid credentials. Check your email or password.');
      }
    } else {
      if (users.some((u: any) => u.email === email)) {
        setError('An account with this email already exists.');
        return;
      }
      
      const newUser: User & { password: string } = {
        id: Math.random().toString(36).substr(2, 9),
        username: username || 'EliteTrv101',
        email: email,
        password: password,
        royaltyPoints: 0,
        highestScore: 0,
        longestStreak: 0,
        favoriteCategory: CATEGORIES[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'random'}`,
        playCount: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as Record<string, number>)
      };

      users.push(newUser);
      localStorage.setItem('revgame_users', JSON.stringify(users));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050b18]">
      <div className="w-full max-w-md glass-card p-8 rounded-2xl shadow-2xl border border-yellow-500/20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-cinzel gold-text-gradient font-bold mb-2">REVGAME</h1>
          <p className="text-gray-400">Step into the arena of knowledge</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center animate-bounce">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                placeholder="TheWiseOne"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full gold-gradient text-slate-900 font-bold py-4 rounded-lg shadow-lg hover:opacity-90 transition-all transform active:scale-[0.98]"
          >
            {isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {hasAccounts && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#d4af37] text-sm hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        )}
        
        {!hasAccounts && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs italic">Registration required for first-time access.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
