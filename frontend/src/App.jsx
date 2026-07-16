import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUp, Disc3, Menu, Music2,Sparkles, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { fetchSongs as fetchSongsApi } from './api';
import FullScreenPlayer from './components/FullScreenPlayer';
import Login from './components/Login';
import MusicPlayer from './components/MusicPlayer';
import Sidebar from './components/Sidebar';
import SongCard from './components/SongCard';
import useMusicStore, { getCoverFallback } from './musicStore';
import MusicBot from "./components/musicbot";
import SearchTab from './components/SearchTab';
import RefineSidebar from './components/RefineSidebar'; 

const viewMeta = {
  home: ['Discover', ''],
  liked: ['Liked Songs', 'Your personal collection'],
  recent: ['Recently Played', 'Latest songs first'],
  recommended: ['For You', ''],
};

const App = () => {
  const {
    user,
    songs,
    recommendations,
    recentlyPlayed,
    isLoading,
    isRecommendationsLoading,
    fetchSongs,
    fetchRecommendations,
    currentSong,
    view,
    setView,
    selectedDuration,
    selectedGenre,
    selectedMood,
    selectedLanguage,
    setDuration,
    setGenre,
    setMood,
    setLanguage,
    likedSongs,
    searchQuery,
    hasMore,
    setCurrentSong,
  } = useMusicStore();

  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true); 
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [isPlaylistLoading, setPlaylistLoading] = useState(false);
  const [isForYouOpen, setForYouOpen] = useState(false);
  const loaderRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchSongs(false);
      fetchRecommendations();
    }
  }, [user, fetchSongs, fetchRecommendations]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoading && view === 'home') {
        fetchSongs(true);
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    const loader = loaderRef.current;
    if (loader) observer.observe(loader);
    return () => {
      if (loader) observer.unobserve(loader);
    };
  }, [hasMore, isLoading, view, fetchSongs]);

  const handleScroll = (event) => {
    setShowTopBtn(event.target.scrollTop > 500);
  };

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displaySongs = useMemo(() => {
    if (view === 'liked') return likedSongs;
    if (view === 'recent') return recentlyPlayed;
    if (view === 'recommended') return recommendations;
    return songs;
  }, [songs, likedSongs, recentlyPlayed, recommendations, view]);

  const filteredSongs = useMemo(() => {
    if (view === 'home' || !searchQuery) return displaySongs;
    const query = searchQuery.toLowerCase();
    return displaySongs.filter((song) => {
      const haystack = `${song.title || ''} ${song.artist || ''} ${song.genre || ''} ${song.mood || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [displaySongs, searchQuery, view]);

  const homeSections = useMemo(() => buildHomeSections(songs), [songs]);
  const [baseTitle, baseSubtitle] = viewMeta[view] || viewMeta.home;
  const title = activePlaylist ? activePlaylist.title : baseTitle;
  const subtitle = activePlaylist ? activePlaylist.subtitle : baseSubtitle;

  useEffect(() => {
    setActivePlaylist(null);
    setPlaylistSongs([]);
    setForYouOpen(false);
  }, [view]);

  const openPlaylist = async (playlist) => {
    setActivePlaylist(playlist);
    setPlaylistSongs([]);
    setPlaylistLoading(true);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      if (playlist.daily) {
        const [hindiResults, bengaliResults, englishResults] = await Promise.all([
          fetchSongsApi('', 18, 'all', playlist.mood || 'all', 'all', 0, 'Hindi'),
          fetchSongsApi('', 12, 'all', playlist.mood || 'all', 'all', 0, 'Bengali'),
          fetchSongsApi('', 5, 'all', playlist.mood || 'all', 'all', 0, 'English'),
        ]);
        const nextSongs = limitEnglishSongs(
          uniqueSongs([
            ...(hindiResults || []),
            ...(bengaliResults || []),
            ...(englishResults || []),
            ...(playlist.songs || []),
          ]),
          5,
        );
        setPlaylistSongs(shuffleSongs(nextSongs, playlist.title).slice(0, 30));
        return;
      }

      const results = await fetchSongsApi(
        playlist.search || '',
        30,
        playlist.genre || 'all',
        playlist.mood || 'all',
        'all',
        0,
        playlist.language || 'all',
      );
      const nextSongs = results?.length ? results : playlist.songs;
      setPlaylistSongs(playlist.shuffle ? shuffleSongs(nextSongs, playlist.title).slice(0, 30) : nextSongs);
    } finally {
      setPlaylistLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <Toaster position="top-center" reverseOrder={false} />
        <Login />
      </>
    );
  }

  return (
    

    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
    <Toaster position="top-center" reverseOrder={false} />

    {/* 1. Desktop Sidebar Wrapper */}
    <div className={`hidden md:block z-40 fixed h-full transition-all duration-300 w-72 ${isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {view === 'search' ? (
        <RefineSidebar 
        handleFilterChange={(setter, val) => setter(val)} 
        setGenre={setGenre}
        setLanguage={setLanguage}
        setDuration={setDuration}
        setMood={setMood}
        selectedGenre={selectedGenre}
        selectedLanguage={selectedLanguage}
        selectedDuration={selectedDuration}
        selectedMood={selectedMood}
        resetFilters={() => {
          setGenre('all');
          setLanguage('all');
          setDuration('all');
          setMood('all');
        }}
      />
      ) : (
        <Sidebar />
      )}
    </div>

    {/* 2. Mobile Sidebar */}
    {isMobileSidebarOpen && (
      <div className="fixed inset-0 z-[70] md:hidden">
        <button className="absolute inset-0 bg-black/70" onClick={() => setMobileSidebarOpen(false)} />
        <div className="relative w-72 max-w-[86vw] h-full">
          <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
        </div>
      </div>
    )}

    {/* 3. Main Content Wrapper */}
    <div className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${isDesktopSidebarOpen ? 'md:pl-72' : 'md:pl-0'}`}> 
      <div className="md:hidden px-4 py-3 flex items-center justify-between bg-black/80 backdrop-blur-md sticky top-0 z-30 border-b border-white/5">
        <h1 className="text-lg font-bold text-white">VibeStream</h1>
        <button onClick={() => setMobileSidebarOpen((open) => !open)} className="p-2 text-zinc-300 hover:text-white">
          {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-5 md:p-8 pb-32 custom-scrollbar relative scroll-smooth"
        >
          <header className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              {/* Desktop Sidebar Toggle Button */}
              <button
                onClick={() => setDesktopSidebarOpen(!isDesktopSidebarOpen)}
                className="hidden md:flex p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
                title={isDesktopSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
              >
                <Menu size={20} />
              </button>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{title}</h1>
                {subtitle && <p className="text-zinc-400">{subtitle}</p>}
              </div>
            </div>

            {(view !== 'home' || activePlaylist) && (
              <button
                onClick={() => {
                  if (activePlaylist) {
                    setActivePlaylist(null);
                    setPlaylistSongs([]);
                    return;
                  }
                  setView('home');
                }}
                className="inline-flex w-fit items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowLeft size={16} /> {activePlaylist ? 'Playlists' : 'Library'}
              </button>
            )}
          </header>

          {view === 'home' && activePlaylist && (
            <div>
              {isPlaylistLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <PlaylistSection
                  title={activePlaylist.title}
                  subtitle={activePlaylist.subtitle}
                  songs={playlistSongs}
                  onPlay={setCurrentSong}
                  limit={30}
                />
              )}
            </div>
          )}

          {view === 'home' && !activePlaylist && (
            <div className="space-y-8">
              <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {homeSections.map((section) => (
                    <PlaylistCard
                      key={section.title}
                      playlist={section}
                      onClick={() => openPlaylist(section)}
                    />
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-5">
                {songs.map((song) => (
                  <SongCard key={song.id || song.msg_id} song={song} />
                ))}
              </section>

              <div ref={loaderRef} className="h-16 flex items-center justify-center w-full">
                {isLoading && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-zinc-500">Loading more music...</span>
                  </div>
                )}
                {!hasMore && songs.length > 0 && (
                  <span className="text-zinc-600 text-sm font-medium">End of library</span>
                )}
              </div>
            </div>
          )}

          {view === 'recommended' && (
            <div>
              {!isForYouOpen ? (
                <section className="max-w-sm">
                  <PlaylistCard
                    playlist={{
                      title: 'Songs You Might Like',
                      subtitle: 'We keep listening with you, shaping a mix that feels closer every day.',
                      songs: recommendations,
                      accent: 'from-emerald-500/35 via-cyan-500/20 to-white/5',
                    }}
                    onClick={() => setForYouOpen(true)}
                  />
                </section>
              ) : recommendations.length > 0 ? (
                <PlaylistSection
                  title="Songs You Might Like"
                  subtitle="A personal mix shaped by your listening"
                  songs={recommendations}
                  onPlay={setCurrentSong}
                  limit={40}
                />
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-300">
                  Keep playing and liking music. Your personal mix will appear here when your taste pattern is strong enough.
                </div>
              )}
              {isRecommendationsLoading && (
                <div className="h-24 flex items-center justify-center mt-8">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}


          {view !== 'home' && view !== 'recommended' && view !== 'search' && (
            <PlaylistSection
              title={title}
              subtitle={subtitle}
              songs={filteredSongs}
              onPlay={setCurrentSong}
            />
          )}

          {!isLoading && !isRecommendationsLoading && view !== 'home' && filteredSongs.length === 0 && (
            <div className="text-center text-zinc-500 mt-20">
              <p>No songs found.</p>
            </div>
          )}
        </main>
        
        
         
        <button onClick={scrollToTop} className={`absolute bottom-24 right-5 md:right-8 p-3 bg-emerald-500 text-black rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 z-40 ${showTopBtn ? 'opacity-100' : 'opacity-0'}`}>
          <ArrowUp size={24} />
        </button>

        {currentSong && (
          <div className="z-[105]">
            <MusicPlayer />
            <FullScreenPlayer />
          </div>
        )}
        <MusicBot />

        {/* ADDITIVE: YouTube Music Style Bottom Navigation (Mobile) */}
        <div className="fixed bottom-0 left-0 w-full bg-black/95 backdrop-blur-xl border-t border-white/10 flex justify-around items-center p-2 z-[70] pb-safe">
            <button 
                onClick={() => setView('home')} 
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'home' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={view === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span className="text-[10px] font-medium">Home</span>
            </button>

            <button 
                onClick={() => setView('vibe_ai')} 
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'vibe_ai' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                <Sparkles size={22} fill={view === 'vibe_ai' ? 'currentColor' : 'none'} />
                <span className="text-[10px] font-medium">Vibe AI</span>
            </button>

            <button 
                onClick={() => setView('search')} 
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${view === 'search' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <span className="text-[10px] font-medium">Search</span>
            </button>
        </div>

      </div>

{/* 4. Search Tab Overlay (Properly nested inside the main container) */}
{view === 'search' && (
  <div className="fixed inset-0 z-[100] bg-black">
    <SearchTab />
  </div>
)}
</div>
);
};

const PlaylistSection = ({ title, subtitle, songs, onPlay, limit = 40 }) => (
  <section>
    <div className="mb-3">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      {songs.slice(0, limit).map((song, index) => (
        <SongRow key={`${song.id || song.msg_id}-${index}`} song={song} index={index} onPlay={onPlay} />
      ))}
    </div>
  </section>
);

const PlaylistCard = ({ playlist, onClick }) => {
  const cover = playlist.cover || playlist.songs?.find((song) => song.album_art)?.album_art || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=80';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg border border-white/10 bg-zinc-950 text-left min-h-[18rem] p-4 transition-all hover:-translate-y-1 hover:border-emerald-400/40"
    >
      <img
        src={cover}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-105"
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${playlist.accent || 'from-black via-black/55 to-black/10'}`} />
      <div className="relative z-10 flex h-full min-h-[15rem] flex-col justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-black">
          <Disc3 size={21} />
        </span>
        <span>
          <span className="block text-xl font-bold leading-tight text-white">{playlist.title}</span>
          <span className="mt-2 block text-sm leading-relaxed text-zinc-300 line-clamp-3">{playlist.subtitle}</span>
        </span>
      </div>
    </button>
  );
};

const SongRow = ({ song, index, onPlay }) => (
  <button
    onClick={() => onPlay(song)}
    className="w-full flex items-center gap-4 rounded-lg p-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-left transition-colors min-w-0"
  >
    <span className="w-7 text-xs text-zinc-600 font-mono shrink-0">{index + 1}</span>
    <img src={song.album_art || getCoverFallback(song.title)} alt="" className="w-14 h-14 rounded object-cover bg-zinc-800 shrink-0" />
    <span className="min-w-0 flex-1">
      <span className="block text-white font-medium truncate">{song.title}</span>
      <span className="block text-sm text-zinc-500 truncate">{song.artist}</span>
    </span>
    <span className="hidden sm:inline-flex items-center gap-2 text-xs text-zinc-600 shrink-0">
      <Music2 size={13} />
      {song.language || song.mood || 'Music'}
    </span>
  </button>
);

const buildHomeSections = (songs) => {
  const hindi = songs.filter((song) => song.language === 'Hindi');
  const bengali = songs.filter((song) => song.language === 'Bengali');
  const all = songs.filter((song) => song.language === 'Hindi' || song.language === 'Bengali');
  const byArtist = (name) => all.filter((song) => `${song.artist || ''}`.toLowerCase().includes(name));
  const byMood = (items, ...words) => items.filter((song) => {
    const haystack = `${song.title || ''} ${song.artist || ''} ${song.genre || ''} ${song.mood || ''} ${(song.moods || []).join(' ')}`.toLowerCase();
    return words.some((word) => haystack.includes(word));
  });
  const unique = (items) => {
    const seen = new Set();
    return items.filter((song) => {
      const key = `${song.title}|${song.artist}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const coverFrom = (items, offset = 0) => unique(items).filter((song) => song.album_art)[offset]?.album_art;
  const daily = buildDailyPlaylist(songs, unique, byMood);

  return [
    daily,
    {
      title: 'Kishore Royale',
      subtitle: 'Hindi and Bengali gems led by that unmistakable golden voice.',
      search: 'Kishore Kumar',
      language: 'all',
      songs: unique([...byArtist('kishore kumar'), ...hindi]).slice(0, 30),
      cover: coverFrom(byArtist('kishore kumar'), 0) || coverFrom(hindi, 3),
      accent: 'from-black via-emerald-950/60 to-black/10',
    },
    {
      title: 'Velvet 80s-90s',
      subtitle: 'Old love songs, soft hooks, and late-night filmi warmth.',
      mood: 'Romantic',
      language: 'Hindi',
      songs: unique([...byMood(hindi, 'romantic', 'love', 'soulful'), ...hindi]).slice(0, 30),
      cover: coverFrom(byMood(hindi, 'romantic', 'love', 'soulful'), 1) || coverFrom(hindi, 8),
      accent: 'from-black via-rose-950/60 to-black/10',
    },
    {
      title: 'Bengal Gold',
      subtitle: 'A refined Bengali shelf with classic voices and lingering melody.',
      language: 'Bengali',
      songs: unique(bengali.length ? bengali : songs).slice(0, 30),
      cover: coverFrom(bengali, 2) || coverFrom(songs, 12),
      accent: 'from-black via-cyan-950/60 to-black/10',
    },
  ].filter((section) => section?.songs?.length > 0);
};

const dailyPlaylists = [
  {
    title: 'Sunday Sukun',
    subtitle: 'Slow, calm, and easy songs for an unhurried listen.',
    mood: 'Chill',
    words: ['chill', 'calm', 'soft', 'peaceful', 'melodic'],
    accent: 'from-black via-sky-950/60 to-black/10',
  },
  {
    title: 'Monday Special',
    subtitle: 'A polished start with classics that settle in quickly.',
    mood: 'all',
    words: ['classic', 'bollywood', 'melodic', 'retro'],
    accent: 'from-black via-amber-950/60 to-black/10',
  },
  {
    title: 'Tuesday Spark',
    subtitle: 'Bright, upbeat picks to keep the day moving.',
    mood: 'Happy',
    words: ['happy', 'dance', 'upbeat', 'pop', 'energetic'],
    accent: 'from-black via-lime-950/60 to-black/10',
  },
  {
    title: 'Wednesday Retro',
    subtitle: 'Midweek nostalgia with voices that never feel old.',
    mood: 'all',
    words: ['retro', 'classic', 'old', 'bollywood', 'filmi'],
    accent: 'from-black via-violet-950/60 to-black/10',
  },
  {
    title: 'Thursday Soul',
    subtitle: 'Deep-feel melodies with room for lyrics, voice, and memory.',
    mood: 'Soulful',
    words: ['soulful', 'ghazal', 'sad', 'melodic', 'classical'],
    accent: 'from-black via-indigo-950/60 to-black/10',
  },
  {
    title: 'Friday Romance',
    subtitle: 'Romantic songs from every corner of the catalogue.',
    mood: 'Romantic',
    words: ['romantic', 'love', 'duet', 'soft', 'soulful'],
    accent: 'from-black via-pink-950/60 to-black/10',
  },
  {
    title: 'Saturday Rush',
    subtitle: 'Weekend energy with lively hooks and brighter grooves.',
    mood: 'Happy',
    words: ['dance', 'happy', 'party', 'pop', 'upbeat'],
    accent: 'from-black via-orange-950/60 to-black/10',
  },
];

const buildDailyPlaylist = (songs, unique, byMood) => {
  const config = dailyPlaylists[new Date().getDay()];
  const matching = byMood(songs, ...config.words);
  const desiSongs = songs.filter((song) => song.language === 'Hindi' || song.language === 'Bengali');
  const englishSongs = songs.filter((song) => song.language === 'English');
  const matchingDesi = byMood(desiSongs, ...config.words);
  const matchingEnglish = byMood(englishSongs, ...config.words).slice(0, 5);
  const pool = limitEnglishSongs(unique([...matchingDesi, ...matchingEnglish, ...matching, ...desiSongs]), 5);
  const shuffled = shuffleSongs(pool, config.title).slice(0, 30);

  return {
    ...config,
    daily: true,
    language: 'all',
    genre: 'all',
    search: '',
    shuffle: true,
    songs: shuffled,
    cover: shuffled.find((song) => song.album_art)?.album_art,
  };
};

const uniqueSongs = (items) => {
  const seen = new Set();
  return (items || []).filter((song) => {
    const key = `${song?.id || song?.msg_id || ''}|${song?.title || ''}|${song?.artist || ''}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const limitEnglishSongs = (items, maxEnglish) => {
  let englishCount = 0;
  return (items || []).filter((song) => {
    if (song?.language !== 'English') return true;
    if (englishCount >= maxEnglish) return false;
    englishCount += 1;
    return true;
  });
};

const shuffleSongs = (items, seedText) => {
  const seed = String(seedText || '')
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return [...(items || [])].sort((a, b) => {
    const aKey = `${a.title || ''}${a.artist || ''}${seed}`;
    const bKey = `${b.title || ''}${b.artist || ''}${seed}`;
    return hashString(aKey) - hashString(bKey);
  });
};

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

export default App;
