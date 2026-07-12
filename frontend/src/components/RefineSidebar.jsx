import React from 'react';
import { ChevronDown, RotateCcw,Search } from 'lucide-react';

const RefineSidebar = ({
  handleFilterChange,
  setGenre,
  setLanguage,
  setDuration,
  setMood,
  selectedGenre,
  selectedLanguage,
  selectedDuration,
  selectedMood,
  resetFilters,
  onSearch 
}) => {
  return (
    <div className="w-72 shrink-0 bg-black border-r border-white/10 h-full flex flex-col p-4 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold px-2">Refine</p>

        <label className="relative block">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-1 mb-1 block">Genre</span>
          <select
            value={selectedGenre}
            onChange={(event) => handleFilterChange(setGenre, event.target.value)}
            className="w-full bg-zinc-900 text-white border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer hover:bg-zinc-800 transition-all"
          >
            <option value="all">All Genres</option>
            <option value="Bollywood">Bollywood</option>
            <option value="Pop">Pop</option>
            <option value="Lo-Fi">Lo-Fi</option>
            <option value="Rock">Rock</option>
            <option value="Electronic">Electronic</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-[38px] text-zinc-500 pointer-events-none" />
        </label>

        <label className="relative block">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-1 mb-1 block">Language</span>
          <select
            value={selectedLanguage}
            onChange={(event) => handleFilterChange(setLanguage, event.target.value)}
            className="w-full bg-zinc-900 text-white border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer hover:bg-zinc-800 transition-all"
          >
            <option value="all">All Languages</option>
            <option value="Hindi">Hindi</option>
            <option value="English">English</option>
            <option value="Bengali">Bengali</option>
            <option value="Punjabi">Punjabi</option>
            <option value="Others">Others</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-[38px] text-zinc-500 pointer-events-none" />
        </label>

        <label className="relative block">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-1 mb-1 block">Duration</span>
          <select
            value={selectedDuration}
            onChange={(event) => handleFilterChange(setDuration, event.target.value)}
            className="w-full bg-zinc-900 text-white border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer hover:bg-zinc-800 transition-all"
          >
            <option value="all">All Durations</option>
            <option value="Short">Short (&lt; 3m)</option>
            <option value="Mid">Medium (3-5m)</option>
            <option value="Long">Long (&gt; 5m)</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-[38px] text-zinc-500 pointer-events-none" />
        </label>

        <label className="relative block">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-1 mb-1 block">Mood</span>
          <select
            value={selectedMood}
            onChange={(event) => handleFilterChange(setMood, event.target.value)}
            className="w-full bg-zinc-900 text-white border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer hover:bg-zinc-800 transition-all"
          >
            <option value="all">All Moods</option>
            <option value="Happy">Happy</option>
            <option value="Sad">Sad</option>
            <option value="Chill">Chill</option>
            <option value="Energetic">Energetic</option>
            <option value="Romantic">Romantic</option>
            <option value="Party">Party</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-[38px] text-zinc-500 pointer-events-none" />
        </label>
      </div>
      {/* NEW: Search button */}
      <button
        onClick={onSearch}
        className="mt-4 flex items-center justify-center gap-2 p-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-all"
      >
        <Search size={16} /> Search
      </button>
      <button
        onClick={resetFilters}
        className="mt-auto flex items-center justify-center gap-2 p-3 text-zinc-400 hover:text-white border border-dashed border-zinc-700 rounded-lg hover:border-zinc-500 transition-all"
      >
        <RotateCcw size={16} /> Reset Filters
      </button>
    </div>
  );
};

export default RefineSidebar;
