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

        <nav className="flex flex-col gap-2">
          <NavItem
            active={view === 'home'}
            onClick={() => navigate('home')}
            icon={<LayoutGrid size={20} />}
            label="Music Library"
          />
          <NavItem
            active={view === 'recommended'}
            onClick={() => navigate('recommended')}
            icon={<BrainCircuit size={20} />}
            label="For You"
            badge={recommendations?.length || 0}
          />
          <NavItem
            active={view === 'recent'}
            onClick={() => navigate('recent')}
            icon={<Clock3 size={20} />}
            label="Recent Plays"
            badge={recentlyPlayed?.length || 0}
          />
          <NavItem
            active={view === 'liked'}
            onClick={() => navigate('liked')}
            icon={<Heart size={20} fill={view === 'liked' ? 'currentColor' : 'none'} />}
            label="My Collection"
            badge={likedSongs?.length || 0}
          />
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 custom-scrollbar space-y-6">
        <div className="flex flex-col gap-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold px-2">Refine</p>

          <FilterSelect
            label="Genre"
            value={selectedGenre}
            onChange={(event) => handleFilterChange(setGenre, event.target.value)}
            options={[
              { v: 'all', t: 'All Genres' },
              { v: 'Bollywood', t: 'Bollywood' },
              { v: 'Pop', t: 'Pop' },
              { v: 'Lo-Fi', t: 'Lo-Fi' },
              { v: 'Rock', t: 'Rock' },
              { v: 'Electronic', t: 'Electronic' },
            ]}
          />

          <FilterSelect
            label="Language"
            value={selectedLanguage}
            onChange={(event) => handleFilterChange(setLanguage, event.target.value)}
            options={[
              { v: 'all', t: 'All Languages' },
              { v: 'Hindi', t: 'Hindi' },
              { v: 'English', t: 'English' },
              { v: 'Bengali', t: 'Bengali' },
              { v: 'Punjabi', t: 'Punjabi' },
              { v: 'Others', t: 'Others' },
            ]}
          />

          <FilterSelect
            label="Duration"
            value={selectedDuration}
            onChange={(event) => handleFilterChange(setDuration, event.target.value)}
            options={[
              { v: 'all', t: 'All Durations' },
              { v: 'Short', t: 'Short (< 3m)' },
              { v: 'Mid', t: 'Medium (3-5m)' },
              { v: 'Long', t: 'Long (> 5m)' },
            ]}
          />

          <FilterSelect
            label="Mood"
            value={selectedMood}
            onChange={(event) => handleFilterChange(setMood, event.target.value)}
            options={[
              { v: 'all', t: 'All Moods' },
              { v: 'Happy', t: 'Happy' },
              { v: 'Sad', t: 'Sad' },
              { v: 'Chill', t: 'Chill' },
              { v: 'Energetic', t: 'Energetic' },
              { v: 'Romantic', t: 'Romantic' },
              { v: 'Party', t: 'Party' },
            ]}
          />
        </div>

        {recentlyPlayed.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-3 px-2">Latest</p>
            <div className="space-y-2">
              {recentlyPlayed.slice(0, 5).map((song) => (
                <button
                  key={song.id || song.msg_id}
                  onClick={() => setCurrentSong(song)}
                  className="w-full flex items-center gap-3 rounded-lg p-2 text-left hover:bg-white/5 transition-colors"
                >
                  <img src={song.album_art || 'https://placehold.co/80'} alt="" className="w-9 h-9 rounded object-cover bg-zinc-800" />
                  <span className="min-w-0">
                    <span className="block text-sm text-white truncate">{song.title}</span>
                    <span className="block text-xs text-zinc-500 truncate">{song.artist}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/5 mt-auto bg-black/40 backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase text-zinc-500 font-bold">Logged in as</span>
            <span className="text-sm text-emerald-500 font-medium truncate max-w-[140px]">{user?.username}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>

        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-dashed border-white/10 text-zinc-500 hover:text-white hover:border-white/20 transition-all text-xs font-medium hover:bg-white/5"
        >
          <RotateCcw size={14} />
          Reset Filters
        </button>
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
