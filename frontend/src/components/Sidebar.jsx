import React from 'react';
import {
  BrainCircuit,
  ChevronDown,
  Clock3,
  Heart,
  LayoutGrid,
  LogOut,
  Music2,
  RotateCcw,
} from 'lucide-react';
import useMusicStore from '../musicStore';

const Sidebar = ({ onNavigate }) => {
  const {
    user,
    logout,
    view,
    setView,
    likedSongs,
    recentlyPlayed,
    recommendations,
    selectedGenre,
    setGenre,
    selectedMood,
    setMood,
    selectedDuration,
    setDuration,
    selectedLanguage,
    setLanguage,
    resetFilters,
    setCurrentSong,
  } = useMusicStore();

  const navigate = (nextView) => {
    setView(nextView);
    onNavigate?.();
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    if (view !== 'home') setView('home');
    onNavigate?.();
  };

  return (
    <aside className="w-72 h-screen bg-black/95 md:bg-black/40 backdrop-blur-xl border-r border-white/10 md:border-white/5 flex flex-col fixed left-0 top-0 z-50 pb-28">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Music2 className="text-black" size={22} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">VibeStream</h1>
        </div>

        <nav className="flex flex-col gap-1 px-2">
          <NavItem
            active={view === 'home'}
            onClick={() => navigate('home')}
            icon={<LayoutGrid size={18} />}
            label="Music Library"
          />
          <NavItem
            active={view === 'recommended'}
            onClick={() => navigate('recommended')}
            icon={<BrainCircuit size={18} />}
            label="For You"
            badge={recommendations?.length || 0}
          />
          <NavItem
            active={view === 'recent'}
            onClick={() => navigate('recent')}
            icon={<Clock3 size={18} />}
            label="Recent Plays"
            badge={recentlyPlayed?.length || 0}
          />
          <NavItem
            active={view === 'liked'}
            onClick={() => navigate('liked')}
            icon={<Heart size={18} fill={view === 'liked' ? 'currentColor' : 'none'} />}
            label="My Collection"
            badge={likedSongs?.length || 0}
          />
        </nav>
      </div>
    
      

      <div className="p-6 border-t border-white/5 mt-auto bg-black/40 backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="mt-auto px-4 py-2 border-t border-white/5">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Logged in as:</p>
            <p className="text-xs font-bold text-emerald-400 truncate">{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* 🟢 RESET FILTERS (Placed immediately below user info) */}
        <div className="p-3 border-t border-white/5">
            <button 
                onClick={resetFilters} 
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-zinc-400 hover:text-white border border-dashed border-zinc-700 rounded-lg hover:border-zinc-500 transition-all"
            >
                <RotateCcw size={14} /> Reset Filters
            </button>
        </div>
      </div>
    </aside>
  );
};

const NavItem = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all group ${
      active ? 'bg-emerald-500/10 text-emerald-500' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex items-center gap-4 min-w-0">
      <span className={active ? 'scale-110' : 'group-hover:scale-110 transition-transform'}>{icon}</span>
      <span className="font-medium truncate">{label}</span>
    </div>
    {badge !== undefined && (
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
        {badge}
      </span>
    )}
  </button>
);

const FilterSelect = ({ label, value, onChange, options }) => (
  <label className="relative block">
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-zinc-900 text-white border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer hover:bg-zinc-800 transition-all"
    >
      {options.map((opt) => (
        <option key={opt.v} value={opt.v} className="bg-zinc-900 text-white">
          {opt.t}
        </option>
      ))}
    </select>
    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
  </label>
);

export default Sidebar;
