
import React, { useState, useRef } from 'react';
import { User, Category } from '../types';
import { ICONS, CATEGORIES } from '../constants';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onRefreshTitle: () => Promise<void>;
  isAIActive: boolean;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, onRefreshTitle, isAIActive }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshingTitle, setIsRefreshingTitle] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user.username);
  const [editedAvatar, setEditedAvatar] = useState(user.avatar);
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = () => {
    onUpdateUser({ username: editedUsername, avatar: editedAvatar });
    setIsEditing(false);
    setShowAvatarInput(false);
  };

  const cycleAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    setEditedAvatar(newAvatar);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b18] text-white p-6 pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-cinzel gold-text-gradient font-bold">MY PROFILE</h1>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-yellow-500/20 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
           <button 
             onClick={() => isEditing ? saveProfile() : setIsEditing(true)}
             className="text-[#d4af37] text-sm font-bold uppercase tracking-widest bg-[#050b18]/50 px-3 py-1 rounded-full border border-[#d4af37]/30 hover:bg-[#d4af37] hover:text-[#050b18] transition-all"
           >
             {isEditing ? 'Save' : 'Edit'}
           </button>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="relative mb-6 group">
            <img 
              src={isEditing ? editedAvatar : user.avatar} 
              alt="Avatar" 
              className="w-32 h-32 rounded-full border-4 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)] object-cover bg-slate-800"
            />
            {isEditing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] font-bold bg-[#d4af37] text-slate-900 px-2 py-1 rounded-full hover:scale-105 transition-transform"
                >
                  <ICONS.Camera className="w-3 h-3" />
                  Upload
                </button>
                <button 
                  onClick={cycleAvatar}
                  className="text-[10px] font-bold text-white hover:text-[#d4af37] transition-colors"
                >
                  Randomize
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-[#d4af37] text-slate-900 rounded-full p-2 border-2 border-[#050b18]">
               <ICONS.Crown className="w-5 h-5" />
            </div>
          </div>

          {isEditing ? (
            <div className="w-full max-w-[200px] flex flex-col gap-2">
              <input 
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                className="bg-slate-900 border border-[#d4af37]/50 rounded px-4 py-2 text-center text-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#d4af37]"
                placeholder="Username"
              />
              <button 
                onClick={() => setShowAvatarInput(!showAvatarInput)}
                className="text-[10px] text-gray-500 uppercase font-bold hover:text-[#d4af37]"
              >
                Custom URL?
              </button>
              {showAvatarInput && (
                <input 
                  value={editedAvatar}
                  onChange={(e) => setEditedAvatar(e.target.value)}
                  className="bg-slate-900 border border-[#d4af37]/30 rounded px-2 py-1 text-[10px] focus:outline-none"
                  placeholder="Image URL"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold tracking-tight">{user.username}</h2>
              {user.warriorTitle && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[#d4af37] font-cinzel italic text-sm tracking-wide">{user.warriorTitle}</p>
                  {isAIActive && (
                    <button 
                      onClick={async () => {
                        setIsRefreshingTitle(true);
                        await onRefreshTitle();
                        setIsRefreshingTitle(false);
                      }}
                      disabled={isRefreshingTitle}
                      className={`p-1 rounded-full hover:bg-white/5 transition-colors ${isRefreshingTitle ? 'animate-spin' : ''}`}
                      title="Refresh AI Title"
                    >
                      <ICONS.RefreshCw className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-800">
           <div className="text-center">
             <div className="text-[#d4af37] font-cinzel text-2xl font-bold">{user.royaltyPoints.toLocaleString()}</div>
             <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Royalty Points</div>
           </div>
           <div className="text-center border-l border-slate-800">
             <div className="text-white font-cinzel text-2xl font-bold">{user.highestScore.toLocaleString()}</div>
             <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">High Score</div>
           </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase">Achievements & Stats</h3>
        
        <div className="space-y-4">
           <div className="glass-card p-5 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-amber-500/10 rounded-lg">
               <ICONS.Zap className="w-6 h-6 text-amber-500" />
             </div>
             <div>
               <div className="text-xs text-gray-500 font-bold uppercase">Longest Streak</div>
               <div className="text-lg font-bold">{user.longestStreak} Answers</div>
             </div>
           </div>

           <div className="glass-card p-5 rounded-xl flex items-center gap-4">
             <div className="p-3 bg-emerald-500/10 rounded-lg">
               <ICONS.Award className="w-6 h-6 text-emerald-500" />
             </div>
             <div>
               <div className="text-xs text-gray-500 font-bold uppercase">Favorite Category</div>
               <div className="text-lg font-bold truncate max-w-[180px]">{user.favoriteCategory}</div>
             </div>
           </div>
        </div>

        <h3 className="text-sm font-bold tracking-widest text-[#d4af37] uppercase pt-4">Subject Mastery</h3>
        <div className="space-y-4">
          {CATEGORIES.slice(0, 5).map((cat) => {
            const mastery = Math.min(100, (user.playCount[cat] || 0) * 10);
            return (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>{cat}</span>
                  <span className="text-[#d4af37]">{mastery}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full gold-gradient transition-all duration-1000" 
                    style={{ width: `${mastery}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
