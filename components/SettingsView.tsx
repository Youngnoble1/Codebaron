
import React, { useState } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';
import { isAIActive, testAIConnection } from '../services/geminiService';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser, onLogout }) => {
  const [testStatus, setTestStatus] = useState<{ loading: boolean; result: string | null }>({ loading: false, result: null });

  const handleTestConnection = async () => {
    setTestStatus({ loading: true, result: null });
    const result = await testAIConnection();
    setTestStatus({ loading: false, result: result.message });
  };
  return (
    <div className="min-h-screen bg-[#050b18] text-white p-6 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-cinzel gold-text-gradient font-bold">SETTINGS</h1>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
        >
          <ICONS.LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

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
                v1.2.0 (AI-Powered Engine)
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">AI Status</label>
              <div className={`p-3 rounded-lg border text-sm font-bold flex items-center gap-2 ${isAIActive() ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isAIActive() ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                {isAIActive() ? 'ACTIVE (Unlimited Questions Enabled)' : 'INACTIVE (Using Static Bank)'}
              </div>
              {!isAIActive() && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-gray-500 italic">
                    Tip: Ensure GEMINI_API_KEY is set in AI Studio Secrets and refresh.
                  </p>
                  <p className="text-[10px] text-gray-600">
                    Debug: Key detected: {process.env.GEMINI_API_KEY ? 'YES' : 'NO'} 
                    {process.env.GEMINI_API_KEY && ` (Length: ${process.env.GEMINI_API_KEY.length})`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="glass-card p-6 rounded-2xl border border-yellow-500/10">
          <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4">AI Question Engine</h2>
          <p className="text-xs text-gray-500 mb-4">
            {isAIActive() 
              ? "Your Gemini API key is linked! You have access to unlimited, fresh questions across all subjects." 
              : "Link a Gemini API key in AI Studio Secrets to unlock unlimited AI-generated questions."}
          </p>
          {!isAIActive() && (
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-yellow-500 hover:underline mb-4 block font-bold"
            >
              GET AN API KEY HERE →
            </a>
          )}
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={handleTestConnection}
              disabled={testStatus.loading}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border ${
                testStatus.result?.includes('Successful') 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {testStatus.loading ? (
                <ICONS.RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ICONS.ShieldCheck className="w-4 h-4" />
              )}
              {testStatus.loading ? 'TESTING...' : (testStatus.result || 'TEST AI CONNECTION')}
            </button>

            <button 
              onClick={() => {
                Object.keys(localStorage).forEach(key => {
                  if (key.startsWith('arkumen_q_cache_')) {
                    localStorage.removeItem(key);
                  }
                });
                alert('Question pool cleared. Fresh AI questions will be generated on your next game.');
                window.location.reload();
              }}
              className="w-full py-3 bg-yellow-500/10 text-[#d4af37] border border-yellow-500/30 rounded-xl font-bold hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ICONS.RefreshCw className="w-4 h-4" />
              REGENERATE AI POOL
            </button>
          </div>
        </section>

        <section className="glass-card p-6 rounded-2xl border border-white/5">
          <h2 className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-4">System Debugger</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">Detected Keys:</span>
              <span className="text-emerald-400 font-mono">
                {Object.keys(process.env).filter(k => k.toUpperCase().includes('API') || k.toUpperCase().includes('GEMINI')).join(', ') || 'None'}
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">Vite Mode:</span>
              <span className="text-gray-400 font-mono">{(import.meta as any).env?.MODE}</span>
            </div>
          </div>
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
