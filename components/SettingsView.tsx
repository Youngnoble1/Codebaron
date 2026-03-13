
import React from 'react';
import { User } from '../types';
import { ICONS } from '../constants';
import { auth } from '../firebase';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
  return (
    <div className="min-h-screen bg-[#050b18] text-white p-6 pb-32">
      <h1 className="text-3xl font-cinzel gold-text-gradient font-bold mb-8">SETTINGS</h1>

      <div className="space-y-6">
        <section className="glass-card p-6 rounded-2xl border border-yellow-500/10">
          <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-6">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Username</label>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm font-medium">
                {user.username}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Email Address</label>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm font-medium">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Authentication</label>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-xs text-gray-400">Google Account Linked</span>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card p-6 rounded-2xl border border-red-500/10">
          <h2 className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">Danger Zone</h2>
          <p className="text-xs text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <button className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500/20 transition-all">
            DELETE ACCOUNT
          </button>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
