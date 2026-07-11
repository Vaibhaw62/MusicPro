import React from 'react';
import { AlertCircle, Clock3, Heart, Play } from 'lucide-react';
import useMusicStore from '../musicStore';

const SongCard = ({ song }) => {
  const { setCurrentSong, currentSong, likedSongs, toggleLike } = useMusicStore();
  if (!song) return null;

  const isActive = String(currentSong?.id) === String(song.id);
  const isLiked = likedSongs.some((item) => String(item.id) === String(song.id));

  return (
    <article
      className={`relative group p-3 md:p-4 rounded-lg cursor-pointer transition-all duration-300 border ${
        isActive
          ? 'bg-white/10 border-emerald-500/60'
          : 'bg-white/[0.03] border-white/5 hover:bg-white/8 hover:border-white/10'
      }`}
    >
      <button
        type="button"
        onClick={() => song.is_playable && setCurrentSong(song)}
        className="block w-full text-left"
      >
        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg shadow-2xl bg-zinc-800">
          <img
            src={song.album_art || 'https://placehold.co/300'}
            alt={song.title || 'Unknown Song'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = 'https://placehold.co/300?text=No+Cover';
            }}
          />

          <div className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          >
            <span className="bg-emerald-500 text-black p-4 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-110">
              {song.is_playable ? <Play fill="currentColor" size={24} /> : <AlertCircle size={24} />}
            </span>
          </div>
        </div>

        <div className="px-1 min-h-[8.75rem]">
          <h3 className={`font-bold text-base md:text-lg transition-colors line-clamp-2 ${
            isActive ? 'text-emerald-500' : 'text-white group-hover:text-emerald-400'
          }`}
          >
            {song.title || 'Unknown Title'}
          </h3>
          <p className="text-sm text-zinc-400 truncate mt-1">{song.artist || 'Unknown Artist'}</p>

          <p className="text-xs text-zinc-500 mt-3 leading-relaxed line-clamp-3 min-h-[3.75rem]">
            {song.description || `${song.genre || 'Music'} track shaped for ${song.mood || 'your mood'}.`}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
            <span className="truncate">{song.language || 'Unknown'} • {song.mood || song.genre || 'Music'}</span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock3 size={12} />
              {song.duration || formatDuration(song.duration_seconds)}
            </span>
          </div>
        </div>
      </button>

      <button
        type="button"
        aria-label={isLiked ? 'Remove from liked songs' : 'Add to liked songs'}
        onClick={(event) => {
          event.stopPropagation();
          toggleLike(song);
        }}
        className={`absolute top-5 right-5 p-2 rounded-full bg-black/60 backdrop-blur-md transition-all ${
          isLiked ? 'text-emerald-400 opacity-100' : 'text-white/80 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
};

const formatDuration = (seconds) => {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return '0:00';
  const minutes = Math.floor(total / 60);
  const rest = Math.floor(total % 60);
  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
};

export default SongCard;
