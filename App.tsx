
import React, { useState, useEffect } from 'react';
import { User, GameMode, Category } from './types';
import { GAME_MODES, TRIVIA_CATEGORIES, ACADEMIC_SUBJECTS } from './constants';
// import Auth from './components/Auth';
import Navigation from './components/Navigation';
import GameView from './components/GameView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import LeaderboardView from './components/LeaderboardView';
import MultiplayerView from './components/MultiplayerView';
import { db, doc, getDoc, setDoc, updateDoc, Timestamp, handleFirestoreError, OperationType } from './firebase';

const GUEST_ID_KEY = 'arkumen_guest_id';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [currentGame, setCurrentGame] = useState<{ mode: GameMode; category?: Category } | null>(null);
  const [showAcademicMenu, setShowAcademicMenu] = useState(false);
  const [showUMEMenu, setShowUMEMenu] = useState(false);
  const [showSSCEMenu, setShowSSCEMenu] = useState(false);
  const [showSpecialistMenu, setShowSpecialistMenu] = useState(false);
  const [showRevelationsMenu, setShowRevelationsMenu] = useState(false);

  // Initialize Guest User
  useEffect(() => {
    const initUser = async () => {
      let guestId = localStorage.getItem(GUEST_ID_KEY);
      
      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(GUEST_ID_KEY, guestId);
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', guestId));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // Create new guest profile
          const newUser: User = {
            id: guestId,
            username: `Guest_${guestId.substr(-4)}`,
            email: '',
            royaltyPoints: 0,
            highestScore: 0,
            longestStreak: 0,
            favoriteCategory: 'General Knowledge',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
            playCount: {},
            role: 'player',
            createdAt: Timestamp.now()
          };
          await setDoc(doc(db, 'users', guestId), newUser);
          
          // Initialize leaderboard entry too
          await setDoc(doc(db, 'leaderboard', guestId), {
            username: newUser.username,
            royaltyPoints: newUser.royaltyPoints,
            highestScore: newUser.highestScore,
            avatar: newUser.avatar
          });
          
          setUser(newUser);
        }
      } catch (error) {
        console.error("Error initializing guest user", error);
        // Fallback to local only if firestore fails
        setUser({
          id: guestId,
          username: 'Guest',
          email: '',
          royaltyPoints: 0,
          highestScore: 0,
          longestStreak: 0,
          favoriteCategory: 'General Knowledge',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
          playCount: {},
          role: 'player',
          createdAt: new Date()
        } as User);
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, []);

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, updates);
      
      // Also update leaderboard if relevant fields changed
      const leaderboardFields = ['username', 'royaltyPoints', 'highestScore', 'avatar'];
      const changedLeaderboardFields = Object.keys(updates).filter(key => leaderboardFields.includes(key));
      
      if (changedLeaderboardFields.length > 0) {
        const leaderboardUpdates: any = {};
        changedLeaderboardFields.forEach(field => {
          leaderboardUpdates[field] = (updates as any)[field];
        });
        await setDoc(doc(db, 'leaderboard', user.id), leaderboardUpdates, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const handleGameEnd = (stats: { score: number; streak: number; won: boolean }) => {
    if (!user || !currentGame) return;

    const currentCat = currentGame.category || 'General Knowledge';
    const newPlayCount = { ...user.playCount };
    newPlayCount[currentCat] = (newPlayCount[currentCat] || 0) + 1;

    // Recalculate favorite category
    const favCat = Object.entries(newPlayCount).reduce((a, b) => a[1] > b[1] ? a : b, [currentCat, 0])[0] as Category;

    handleUpdateUser({
      royaltyPoints: user.royaltyPoints + stats.score,
      highestScore: Math.max(user.highestScore, stats.score),
      longestStreak: Math.max(user.longestStreak, stats.streak),
      playCount: newPlayCount,
      favoriteCategory: favCat
    });

    if (stats.won) {
      const win = window as any;
      if (win.confetti) {
        win.confetti({
          particleCount: 200,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#f9d976', '#ffffff']
        });
      }
    }

    setCurrentGame(null);
    setShowAcademicMenu(false);
    setShowUMEMenu(false);
    setShowSSCEMenu(false);
    setShowSpecialistMenu(false);
    setShowRevelationsMenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 font-cinzel tracking-widest text-xs">LOADING ARENA...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center">
        <p className="text-red-500">Failed to initialize guest session.</p>
      </div>
    );
  }

  if (currentGame) {
    if (currentGame.mode === GameMode.MULTIPLAYER) {
      return (
        <MultiplayerView 
          user={user}
          onExit={() => setCurrentGame(null)}
        />
      );
    }
    return (
      <GameView 
        mode={currentGame.mode} 
        category={currentGame.category} 
        user={user}
        onGameEnd={handleGameEnd}
        onExit={(stats) => {
          // If the player exits early, still save their current score and streak
          if (stats && stats.score > 0) {
            handleGameEnd({ ...stats, won: false });
          } else {
            setCurrentGame(null);
          }
        }}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'leaderboard':
        return <LeaderboardView />;
      case 'profile':
        return <ProfileView user={user} onUpdateUser={handleUpdateUser} />;
      case 'settings':
        return <SettingsView user={user} onUpdateUser={handleUpdateUser} />;
      default:
        return (
          <div className="p-6 pb-32 animate-in fade-in duration-500">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-3xl font-cinzel gold-text-gradient font-bold">ARKUMEN</h1>
                <p className="text-gray-400 text-xs tracking-[0.2em] font-bold">THE ELITE TRIVIA ARENA</p>
              </div>
              <div 
                onClick={() => setActiveTab('profile')}
                className="w-12 h-12 rounded-full border-2 border-[#d4af37] p-0.5 cursor-pointer hover:scale-110 transition-transform active:scale-95 overflow-hidden shadow-lg shadow-yellow-500/10"
              >
                <img src={user.avatar} className="w-full h-full rounded-full object-cover bg-slate-800" alt="Profile" />
              </div>
            </header>

            <div className="mb-8">
              <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4">Core Challenges</h2>
              <div className="grid grid-cols-1 gap-4">
                {GAME_MODES.slice(0, 4).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      if (mode.id === GameMode.CATEGORY) {
                        setShowSpecialistMenu(!showSpecialistMenu);
                        setShowAcademicMenu(false);
                        setShowUMEMenu(false);
                        setShowSSCEMenu(false);
                      } else {
                        setCurrentGame({ mode: mode.id, category: 'General Knowledge' });
                      }
                    }}
                    className={`group relative overflow-hidden glass-card p-6 rounded-2xl border border-yellow-500/10 flex items-center gap-6 transition-all duration-300 hover:border-[#d4af37]/50 hover:bg-slate-800/50 active:scale-[0.98] ${showSpecialistMenu && mode.id === GameMode.CATEGORY ? 'border-[#d4af37]/50 bg-slate-800/50' : ''}`}
                  >
                    <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                      {mode.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-lg font-bold font-cinzel group-hover:text-[#d4af37] transition-colors">{mode.title}</h3>
                      <p className="text-sm text-gray-500">{mode.description}</p>
                    </div>
                  </button>
                ))}
                
                {/* Multiplayer Button */}
                <button
                  onClick={() => setCurrentGame({ mode: GameMode.MULTIPLAYER })}
                  className="group relative overflow-hidden glass-card p-6 rounded-2xl border border-pink-500/30 flex items-center gap-6 transition-all duration-300 hover:border-pink-400/50 hover:bg-slate-800/50 active:scale-[0.98]"
                >
                  <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                    {GAME_MODES[7].icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold font-cinzel group-hover:text-pink-400 transition-colors">{GAME_MODES[7].title}</h3>
                      <div className="bg-pink-500/20 text-pink-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-pink-500/30">Live</div>
                    </div>
                    <p className="text-sm text-gray-500">{GAME_MODES[7].description}</p>
                  </div>
                </button>
              </div>
            </div>

            {showSpecialistMenu && (
              <div className="mb-8 p-4 bg-slate-900/50 rounded-2xl border border-[#d4af37]/30 animate-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase">Choose Trivia Niche</h3>
                  <button onClick={() => setShowSpecialistMenu(false)} className="text-[10px] text-gray-500 hover:text-[#d4af37]">Close</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TRIVIA_CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setCurrentGame({ mode: GameMode.CATEGORY, category: cat })}
                      className="p-3 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-[#d4af37] hover:text-[#050b18] transition-all truncate border border-slate-700 hover:border-[#d4af37]"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4">Academic Excellence</h2>
              <button
                onClick={() => {
                  setShowAcademicMenu(!showAcademicMenu);
                  setShowSpecialistMenu(false);
                  setShowUMEMenu(false);
                  setShowSSCEMenu(false);
                }}
                className={`group w-full relative overflow-hidden glass-card p-6 rounded-2xl border border-purple-500/30 flex items-center gap-6 transition-all duration-300 hover:border-purple-400/50 hover:bg-slate-800/50 active:scale-[0.98] ${showAcademicMenu ? 'bg-slate-800/80 border-purple-400' : ''}`}
              >
                <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                  {GAME_MODES[4].icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-cinzel group-hover:text-purple-400 transition-colors">{GAME_MODES[4].title}</h3>
                    <div className="bg-purple-500/20 text-purple-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-purple-500/30">New</div>
                  </div>
                  <p className="text-sm text-gray-500">{GAME_MODES[4].description}</p>
                </div>
              </button>
            </div>

            {showAcademicMenu && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-4 mb-10">
                {ACADEMIC_SUBJECTS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCurrentGame({ mode: GameMode.ACADEMIC, category: cat })}
                    className="glass-card p-4 rounded-xl text-left border border-slate-800 hover:border-purple-500/50 transition-all active:scale-[0.98]"
                  >
                    <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 truncate">{cat}</div>
                    <div className="text-xs font-bold text-purple-400">Challenge Now</div>
                  </button>
                ))}
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4">Divine Revelations</h2>
              <button
                onClick={() => {
                  setCurrentGame({ mode: GameMode.REVELATIONS, category: 'Revelations' });
                }}
                className="group w-full relative overflow-hidden glass-card p-6 rounded-2xl border border-amber-500/30 flex items-center gap-6 transition-all duration-300 hover:border-amber-400/50 hover:bg-slate-800/50 active:scale-[0.98]"
              >
                <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                  {GAME_MODES[8].icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-cinzel group-hover:text-amber-400 transition-colors">{GAME_MODES[8].title}</h3>
                    <div className="bg-amber-500/20 text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-amber-500/30">Special</div>
                  </div>
                  <p className="text-sm text-gray-500">{GAME_MODES[8].description}</p>
                </div>
              </button>
            </div>

            <div className="mb-8">
              <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4">National Examinations</h2>
              <div className="grid grid-cols-1 gap-4">
                {/* JAMB u.m.e */}
                <button
                  onClick={() => {
                    setShowUMEMenu(!showUMEMenu);
                    setShowAcademicMenu(false);
                    setShowSSCEMenu(false);
                    setShowSpecialistMenu(false);
                  }}
                  className={`group relative overflow-hidden glass-card p-6 rounded-2xl border border-blue-500/30 flex items-center gap-6 transition-all duration-300 hover:border-blue-400/50 hover:bg-slate-800/50 active:scale-[0.98] ${showUMEMenu ? 'bg-slate-800/80 border-blue-400' : ''}`}
                >
                  <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                    {GAME_MODES[5].icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold font-cinzel group-hover:text-blue-400 transition-colors">{GAME_MODES[5].title}</h3>
                    <p className="text-sm text-gray-500">{GAME_MODES[5].description}</p>
                  </div>
                  <div className="bg-blue-500/20 text-blue-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-blue-500/30">Past Qs</div>
                </button>

                {showUMEMenu && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-4 my-2">
                    {ACADEMIC_SUBJECTS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCurrentGame({ mode: GameMode.UME, category: cat })}
                        className="glass-card p-4 rounded-xl text-left border border-slate-800 hover:border-blue-500/50 transition-all active:scale-[0.98]"
                      >
                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 truncate">{cat}</div>
                        <div className="text-xs font-bold text-blue-400">Start JAMB</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* S.S.C.E Mastery */}
                <button
                  onClick={() => {
                    setShowSSCEMenu(!showSSCEMenu);
                    setShowAcademicMenu(false);
                    setShowUMEMenu(false);
                    setShowSpecialistMenu(false);
                  }}
                  className={`group relative overflow-hidden glass-card p-6 rounded-2xl border border-orange-500/30 flex items-center gap-6 transition-all duration-300 hover:border-orange-400/50 hover:bg-slate-800/50 active:scale-[0.98] ${showSSCEMenu ? 'bg-slate-800/80 border-orange-400' : ''}`}
                >
                  <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                    {GAME_MODES[6].icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold font-cinzel group-hover:text-orange-400 transition-colors">{GAME_MODES[6].title}</h3>
                    <p className="text-sm text-gray-500">{GAME_MODES[6].description}</p>
                  </div>
                  <div className="bg-orange-500/20 text-orange-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-orange-500/30">Past Qs</div>
                </button>

                {showSSCEMenu && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-4 my-2">
                    {ACADEMIC_SUBJECTS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCurrentGame({ mode: GameMode.SSCE, category: cat })}
                        className="glass-card p-4 rounded-xl text-left border border-slate-800 hover:border-orange-500/50 transition-all active:scale-[0.98]"
                      >
                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 truncate">{cat}</div>
                        <div className="text-xs font-bold text-orange-400">Start SSCE</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative max-w-md mx-auto bg-[#050b18] overflow-x-hidden border-x border-slate-800 shadow-[0_0_100px_rgba(212,175,55,0.05)]">
      {renderContent()}
      <Navigation activeTab={activeTab} onTabChange={(tab) => {
        setActiveTab(tab);
        setShowAcademicMenu(false);
        setShowSpecialistMenu(false);
        setShowRevelationsMenu(false);
      }} />
    </div>
  );
};

export default App;
