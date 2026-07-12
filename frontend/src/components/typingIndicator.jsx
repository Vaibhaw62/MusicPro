import React, { memo } from "react";

function TypingIndicator() {

  return (

    <div className="flex justify-start">

      <div
        className="
          bg-zinc-800/90
          backdrop-blur-xl
          border
          border-white/5
          rounded-2xl
          px-4
          py-3
          shadow-xl
          inline-flex
          items-center
          gap-2
        "
      >

        <span className="text-xs text-zinc-400 mr-1">
          Vibe AI
        </span>

        <div className="flex gap-1">

          <span
            className="
              w-2
              h-2
              rounded-full
              bg-cyan-400
              animate-bounce
            "
          />

          <span
            className="
              w-2
              h-2
              rounded-full
              bg-cyan-400
              animate-bounce
              [animation-delay:150ms]
            "
          />

          <span
            className="
              w-2
              h-2
              rounded-full
              bg-cyan-400
              animate-bounce
              [animation-delay:300ms]
            "
          />

        </div>

      </div>

    </div>

  );

}

export default memo(TypingIndicator);