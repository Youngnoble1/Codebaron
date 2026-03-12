
import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { ICONS } from '../constants';
import { db, collection, query, orderBy, limit, onSnapshot, handleFirestoreError, OperationType } from '../firebase';

const LeaderboardView: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('royaltyPoints', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sortedLeaders: LeaderboardEntry[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LeaderboardEntry));
      
      setLeaders(sortedLeaders);
      setLoading(false);
    }, (err) => {
      console.error("Leaderboard snapshot error", err);
      handleFirestoreError(err, OperationType.LIST, 'leaderboard');
      setError("Failed to load rankings. Please try again.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050b18] text-white p-6 flex flex-col items-center justify-center text-center">
        <ICONS.AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-cinzel text-white mb-2">RANKING ERROR</h2>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 gold-gradient text-slate-900 font-bold rounded-lg"
        >
          RETRY
        </button>
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="min-h-screen bg-[#050b18] text-white p-6 flex flex-col items-center justify-center">
        <ICONS.Trophy className="w-16 h-16 text-gray-700 mb-4" />
        <h2 className="text-xl font-cinzel text-gray-500">No Champions Yet</h2>
        <p className="text-gray-600 text-sm mt-2">Be the first to claim the throne!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b18] text-white p-6 pb-32">
      <h1 className="text-3xl font-cinzel gold-text-gradient font-bold mb-8">GLOBAL RANKS</h1>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-12 mt-8">
        {/* 2nd Place */}
        {leaders.length >= 2 && (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <img src={leaders[1].avatar} className="w-16 h-16 rounded-full border-2 border-slate-400 object-cover bg-slate-800" alt="2nd" />
              <div className="absolute -top-3 -right-3 bg-slate-400 text-slate-900 rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold">2</div>
            </div>
            <div className="h-20 w-16 bg-slate-800 rounded-t-lg flex flex-col items-center justify-center">
               <span className="text-[10px] font-bold text-slate-400">2nd</span>
            </div>
          </div>
        )}

        {/* 1st Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2 -mt-10">
            <img src={leaders[0].avatar} className="w-20 h-20 rounded-full border-4 border-[#d4af37] object-cover bg-slate-800" alt="1st" />
            <div className="absolute -top-3 -right-3 bg-[#d4af37] text-slate-900 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">1</div>
          </div>
          <div className="h-32 w-20 bg-yellow-500/20 rounded-t-lg flex flex-col items-center justify-center border-t border-x border-[#d4af37]">
             <ICONS.Trophy className="w-6 h-6 text-[#d4af37] mb-1" />
             <span className="text-[10px] font-bold text-[#d4af37]">ELITE</span>
          </div>
        </div>

        {/* 3rd Place */}
        {leaders.length >= 3 && (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <img src={leaders[2].avatar} className="w-16 h-16 rounded-full border-2 border-amber-700 object-cover bg-slate-800" alt="3rd" />
              <div className="absolute -top-3 -right-3 bg-amber-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold">3</div>
            </div>
            <div className="h-16 w-16 bg-slate-800/50 rounded-t-lg flex flex-col items-center justify-center">
               <span className="text-[10px] font-bold text-amber-700">3rd</span>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {leaders.map((leader, index) => (
          <div 
            key={leader.id} 
            className={`glass-card p-4 rounded-xl flex items-center gap-4 border ${
              index < 3 ? 'border-yellow-500/30' : 'border-slate-800'
            }`}
          >
            <div className="w-8 text-center font-cinzel text-gray-500 font-bold">
              {index + 1}
            </div>
            <img src={leader.avatar} className="w-10 h-10 rounded-full border border-slate-700 object-cover bg-slate-800" alt={leader.username} />
            <div className="flex-1">
              <div className="font-bold text-sm">{leader.username}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                Highest Score: {leader.highestScore.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#d4af37] font-bold text-sm">
                {leader.royaltyPoints.toLocaleString()}
              </div>
              <div className="text-[8px] text-gray-500 uppercase font-bold">RP</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardView;
