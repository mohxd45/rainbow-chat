"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  duration?: number;
}

export function AudioPlayer({ src, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  // Sync duration if it changes or gets loaded
  useEffect(() => {
    if (duration) {
      setTotalDuration(duration);
    }
  }, [duration]);

  // Reset player when src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [src]);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setTotalDuration(audioRef.current.duration);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleScrub = (value: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-inner max-w-full w-64">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-200 transition hover:scale-105 hover:bg-cyan-300/30 active:scale-95"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 fill-cyan-200 text-cyan-200" />
        ) : (
          <Play className="h-5 w-5 fill-cyan-200 text-cyan-200 translate-x-[1px]" />
        )}
      </button>

      {/* Seekbar and Timeline */}
      <div className="flex flex-1 flex-col justify-center gap-1.5 min-w-0">
        <input
          type="range"
          min={0}
          max={totalDuration || 100}
          value={currentTime}
          onChange={(e) => handleScrub(parseFloat(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-cyan-300 outline-none transition focus:bg-white/20"
          style={{
            background: `linear-gradient(to right, rgb(103 232 249) 0%, rgb(103 232 249) ${
              totalDuration ? (currentTime / totalDuration) * 100 : 0
            }%, rgba(255, 255, 255, 0.1) ${
              totalDuration ? (currentTime / totalDuration) * 100 : 0
            }%, rgba(255, 255, 255, 0.1) 100%)`,
          }}
        />

        <div className="flex items-center justify-between text-[10px] font-semibold text-white/40">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
