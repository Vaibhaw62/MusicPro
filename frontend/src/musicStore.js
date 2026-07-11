import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { API_URL, fetchRecommendations as fetchRecommendationsApi, fetchSongs as fetchSongsApi } from './api';

const initialState = {
  songs: [],
  recommendations: [],
  recentlyPlayed: [],
  playEvents: [],
  recentSearches: [],
  currentSong: null,
  isPlaying: false,
  isRepeating: false,
  isLoading: false,
  isRecommendationsLoading: false,
  likedSongs: [],
  view: 'home',
  currentTime: 0,
  seekRequest: null,
  isPlayerOpen: false,
  skip: 0,
  hasMore: true,
  searchQuery: '',
  selectedGenre: 'all',
  selectedMood: 'all',
  selectedDuration: 'all',
  selectedLanguage: 'all',
};

const songKey = (song) => String(song?.id || song?.msg_id || '');
const songSignature = (song) => `${song?.title || ''}|${song?.artist || ''}`
  .toLowerCase()
  .replace(/[^a-z0-9|]/g, '');

const looksRandom = (token) => {
  const clean = String(token || '').replace(/[^A-Za-z0-9]/g, '');
  if (clean.length < 4 || clean.length > 16) return false;
  if (/^[A-Z][a-z]+$/.test(clean)) return false;
  if (/\d/.test(clean) && /[A-Za-z]/.test(clean)) return true;
  const vowels = (clean.match(/[aeiou]/gi) || []).length;
  const consonants = (clean.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
  return /[a-z]/.test(clean) && /[A-Z]/.test(clean) && vowels <= 1 && consonants >= 3;
};

const cleanDisplayTitle = (title) => {
  const words = String(title || 'Unknown Title')
    .replace(/\.(mp3|m4a|flac|wav)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(stereo|remastered?|full song|video song|lyrics?)\b/gi, '')
    .trim()
    .split(/\s+/);

  while (words.length > 1) {
    const tail4 = words.slice(-4).join('');
    const tail3 = words.slice(-3).join('');
    const tail2 = words.slice(-2).join('');
    if (looksRandom(tail4) || looksRandom(tail3) || looksRandom(tail2) || looksRandom(words[words.length - 1])) {
      words.pop();
      continue;
    }
    break;
  }

  return words.join(' ').replace(/[\s,.-]+(?:pt|part)\.?\s*$/i, '').replace(/\s+/g, ' ').trim() || 'Unknown Title';
};

const uniqueBySong = (songs) => {
  const seenIds = new Set();
  const seenSignatures = new Set();
  return songs.filter((song) => {
    const key = songKey(song);
    const signature = songSignature(song);
    if (!key || seenIds.has(key) || seenSignatures.has(signature)) return false;
    seenIds.add(key);
    seenSignatures.add(signature);
    return true;
  });
};

const sanitizeSong = (song) => {
  // Extract any valid existing image field sent from the backend collection pipeline
  const fallbackArt = song?.album_art || song?.cover_url || song?.thumbnail_url || song?.cover || 'https://placehold.co/300';
  
  return {
    ...song,
    id: songKey(song),
    title: cleanDisplayTitle(song?.title),
    artist: song?.artist || 'Unknown Artist',
    description: song?.description || '',
    album_art: fallbackArt,
  };
};

const useMusicStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      user: null,
      volume: 0.7,
      isMuted: false,
      prevVolume: 0.7,

      login: async (username, password) => {
        const res = await axios.post(`${API_URL}/auth/login`, { username, password });
        const { access_token, state } = res.data;

        set({ ...initialState, user: { username, access_token } });

        if (state) {
          set({
            likedSongs: uniqueBySong((state.liked_songs || []).map(sanitizeSong)),
            recentlyPlayed: uniqueBySong((state.recently_played || []).map(sanitizeSong)),
            playEvents: state.play_events || [],
            volume: state.volume ?? 0.7,
            selectedLanguage: state.selected_language || 'all',
          });
        }

        get().fetchSongs();
        get().fetchRecommendations();
        return { success: true };
      },

      logout: () => {
        set({ ...initialState, user: null });
        localStorage.removeItem('music-pro-storage-v18');
        localStorage.removeItem('music-pro-storage-v17');
        localStorage.removeItem('music-pro-storage-v16');
      },

      syncToCloud: async () => {
        const {
          user,
          likedSongs,
          currentSong,
          recentlyPlayed,
          playEvents,
          volume,
          selectedLanguage,
        } = get();
        if (!user?.access_token) return;

        try {
          await axios.post(
            `${API_URL}/user/sync`,
            {
              liked_songs: likedSongs,
              current_song: currentSong,
              recently_played: recentlyPlayed.slice(0, 40),
              play_events: playEvents.slice(-200),
              volume,
              selected_language: selectedLanguage,
            },
            { headers: { Authorization: `Bearer ${user.access_token}` } },
          );
        } catch (error) {
          console.error('Cloud sync failed:', error);
        }
      },

      setView: (view) => set({ view }),
      setSongs: (incomingSongs) => {
        set((state) => {
          const sanitized = incomingSongs.map(sanitizeSong);
          // ELITE FIX: Prepend the AI recommendations to the top of the library.
          // This keeps the 50+ background songs alive, so the Home Page images never turn into placeholders!
          const merged = uniqueBySong([...sanitized, ...state.songs]);
          return {
            songs: merged,
            view: 'home', 
          };
        });
      },
      setCurrentTime: (time) => set({ currentTime: time }),
      seekTo: (time) => set({ currentTime: time, seekRequest: { time, issuedAt: Date.now() } }),
      clearSeekRequest: () => set({ seekRequest: null }),
      setPlayerOpen: (isOpen) => set({ isPlayerOpen: isOpen }),

      setSearchQuery: (query, options = {}) => {
        set((state) => {
          // If query isn't empty, add it to the top of the list and keep only the last 10 unique searches
          const updatedSearches = query.trim() 
            ? [query.trim(), ...state.recentSearches.filter(s => s !== query.trim())].slice(0, 10)
            : state.recentSearches;
            
          return { 
            searchQuery: query, 
            recentSearches: updatedSearches, 
            skip: 0, 
            songs: [], 
            hasMore: true, 
            view: options.keepView ? state.view : 'home' 
          };
        });
        get().fetchSongs();
      },
      setGenre: (genre) => {
        set({ selectedGenre: genre, skip: 0, songs: [], hasMore: true });
        get().fetchSongs();
      },
      setMood: (mood) => {
        set({ selectedMood: mood, skip: 0, songs: [], hasMore: true });
        get().fetchSongs();
      },
      setDuration: (duration) => {
        set({ selectedDuration: duration, skip: 0, songs: [], hasMore: true });
        get().fetchSongs();
      },
      setLanguage: (language) => {
        set({ selectedLanguage: language, skip: 0, songs: [], hasMore: true });
        get().fetchSongs();
        get().syncToCloud();
      },

      setVolume: (vol) => {
        if (vol === 0) set({ volume: 0, isMuted: true });
        else set({ volume: vol, isMuted: false, prevVolume: vol });
        get().syncToCloud();
      },

      toggleMute: () => {
        const { isMuted, volume, prevVolume } = get();
        if (isMuted) set({ isMuted: false, volume: prevVolume || 0.7 });
        else set({ isMuted: true, prevVolume: volume, volume: 0 });
        get().syncToCloud();
      },

      fetchSongs: async (isLoadMore = false) => {
        const {
          searchQuery,
          selectedGenre,
          selectedMood,
          selectedDuration,
          selectedLanguage,
          skip,
          hasMore,
          isLoading,
        } = get();

        if (isLoading || (isLoadMore && !hasMore)) return;
        set({ isLoading: true });

        try {
          const limit = 50;
          const results = await fetchSongsApi(
            searchQuery,
            limit,
            selectedGenre,
            selectedMood,
            selectedDuration,
            isLoadMore ? skip : 0,
            selectedLanguage,
          );

          const incoming = (results || []).map(sanitizeSong);
          set((state) => {
            const merged = uniqueBySong([...(isLoadMore ? state.songs : []), ...incoming]);
            return {
              songs: merged,
              skip: isLoadMore ? state.skip + limit : limit,
              hasMore: incoming.length === limit,
              isLoading: false,
            };
          });
        } catch (error) {
          console.error('Store fetch error:', error);
          set({ isLoading: false });
        }
      },

      fetchRecommendations: async () => {
        const { likedSongs, recentlyPlayed, playEvents } = get();
        if (!likedSongs.length && !recentlyPlayed.length && !playEvents.length) {
          set({ recommendations: [], isRecommendationsLoading: false });
          return;
        }
        set({ isRecommendationsLoading: true });
        const results = await fetchRecommendationsApi(40);
        set({
          recommendations: uniqueBySong((results || []).map(sanitizeSong)),
          isRecommendationsLoading: false,
        });
      },

      setCurrentSong: (rawSong) => {
        console.log("========== STORE ==========");
        console.log("setCurrentSong called");
        console.log(rawSong);
        const song = sanitizeSong(rawSong);
        const previous = get().currentSong;
        const playedSeconds = get().currentTime || 0;
        const completion = previous?.duration_seconds ? Math.min(1, playedSeconds / previous.duration_seconds) : 0;
        const playEvent = previous
          ? { song: previous, played_seconds: playedSeconds, completion, at: new Date().toISOString() }
          : null;

        set((state) => ({
          currentSong: song,
          isPlaying: true,
          currentTime: 0,
          recentlyPlayed: uniqueBySong([song, ...state.recentlyPlayed]).slice(0, 40),
          playEvents: playEvent ? [...state.playEvents.slice(-199), playEvent] : state.playEvents,
        }));

        get().syncToCloud();
        get().fetchRecommendations();


      },

      pauseSong: () => {
        set({ isPlaying: false });
        get().syncToCloud();
      },
      resumeSong: () => set({ isPlaying: true }),
      toggleRepeat: () => set((state) => ({ isRepeating: !state.isRepeating })),

      // 1. ADDITIVE: Upgraded playNext with Infinite ML Radio
      playNext: async () => {
        const { currentSong, songs, likedSongs, recentlyPlayed, recommendations, view } = get();
        const activeList =
          view === 'liked' ? likedSongs
            : view === 'recent' ? recentlyPlayed
              : view === 'recommended' ? recommendations
                : songs;
        
        const index = activeList.findIndex((song) => songKey(song) === songKey(currentSong));

        // If there is a next song in the current list, play it
        if (index !== -1 && index < activeList.length - 1) {
          get().setCurrentSong(activeList[index + 1]);
        } 
        // IF WE REACH THE END OF THE LIST -> Trigger Infinite ML Radio
        else if (currentSong) {
          try {
            console.log("Playlist ended. Fetching similar songs via Vibe AI ML...");
            
            // Strictly enforce the same language in the semantic query
            const langFilter = currentSong.language && currentSong.language !== 'all' 
              ? ` in ${currentSong.language} language` 
              : '';
              
            const aiQuery = `Songs similar to ${currentSong.title} by ${currentSong.artist}${langFilter}`;
            
            const res = await axios.post(`${API_URL}/bot/semantic-search`, { 
              query: aiQuery, 
              limit: 15 // Fetch plenty of continuous songs
            });

            if (res.data?.results?.length > 0) {
               // Sanitize and filter out the song we just played
               const newSongs = res.data.results
                  .map(sanitizeSong)
                  .filter(s => songKey(s) !== songKey(currentSong));
               
               if (newSongs.length > 0) {
                   // Append the new AI suggestions to the global songs list and play the first one
                   set({ songs: [...songs, ...newSongs] });
                   get().setCurrentSong(newSongs[0]);
               }
            }
          } catch (err) {
             console.error("Infinite ML Radio failed:", err);
          }
        }
      },

      playPrev: () => {
        const { currentSong, songs, likedSongs, recentlyPlayed, recommendations, view } = get();
        const activeList =
          view === 'liked' ? likedSongs
            : view === 'recent' ? recentlyPlayed
              : view === 'recommended' ? recommendations
                : songs;
        const index = activeList.findIndex((song) => songKey(song) === songKey(currentSong));
        if (index > 0) get().setCurrentSong(activeList[index - 1]);
      },

      toggleLike: (song) => {
        const cleanSong = sanitizeSong(song);
        const isLiked = get().likedSongs.some((item) => songKey(item) === songKey(cleanSong));
        set((state) => ({
          likedSongs: isLiked
            ? state.likedSongs.filter((item) => songKey(item) !== songKey(cleanSong))
            : uniqueBySong([cleanSong, ...state.likedSongs]),
        }));
        get().syncToCloud();
        get().fetchRecommendations();
      },

      resetFilters: () => {
        set({
          songs: [],
          skip: 0,
          hasMore: true,
          searchQuery: '',
          selectedGenre: 'all',
          selectedMood: 'all',
          selectedDuration: 'all',
          selectedLanguage: 'all',
          view: 'home',
        });
        get().fetchSongs();
        get().syncToCloud();
      },
    }),
    {
      name: 'music-pro-storage-v18',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        likedSongs: state.likedSongs,
        recentlyPlayed: state.recentlyPlayed,
        playEvents: state.playEvents,
        volume: state.volume,
        selectedLanguage: state.selectedLanguage,
        recentSearches: state.recentSearches,
      }),
    },
  ),
);

export default useMusicStore;
