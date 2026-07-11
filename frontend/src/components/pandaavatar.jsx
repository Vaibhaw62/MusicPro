import React, { memo } from "react";

const BOT_STATES = {

  idle: {
    ring: "shadow-cyan-500/30",
    animation: "animate-[var(--animate-float)]",
    status: "Ready to help"
  },

  thinking: {
    ring: "shadow-yellow-400/40",
    animation: "animate-[var(--animate-thinking)]",
    status: "Thinking..."
  },

  listening: {
    ring: "shadow-red-500/50",
    animation: "animate-pulse",
    status: "Listening..."
  },

  speaking: {
    ring: "shadow-cyan-400/50",
    animation: "animate-[var(--animate-glow)]",
    status: "Speaking..."
  },

  happy: {
    ring: "shadow-emerald-400/50",
    animation: "animate-[var(--animate-wiggle)]",
    status: "Glad to help!"
  },

  excited: {
    ring: "shadow-pink-500/50",
    animation: "animate-[var(--animate-glow)]",
    status: "Excited!"
  },

  loved: {
    ring: "shadow-pink-400/60",
    animation: "animate-[var(--animate-float)]",
    status: "In Love 💖"
  },

  rainy: {
    ring: "shadow-blue-500/60",
    animation: "animate-[var(--animate-float)]",
    status: "Rainy Vibes 🌧"
  },

  singing: {
    ring: "shadow-cyan-400/60",
    animation: "animate-[var(--animate-wiggle)]",
    status: "Singing 🎵"
  },

  melancholy: {
    ring: "shadow-purple-500/60",
    animation: "animate-[var(--animate-float)]",
    status: "Feeling Emotional 😢"
  },

  workout: {
    ring: "shadow-orange-500/60",
    animation: "animate-[var(--animate-glow)]",
    status: "Workout Mode 🔥"
  },

  learning: {
    ring: "shadow-emerald-500/60",
    animation: "animate-[var(--animate-thinking)]",
    status: "Learning Your Taste 🧠"
  },

  sleepy: {
    ring: "shadow-zinc-500/20",
    animation: "opacity-80",
    status: "Sleeping 😴"
  }

};


function PandaAvatar({
  state = "idle",
  size = 72,
  showStatus = false
}) {

  const current =
    BOT_STATES[state] ||
    BOT_STATES.idle;

  return (

    <div className="flex flex-col items-center gap-2">

      <div
        className={`
          relative
          rounded-full
          overflow-hidden

          transition-all
          duration-500

          shadow-2xl

          ${current.ring}
          ${current.animation}
        `}
        style={{
          width: size,
          height: size
        }}
      >

        {/* =====================================
             OUTER AURA
        ===================================== */}

        <div
          className="
            absolute
            inset-0

            bg-cyan-400/10

            blur-2xl
            animate-pulse
          "
        />


        {/* =====================================
             LISTENING EFFECT
        ===================================== */}

        {state === "listening" && (

          <div
            className="
              absolute
              inset-0

              border-2
              border-red-400/50

              rounded-full
              animate-ping
            "
          />

        )}


        {/* =====================================
             THINKING EFFECT
        ===================================== */}

        {state === "thinking" && (

          <div
            className="
              absolute
              inset-0

              border
              border-yellow-300/30

              rounded-full
              animate-spin
            "
            style={{
              animationDuration: "6s"
            }}
          />

        )}


        {/* =====================================
             LOVE EFFECT
        ===================================== */}

        {state === "loved" && (

          <div
            className="
              absolute
              inset-0

              bg-pink-500/10

              rounded-full
              animate-pulse
            "
          />

        )}


        {/* =====================================
             RAIN EFFECT
        ===================================== */}

        {state === "rainy" && (

          <div
            className="
              absolute
              inset-0

              bg-blue-500/10

              rounded-full
              animate-pulse
            "
          />

        )}


        {/* =====================================
             WORKOUT EFFECT
        ===================================== */}

        {state === "workout" && (

          <div
            className="
              absolute
              inset-0

              border-2
              border-orange-400/40

              rounded-full
              animate-ping
            "
          />

        )}


        {/* =====================================
             LEARNING EFFECT
        ===================================== */}

        {state === "learning" && (

          <div
            className="
              absolute
              inset-0

              border
              border-emerald-400/30

              rounded-full
              animate-spin
            "
            style={{
              animationDuration: "4s"
            }}
          />

        )}


        {/* =====================================
             SLEEPY EFFECT
        ===================================== */}

        {state === "sleepy" && (

          <div
            className="
              absolute
              inset-0

              bg-black/20

              rounded-full
            "
          />

        )}


        {/* =====================================
             MAIN AVATAR
        ===================================== */}
      <img src="/avatar.png" alt="Vibe AI" />
        <img
          src="/bot/avatar.png"
          alt="Vibe AI Assistant"
          loading="lazy"
          draggable={false}
          className="
            relative
            z-10

            w-full
            h-full

            object-cover
            select-none
          "
        />

      </div>


      {/* =====================================
           STATUS TEXT
      ===================================== */}

      {showStatus && (

        <p
          className="
            text-xs
            text-zinc-400

            text-center

            transition-all
            duration-300
          "
        >
          {current.status}
        </p>

      )}

    </div>

  );

}


export default memo(PandaAvatar);