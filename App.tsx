
import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider, signInWithPopup } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocFromServer } from 'firebase/firestore';
import { User, GameMode, Category, Difficulty } from './types';
import { GAME_MODES, TRIVIA_CATEGORIES, ACADEMIC_SUBJECTS, JSSCE_SUBJECTS, ICONS } from './constants';
import { prewarmCache, isAIActive, getRateLimitStatus } from './services/geminiService';
import Navigation from './components/Navigation';
import GameView from './components/GameView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import LeaderboardView from './components/LeaderboardView';
import MultiplayerView from './components/MultiplayerView';
import LibraryView from './components/LibraryView';
import ErrorBoundary from './components/ErrorBoundary';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'unknown',
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [currentGame, setCurrentGame] = useState<{ mode: GameMode; category?: Category; difficulty: Difficulty } | null>(null);
  const [showAcademicMenu, setShowAcademicMenu] = useState(false);
  const [showUMEMenu, setShowUMEMenu] = useState(false);
  const [showSSCEMenu, setShowSSCEMenu] = useState(false);
  const [showGCEMenu, setShowGCEMenu] = useState(false);
  const [showNECOMenu, setShowNECOMenu] = useState(false);
  const [showJSSCEMenu, setShowJSSCEMenu] = useState(false);
  const [showSpecialistMenu, setShowSpecialistMenu] = useState(false);
  const [showRevelationsMenu, setShowRevelationsMenu] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [researchContent, setResearchContent] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState<{ score: number; streak: number; won: boolean; grade: string; message: string } | null>(null);
  const [rateLimit, setRateLimit] = useState<{ isRateLimited: boolean; remainingMs: number }>({ isRateLimited: false, remainingMs: 0 });
  const [loginError, setLoginError] = useState<string | null>(null);

  // Initialize Guest User
  useEffect(() => {
    // Test Firestore connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection successful.");
      } catch (error: any) {
        if (error.message && error.message.includes('the client is offline')) {
          console.error("Firestore is offline. Check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Pre-warm cache for common categories immediately
    // We reduced this to avoid hitting Gemini API quota limits on startup
    prewarmCache(['General Knowledge', 'Mathematics', 'Science & Nature']);

    // Monitor rate limit status
    const rateLimitInterval = setInterval(() => {
      const status = getRateLimitStatus();
      setRateLimit({ isRateLimited: status.isRateLimited, remainingMs: status.remainingMs });
    }, 2000);

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        // Automatically enter as guest if not logged in
        handleGuestLogin();
        setLoading(false);
        return;
      }

      const userId = authUser.uid;
      console.log("Using Firebase Auth UID:", userId);

      const userDocRef = doc(db, 'users', userId);
      let userDocSnap;
      try {
        userDocSnap = await getDoc(userDocRef);
      } catch (error) {
        console.error("Failed to fetch user document:", error);
        handleGuestLogin();
        setLoading(false);
        return;
      }

      if (userDocSnap && userDocSnap.exists()) {
        console.log("Existing warrior profile found.");
        setUser(userDocSnap.data() as User);
      } else {
        console.log("Creating new warrior profile...");
        // Create new profile using Google info if available
        const newUser: User = {
          id: userId,
          username: authUser.displayName || `Warrior_${userId.substr(-4)}`,
          email: authUser.email || '',
          royaltyPoints: 0,
          highestScore: 0,
          longestStreak: 0,
          favoriteCategory: 'General Knowledge',
          avatar: authUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          playCount: {},
          role: 'player',
          createdAt: new Date().toISOString()
        };

        try {
          await setDoc(userDocRef, newUser);
          console.log("Warrior profile created successfully.");
        } catch (error) {
          console.error("Failed to create user document:", error);
          handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
        }

        // Initialize leaderboard entry too
        try {
          await setDoc(doc(db, 'leaderboard', userId), {
            id: userId,
            username: newUser.username,
            royaltyPoints: newUser.royaltyPoints,
            highestScore: newUser.highestScore,
            avatar: newUser.avatar
          });
          console.log("Leaderboard entry initialized.");
        } catch (error) {
          console.error("Failed to initialize leaderboard entry:", error);
          handleFirestoreError(error, OperationType.WRITE, `leaderboard/${userId}`);
        }
        
        setUser(newUser);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearInterval(rateLimitInterval);
    };
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    console.log("Initiating Google Sign-In...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Login successful:", result.user.uid);
    } catch (error: any) {
      console.error("Login failed with code:", error.code);
      console.error("Full error object:", error);
      
      let message = "Login failed. Please try again.";
      if (error.code === 'auth/popup-blocked') {
        message = "Login popup was blocked. Please allow popups for this site.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "Login popup was closed before completion.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = "Only one login popup can be open at a time.";
      } else if (error.code === 'auth/internal-error') {
        message = "Internal authentication error. Try again later.";
      } else if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized for Firebase Auth. Please check your Firebase console.";
      } else if (error.message) {
        message = `${error.message} (${error.code})`;
      }
      setLoginError(message);
    }
  };

  const handleGuestLogin = () => {
    console.log("Entering as Guest...");
    const guestId = `guest_${Math.random().toString(36).substr(2, 9)}`;
    const guestUser: User = {
      id: guestId,
      username: `Guest_Warrior_${guestId.substr(-4)}`,
      email: '',
      royaltyPoints: 0,
      highestScore: 0,
      longestStreak: 0,
      favoriteCategory: 'General Knowledge',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
      playCount: {},
      role: 'player',
      createdAt: new Date().toISOString(),
      isGuest: true
    };
    setUser(guestUser);
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    try {
      const userDocRef = doc(db, 'users', user.id);
      try {
        await updateDoc(userDocRef, updates);
        console.log('User profile updated successfully');
      } catch (error) {
        console.error('Failed to update user profile:', error);
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
      }
      
      // Also update leaderboard if relevant fields changed
      const leaderboardFields = ['username', 'royaltyPoints', 'highestScore', 'avatar'];
      const changedLeaderboardFields = Object.keys(updates).filter(key => leaderboardFields.includes(key));
      
      if (changedLeaderboardFields.length > 0) {
        const leaderboardUpdates: any = {};
        changedLeaderboardFields.forEach(field => {
          leaderboardUpdates[field] = (updates as any)[field];
        });
 
        try {
          await setDoc(doc(db, 'leaderboard', user.id), leaderboardUpdates, { merge: true });
          console.log('Leaderboard updated successfully');
        } catch (error) {
          console.error('Failed to update leaderboard:', error);
          handleFirestoreError(error, OperationType.UPDATE, `leaderboard/${user.id}`);
        }
      }
    } catch (error) {
      console.error('Error in handleUpdateUser:', error);
    }
  };

  const handleGameEnd = (stats: { score: number; streak: number; won: boolean; grade: string; message: string }) => {
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

    setSummaryStats(stats);

    setCurrentGame(null);
    setShowAcademicMenu(false);
    setShowUMEMenu(false);
    setShowSSCEMenu(false);
    setShowGCEMenu(false);
    setShowNECOMenu(false);
    setShowJSSCEMenu(false);
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

  if (!user) return null;

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
        difficulty={currentGame.difficulty}
        user={user}
        onGameEnd={handleGameEnd}
        onExit={(stats) => {
          // If the player exits early, still save their current score and streak
          if (stats && stats.score > 0) {
            handleGameEnd({ ...stats, won: false, grade: 'ABANDONED', message: 'Do better next time.' });
          } else {
            setCurrentGame(null);
          }
        }}
      />
    );
  }

  const handleRefreshTitle = async () => {
    // AI Title feature removed as requested
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'leaderboard':
        return <LeaderboardView />;
      case 'library':
        return <LibraryView />;
      case 'profile':
        return (
          <ProfileView 
            user={user} 
            onUpdateUser={handleUpdateUser} 
            onRefreshTitle={handleRefreshTitle}
            isAIActive={false}
          />
        );
      case 'settings':
        return <SettingsView user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />;
      default:
        return (
          <div className="p-6 pb-32 animate-in fade-in duration-500">
            <header className="flex justify-between items-center mb-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-cinzel gold-text-gradient font-bold leading-none">ARKUMEN</h1>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-gray-400 text-xs tracking-[0.2em] font-bold uppercase">the elite quiz arena</p>
                </div>
              </div>
              <div 
                onClick={() => setActiveTab('profile')}
                className="w-12 h-12 rounded-full border-2 border-[#d4af37] p-0.5 cursor-pointer hover:scale-110 transition-transform active:scale-95 overflow-hidden shadow-lg shadow-yellow-500/10"
              >
                <img src={user.avatar} className="w-full h-full rounded-full object-cover bg-slate-800" alt="Profile" />
              </div>
            </header>

            <div className="mb-8">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase">Core Challenges</h2>
                <div className="flex bg-slate-900/80 rounded-lg p-1 border border-slate-800">
                  {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        difficulty === d 
                          ? 'bg-[#d4af37] text-slate-900 shadow-lg' 
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
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
                        setShowGCEMenu(false);
                        setShowNECOMenu(false);
                        setShowJSSCEMenu(false);
                      } else {
                        setCurrentGame({ mode: mode.id, category: 'General Knowledge', difficulty });
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
                  onClick={() => setCurrentGame({ mode: GameMode.MULTIPLAYER, difficulty })}
                  className="group relative overflow-hidden glass-card p-6 rounded-2xl border border-pink-500/30 flex items-center gap-6 transition-all duration-300 hover:border-pink-400/50 hover:bg-slate-800/50 active:scale-[0.98]"
                >
                  <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                    {GAME_MODES[10].icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold font-cinzel group-hover:text-pink-400 transition-colors">{GAME_MODES[10].title}</h3>
                      <div className="bg-pink-500/20 text-pink-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-pink-500/30">Live</div>
                    </div>
                    <p className="text-sm text-gray-500">{GAME_MODES[10].description}</p>
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
                      onClick={() => setCurrentGame({ mode: GameMode.CATEGORY, category: cat, difficulty })}
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
                    onClick={() => setCurrentGame({ mode: GameMode.ACADEMIC, category: cat, difficulty })}
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
                  setCurrentGame({ mode: GameMode.REVELATIONS, category: 'Revelations', difficulty });
                }}
                className="group w-full relative overflow-hidden glass-card p-6 rounded-2xl border border-amber-500/30 flex items-center gap-6 transition-all duration-300 hover:border-amber-400/50 hover:bg-slate-800/50 active:scale-[0.98]"
              >
                <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                  {GAME_MODES[11].icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-cinzel group-hover:text-amber-400 transition-colors">{GAME_MODES[11].title}</h3>
                    <div className="bg-amber-500/20 text-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-amber-500/30">Special</div>
                  </div>
                  <p className="text-sm text-gray-500">{GAME_MODES[11].description}</p>
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
                    setShowGCEMenu(false);
                    setShowNECOMenu(false);
                    setShowJSSCEMenu(false);
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
                        onClick={() => setCurrentGame({ mode: GameMode.UME, category: cat, difficulty })}
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
                    setShowGCEMenu(false);
                    setShowNECOMenu(false);
                    setShowJSSCEMenu(false);
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
                        onClick={() => setCurrentGame({ mode: GameMode.SSCE, category: cat, difficulty })}
                        className="glass-card p-4 rounded-xl text-left border border-slate-800 hover:border-orange-500/50 transition-all active:scale-[0.98]"
                      >
                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 truncate">{cat}</div>
                        <div className="text-xs font-bold text-orange-400">Start SSCE</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* G.C.E Prep */}
                <button
                  onClick={() => {
                    setShowGCEMenu(!showGCEMenu);
                    setShowAcademicMenu(false);
                    setShowUMEMenu(false);
                    setShowSSCEMenu(false);
                    setShowNECOMenu(false);
                    setShowJSSCEMenu(false);
                    setShowSpecialistMenu(false);
                  }}
                  className={`group relative overflow-hidden glass-card p-6 rounded-2xl border border-indigo-500/30 flex items-center gap-6 transition-all duration-300 hover:border-indigo-400/50 hover:bg-slate-800/50 active:scale-[0.98] ${showGCEMenu ? 'bg-slate-800/80 border-indigo-400' : ''}`}
                >
                  <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                    {GAME_MODES[7].icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold font-cinzel group-hover:text-indigo-400 transition-colors">{GAME_MODES[7].title}</h3>
                    <p className="text-sm text-gray-500">{GAME_MODES[7].description}</p>
                  </div>
                  <div className="bg-indigo-500/20 text-indigo-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-indigo-500/30">Past Qs</div>
                </button>

                {showGCEMenu && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-4 my-2">
                    {ACADEMIC_SUBJECTS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCurrentGame({ mode: GameMode.GCE, category: cat, difficulty })}
                        className="glass-card p-4 rounded-xl text-left border border-slate-800 hover:border-indigo-500/50 transition-all active:scale-[0.98]"
                      >
                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 truncate">{cat}</div>
                        <div className="text-xs font-bold text-indigo-400">Start GCE</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* N.E.C.O Challenge */}
                <button
                  onClick={() => {
                    setShowNECOMenu(!showNECOMenu);
                    setShowAcademicMenu(false);
                    setShowUMEMenu(false);
                    setShowSSCEMenu(false);
                    setShowGCEMenu(false);
                    setShowJSSCEMenu(false);
                    setShowSpecialistMenu(false);
                  }}
                  className={`group relative overflow-hidden glass-card p-6 rounded-2xl border border-teal-500/30 flex items-center gap-6 transition-all duration-300 hover:border-teal-400/50 hover:bg-slate-800/50 active:scale-[0.98] ${showNECOMenu ? 'bg-slate-800/80 border-teal-400' : ''}`}
                >
                  <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                    {GAME_MODES[8].icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold font-cinzel group-hover:text-teal-400 transition-colors">{GAME_MODES[8].title}</h3>
                    <p className="text-sm text-gray-500">{GAME_MODES[8].description}</p>
                  </div>
                  <div className="bg-teal-500/20 text-teal-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-teal-500/30">Past Qs</div>
                </button>

                {showNECOMenu && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-4 my-2">
                    {ACADEMIC_SUBJECTS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCurrentGame({ mode: GameMode.NECO, category: cat, difficulty })}
                        className="glass-card p-4 rounded-xl text-left border border-slate-800 hover:border-teal-500/50 transition-all active:scale-[0.98]"
                      >
                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 truncate">{cat}</div>
                        <div className="text-xs font-bold text-teal-400">Start NECO</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* J.S.S.C.E Junior */}
                <button
                  onClick={() => {
                    setShowJSSCEMenu(!showJSSCEMenu);
                    setShowAcademicMenu(false);
                    setShowUMEMenu(false);
                    setShowSSCEMenu(false);
                    setShowGCEMenu(false);
                    setShowNECOMenu(false);
                    setShowSpecialistMenu(false);
                  }}
                  className={`group relative overflow-hidden glass-card p-6 rounded-2xl border border-rose-500/30 flex items-center gap-6 transition-all duration-300 hover:border-rose-400/50 hover:bg-slate-800/50 active:scale-[0.98] ${showJSSCEMenu ? 'bg-slate-800/80 border-rose-400' : ''}`}
                >
                  <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                    {GAME_MODES[9].icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold font-cinzel group-hover:text-rose-400 transition-colors">{GAME_MODES[9].title}</h3>
                    <p className="text-sm text-gray-500">{GAME_MODES[9].description}</p>
                  </div>
                  <div className="bg-rose-500/20 text-rose-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-rose-500/30">Junior</div>
                </button>

                {showJSSCEMenu && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-4 my-2">
                    {JSSCE_SUBJECTS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCurrentGame({ mode: GameMode.JSSCE, category: cat, difficulty })}
                        className="glass-card p-4 rounded-xl text-left border border-slate-800 hover:border-rose-500/50 transition-all active:scale-[0.98]"
                      >
                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 truncate">{cat}</div>
                        <div className="text-xs font-bold text-rose-400">Start JSSCE</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase mb-4">Study Resources</h2>
              <button
                onClick={() => setActiveTab('library')}
                className="group w-full relative overflow-hidden glass-card p-6 rounded-2xl border border-emerald-500/30 flex items-center gap-6 transition-all duration-300 hover:border-emerald-400/50 hover:bg-slate-800/50 active:scale-[0.98]"
              >
                <div className="p-4 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform border border-slate-800">
                  <ICONS.Library className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold font-cinzel group-hover:text-emerald-400 transition-colors">Academic Library</h3>
                    <div className="bg-emerald-500/20 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-emerald-500/30">Free PDFS</div>
                  </div>
                  <p className="text-sm text-gray-500">Download official textbooks and study materials.</p>
                </div>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative max-w-md mx-auto bg-[#050b18] overflow-x-hidden border-x border-slate-800 shadow-[0_0_100px_rgba(212,175,55,0.05)]">
      {rateLimit.isRateLimited && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="glass-card p-3 rounded-xl border border-yellow-500/50 bg-yellow-500/10 backdrop-blur-md flex items-center gap-3 shadow-lg shadow-yellow-500/10">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <ICONS.SettingsIcon className="w-4 h-4 text-yellow-500 animate-spin-slow" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">AI Quota Limit</div>
              <div className="text-xs text-gray-300">AI is cooling down. Using static questions for {Math.ceil(rateLimit.remainingMs / 1000)}s.</div>
            </div>
          </div>
        </div>
      )}
      {renderContent()}

      {summaryStats && (
        <div className="fixed inset-0 z-[100] bg-[#050b18]/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-[#d4af37]/30 text-center relative overflow-hidden shadow-2xl shadow-yellow-500/10">
            {/* Background Glow */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${summaryStats.won ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            
            <div className="relative z-10">
              <div className={`text-2xl sm:text-3xl px-2 mb-4 font-cinzel font-black tracking-[0.15em] leading-tight ${summaryStats.won ? 'gold-text-gradient' : 'text-red-500'}`}>
                {summaryStats.grade}
              </div>
              
              <h2 className="text-xl font-cinzel text-white font-bold mb-2 uppercase tracking-widest">Challenge Complete</h2>
              <p className="text-gray-400 text-sm mb-8 italic">"{summaryStats.message}"</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Score</div>
                  <div className="text-2xl font-cinzel text-[#d4af37]">{summaryStats.score}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Best Streak</div>
                  <div className="text-2xl font-cinzel text-[#d4af37]">{summaryStats.streak}</div>
                </div>
              </div>
              
              <button 
                onClick={() => setSummaryStats(null)}
                className="w-full py-4 gold-gradient text-slate-900 font-bold rounded-xl shadow-xl hover:scale-105 transition-all transform active:scale-95"
              >
                RETURN TO LOBBY
              </button>
            </div>
          </div>
        </div>
      )}

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
