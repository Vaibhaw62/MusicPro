import React, { memo, useMemo } from "react";

function VoiceVisualizer({ active = false }) {

  const bars = useMemo(
    () => Array.from({ length: 10 }),
    []
  );

  return (

    <div
      className="
        flex
        items-end
        justify-center
        gap-1
        h-8
        py-1
      "
    >

      {bars.map((_, index) => (

        <div
          key={index}
          className={`
            rounded-full
            transition-all
            duration-300
            w-[4px]
            ${
              active
                ? "bg-red-400 animate-pulse"
                : "bg-zinc-600"
            }
          `}
          style={{
            height: active
              ? `${10 + ((index % 5) * 6)}px`
              : "8px",

            animationDelay: `${index * 120}ms`
          }}
        />

      ))}

    </div>

  );

}

export default memo(VoiceVisualizer);