import React, { useMemo } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Heart, Info, ListMusic, Volume2, VolumeX } from 'lucide-react';
import useMusicStore from '../musicStore';

const FullScreenPlayer = () => {
  const {
    currentSong,
    isPlaying,
    pauseSong,
    resumeSong,
    playNext,
    playPrev,
    toggleLike,
    likedSongs,
    isPlayerOpen,
    setPlayerOpen,
    currentTime,
    seekTo,
    volume,
    setVolume,
    toggleMute,
    isMuted,
    songs,
    likedSongs: collection,
    recentlyPlayed,
    recommendations,
    view,
    setCurrentSong,
  } = useMusicStore();

  const isLiked = currentSong && likedSongs.some((song) => String(song.id) === String(currentSong.id));
  const duration = currentSong?.duration_seconds || 240;

  const queue = useMemo(() => {
    const activeList =
      view === 'liked' ? collection
        : view === 'recent' ? recentlyPlayed
          : view === 'recommended' ? recommendations
            : songs;
    const currentIndex = activeList.findIndex((song) => String(song.id) === String(currentSong?.id));
    const upcoming = currentIndex >= 0 ? activeList.slice(currentIndex + 1) : activeList;
    return upcoming.slice(0, 12);
  }, [collection, recentlyPlayed, recommendations, songs, view, currentSong]);

  if (!isPlayerOpen || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 md:ml-72 transition-all duration-300">
      <div className="absolute inset-0 bg-cover bg-center opacity-25 blur-[100px] scale-125 transition-all duration-1000" style={{ backgroundImage: `url(${currentSong.album_art || 'https://placehold.co/300'})` }} />
      <div className="absolute inset-0 bg-black/65" />

      <div className="relative w-full max-w-6xl h-[85vh] bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <button onClick={() => setPlayerOpen(false)} className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-zinc-300 hover:text-white z-50 transition-all backdrop-blur-md">
          <X size={20} />
        </button>

        <div className="w-full md:w-1/2 p-7 md:p-12 flex flex-col justify-center relative border-r border-white/5">
          <div className="aspect-square w-full max-w-[320px] md:max-w-[380px] mx-auto rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
            <img
              src={currentSong.album_art || 'https://placehold.co/300'}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="mt-8 md:mt-10 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight line-clamp-2">{currentSong.title}</h1>
              <p className="text-lg md:text-xl text-zinc-400 font-light tracking-wide">{currentSong.artist}</p>
            </div>

            <div className="w-full max-w-md mx-auto flex items-center gap-3 text-xs text-zinc-400 font-mono">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <div className="relative flex-1 h-1.5 group cursor-pointer">
                {(() => {
                  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
                  return (
                    <>
                      <input
                        type="range"
                        min="0"
                        max={duration > 0 ? duration : 100}
                        value={currentTime}
                        onChange={(event) => seekTo(parseFloat(event.target.value))}
                        className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
                      />
                      <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-100" style={{ width: `${progress}%` }} />
                      </div>
                    </>
                  );
                })()}
              </div>
              <span className="w-10">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-center gap-6 md:gap-10">
              <button onClick={playPrev} className="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all"><SkipBack size={32} strokeWidth={1.5} /></button>
              <button onClick={isPlaying ? pauseSong : resumeSong} className="w-16 h-16 md:w-20 md:h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={playNext} className="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all"><SkipForward size={32} strokeWidth={1.5} /></button>
            </div>

            <div className="flex justify-between items-center px-4 md:px-8 mt-4">
              <button onClick={() => toggleLike(currentSong)} className={`p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all ${isLiked ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'}`}>
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>

              <div className="flex items-center gap-3 w-32 group">
                <button onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX size={18} className="text-zinc-400" /> : <Volume2 size={18} className="text-zinc-400 group-hover:text-white" />}
                </button>
                <div className="relative flex-1 h-1 bg-white/10 rounded-full cursor-pointer">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(event) => setVolume(parseFloat(event.target.value))}
                    className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
                  />
                  <div className="absolute h-full bg-zinc-500 rounded-full group-hover:bg-emerald-500 transition-colors" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                </div>
              </div>

              <button className="p-3 rounded-full bg-white/5 text-zinc-500">
                <Info size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col relative bg-black/25">
          <div className="p-8 pb-5 border-b border-white/5">
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-[0.2em] mb-3 opacity-90">
              <ListMusic size={15} /> Up Next
            </div>
            <p className="text-zinc-400 text-sm">
              Queue follows the current view: library, liked songs, recent plays, or recommendations.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-3">
            {queue.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-zinc-500 text-sm">
                No upcoming songs in this list.
              </div>
            ) : (
              queue.map((song, index) => (
                <button
                  key={`${song.id || song.msg_id}-${index}`}
                  onClick={() => setCurrentSong(song)}
                  className="w-full flex items-center gap-4 rounded-lg p-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-left transition-colors"
                >
                  <span className="w-6 text-xs text-zinc-600 font-mono">{index + 1}</span>
                  <img src={song.album_art || 'https://placehold.co/80'} alt="" className="w-12 h-12 rounded object-cover bg-zinc-800" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-white font-medium truncate">{song.title}</span>
                    <span className="block text-sm text-zinc-500 truncate">{song.artist}</span>
                  </span>
                  <span className="text-xs text-zinc-600 shrink-0">{song.duration || formatTime(song.duration_seconds)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatTime = (time) => {
  const totalSeconds = parseFloat(time);
  if (Number.isNaN(totalSeconds) || totalSeconds <= 0) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default FullScreenPlayer;
