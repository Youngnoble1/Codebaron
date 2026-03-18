
import React from 'react';
import { User } from '../types';
import { ICONS } from '../constants';

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
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Guest ID</label>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm font-medium">
                {user.id}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">App Version</label>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm font-medium">
                v1.0.5 (Cache Refresh)
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card p-6 rounded-2xl border border-yellow-500/10">
          <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4">Question Pool</h2>
          <p className="text-xs text-gray-500 mb-4">If you are seeing questions that don't match the subject, refresh the pool to fetch fresh ones from the AI.</p>
          <button 
            onClick={() => {
              // Clear all keys starting with arkumen_q_cache_
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('arkumen_q_cache_')) {
                  localStorage.removeItem(key);
                }
              });
              alert('Question pool cleared. Fresh questions will be fetched on your next game.');
              window.location.reload();
            }}
            className="w-full py-3 bg-yellow-500/10 text-[#d4af37] border border-yellow-500/30 rounded-xl font-bold hover:bg-yellow-500/20 transition-all"
          >
            REFRESH QUESTION POOL
          </button>
        </section>

        <section className="glass-card p-6 rounded-2xl border border-red-500/10">
          <h2 className="text-sm font-bold tracking-widest text-red-400 uppercase mb-4">Danger Zone</h2>
          <p className="text-xs text-gray-500 mb-4">Once you delete your local data, there is no going back. Please be certain.</p>
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to delete your local progress?')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500/20 transition-all"
          >
            RESET ALL PROGRESS
          </button>
        </section>
      </div>
    </div>
  );
};

export default SettingsView;
