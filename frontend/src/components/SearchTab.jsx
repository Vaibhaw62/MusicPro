// File: src/components/SearchTab.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Mic, Clock, Play, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useMusicStore from '../musicStore';
import voiceRecorder from '../services/voiceRecorder';
import RefineSidebar from './RefineSidebar';

const SearchTab = () => {
  const {
    searchQuery,
    setSearchQuery,
    songs,
    setCurrentSong,
    setView,
    isLoading,
    recentSearches,
    selectedGenre,
    setGenre,
    selectedLanguage,
    setLanguage,
    selectedDuration,
    setDuration,
    selectedMood,
    setMood,
    resetFilters,
    pauseSong,
  } = useMusicStore();

  const [hasSearched, setHasSearched] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleFilterChange = (setter, value) => {
    setter(value);
  };

  const handleFilterSearch = () => {
    setSearchQuery(localQuery, { keepView: true });
    setHasSearched(true);
  };

  const recordingTimeoutRef = useRef(null);

  // Voice search for the Search tab — same recording pipeline Vibe AI's mic
  // uses (voiceRecorder: record -> upload -> backend transcribes). Unlike
  // Vibe AI, this only takes the transcribed text and drops it into the
  // search box — it never calls the intent/command step, so it can only
  // search, never auto-play a song.
  const startVoiceSearch = async () => {
    try {
      if (voiceRecorder.isRecording()) return;

      // Pause playback first — otherwise the mic picks up the song audio
      // too and mishears the query (same fix already applied to Vibe AI's mic).
      pauseSong();

      setIsListening(true);
      await voiceRecorder.startRecording();
      toast.success('Listening...');

      recordingTimeoutRef.current = setTimeout(async () => {
        try {
          await voiceRecorder.stopRecording();
          const response = await voiceRecorder.uploadRecording();

          const transcript =
            response?.voice?.normalized_text ||
            response?.voice?.text ||
            '';

          if (!transcript.trim()) {
            toast.error("I couldn't hear anything.");
            return;
          }

          setLocalQuery(transcript);
          setHasSearched(true);
        } catch (error) {
          console.error('Voice search processing failed:', error);
          toast.error('Voice search failed.');
        } finally {
          setIsListening(false);
        }
      }, 5000);
    } catch (error) {
      console.error('Unable to start voice search recording:', error);
      toast.error('Unable to start recording.');
      setIsListening(false);
    }
  };

  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [activeTab, setActiveTab] = useState('Songs');
  
  // The exact tab order requested in Update 5
  const tabs = ['Playlists', 'Songs', 'Artists', 'Albums'];

  // Debounce search so we don't spam the backend while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery, { keepView: true });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery, searchQuery]);

  // Group results to maintain project integrity without needing a new backend route
  const displayResults = useMemo(() => {
    if (!songs) return [];
    if (activeTab === 'Songs' || activeTab === 'Playlists') return songs;

    if (activeTab === 'Artists') {
      const seen = new Set();
      return songs.filter(song => {
        if (seen.has(song.artist)) return false;
        seen.add(song.artist);
        return true;
      });
    }

    if (activeTab === 'Albums') {
      const seen = new Set();
      return songs.filter(song => {
        const albumKey = song.album || song.title; 
        if (seen.has(albumKey)) return false;
        seen.add(albumKey);
        return true;
      });
    }
    return songs;
  }, [songs, activeTab]);

  // Trigger continuous playback using existing store architecture (Update 7)
  const handlePlay = (song) => {
    setCurrentSong(song);
  };

  return (
    <div className="flex h-full w-full bg-black text-white overflow-hidden">
      
      {/* 1. LEFT SIDEBAR: Refine Controls (reused, store-connected) */}
      <RefineSidebar
        handleFilterChange={handleFilterChange}
        setGenre={setGenre}
        setLanguage={setLanguage}
        setDuration={setDuration}
        setMood={setMood}
        selectedGenre={selectedGenre}
        selectedLanguage={selectedLanguage}
        selectedDuration={selectedDuration}
        selectedMood={selectedMood}
        resetFilters={resetFilters}
        onSearch={handleFilterSearch}
      />
  
      {/* 2. RIGHT SIDE: Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* FIXED HEADER: Search Bar + Tabs — never scrolls, always visible */}
        <div className="flex-shrink-0 bg-black px-6 pt-4">
          {/* Top Search Bar */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setView('home')} className="p-2 text-zinc-400 hover:text-white"><ArrowLeft size={24} /></button>
            <div className="flex-1 relative flex items-center bg-zinc-900 rounded-full px-4 py-2 border border-white/10 focus-within:border-zinc-500 transition-colors">
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search songs, artists..."
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-zinc-500"
                autoFocus
              />
              {localQuery && (
                <button onClick={() => { setLocalQuery(''); setHasSearched(false); }} className="p-1 text-zinc-400 hover:text-white mr-2">
                  <X size={16} />
                </button>
              )}
              <button
                onClick={startVoiceSearch}
                title="Search by voice"
                className={`p-1.5 rounded-full transition-all ml-1 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-zinc-800 text-emerald-400 hover:scale-110'
                }`}
              >
                <Mic size={16} />
              </button>
            </div>
          </div>

          {/* Tabs Row */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto custom-scrollbar pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* SCROLLABLE: Search Results / History Area — scrolls beneath the fixed header */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-32">
          {!localQuery.trim() && !hasSearched ? (
            <div>
              <h3 className="text-zinc-400 text-sm font-medium mb-4">Recent searches</h3>
              <div className="space-y-4">
                {recentSearches.length > 0 ? (
                  recentSearches.map((hist, i) => (
                    <div key={i} className="flex items-center gap-4 text-zinc-300 hover:text-white cursor-pointer group" onClick={() => { setLocalQuery(hist); setSearchQuery(hist); }}>
                      <Clock size={20} className="text-zinc-500 group-hover:text-zinc-300" />
                      <span className="flex-1 text-base">{hist}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-sm">No recent searches yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-zinc-400 mb-4">Showing results for <span className="text-white font-medium">{localQuery}</span></p>
              {isLoading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : displayResults.length > 0 ? (
                displayResults.map((song) => (
                  <div key={song.id || song.msg_id} onClick={() => handlePlay(song)} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                    <div className="relative">
                      <img src={song.album_art || 'https://placehold.co/80'} alt="" className="w-14 h-14 rounded-md object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-md transition-opacity"><Play size={20} fill="white" className="text-white" /></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-base font-medium truncate">{song.title}</h4>
                      <p className="text-zinc-400 text-sm truncate">{song.artist}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-zinc-500">No results found for {activeTab}.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default SearchTab;
