"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Flag, Trash2, X, Smile, CornerUpLeft } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Message } from "@/types";
import { AudioPlayer } from "./AudioPlayer";
import { db, doc, updateDoc } from "@/lib/firebase";

export function MessageBubble({ message, isMine, isAdmin, onReport, onDelete, onReact, onReply, onVote, onViewOnceBurn }: {
  message: Message;
  isMine: boolean;
  isAdmin: boolean;
  onReport: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onReply?: () => void;
  onVote?: (optionIndex: number) => void;
  onViewOnceBurn?: () => void;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const { appUser } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [revealed, setRevealed] = useState(false);
  const [viewCountdown, setViewCountdown] = useState<number | null>(null);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [heartCoords, setHeartCoords] = useState({ x: 0, y: 0 });

  const isViewed = useMemo(() => {
    return !!(appUser && message.viewedBy?.includes(appUser.uid));
  }, [message.viewedBy, appUser]);

  const isActivelyRevealed = useMemo(() => {
    return !!(message.viewOnce && !isViewed && (viewCountdown !== null || lightboxOpen));
  }, [message.viewOnce, isViewed, viewCountdown, lightboxOpen]);

  useEffect(() => {
    if (!isActivelyRevealed) return;

    const flagAndBan = async () => {
      if (!appUser || appUser.banned) return;
      
      console.warn("[MessageBubble] Screenshot/safety violation detected! Banning user:", appUser.uid);
      
      // 1. Burn the image immediately in UI
      onViewOnceBurn?.();
      setRevealed(false);
      setViewCountdown(null);
      setLightboxOpen(false);

      // 2. Set the banned field in DB (supports both real Firebase and local Mock DB)
      try {
        const userRef = doc(db, "users", appUser.uid);
        await updateDoc(userRef, { banned: true });
      } catch (err) {
        console.error("[MessageBubble] Failed to save ban status to DB:", err);
      }

      // 3. Force reload to lock the user out via BannedGuard
      window.location.reload();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      const code = e.code?.toLowerCase();
      
      // PrintScreen key
      if (key === "printscreen" || code === "printscreen") {
        e.preventDefault();
        flagAndBan();
        return;
      }

      // Win + Shift + S / Cmd + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (key === "s" || code === "keys")) {
        e.preventDefault();
        flagAndBan();
        return;
      }

      // Cmd + Shift + 3/4/5 (Mac screenshot)
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(key)) {
        e.preventDefault();
        flagAndBan();
        return;
      }

      // DevTools keys: F12, Ctrl+Shift+I / Cmd+Opt+I
      if (
        key === "f12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === "i" || key === "c" || key === "j")) ||
        ((e.ctrlKey || e.metaKey) && e.altKey && key === "i")
      ) {
        e.preventDefault();
        flagAndBan();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key?.toLowerCase() === "printscreen") {
        flagAndBan();
      }
    };

    const handleBlur = () => {
      console.warn("[MessageBubble] Window focus lost during View Once display. Triggering ban.");
      flagAndBan();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        console.warn("[MessageBubble] Tab switched/hidden during View Once display. Triggering ban.");
        flagAndBan();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", handleBlur, true);
    document.addEventListener("visibilitychange", handleVisibilityChange, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", handleBlur, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange, true);
    };
  }, [isActivelyRevealed, appUser, onViewOnceBurn]);

  useEffect(() => {
    if (isViewed && lightboxOpen) {
      setLightboxOpen(false);
    }
  }, [isViewed, lightboxOpen]);

  useEffect(() => {
    if (viewCountdown === null) return;
    if (viewCountdown <= 0) {
      setViewCountdown(null);
      onViewOnceBurn?.();
      return;
    }
    const t = setTimeout(() => {
      setViewCountdown(viewCountdown - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [viewCountdown, onViewOnceBurn]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (message.deleted) return;
    onReact("❤️");
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setHeartCoords({ x, y });
    setShowHeartAnim(true);
  };

  const expiresTime = useMemo(() => {
    if (!message.expiresAt) return null;
    if (message.expiresAt.toDate) return message.expiresAt.toDate().getTime();
    if (message.expiresAt.seconds) return message.expiresAt.seconds * 1000;
    return new Date(message.expiresAt).getTime();
  }, [message.expiresAt]);

  useEffect(() => {
    if (!expiresTime) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((expiresTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 250);

    return () => clearInterval(interval);
  }, [expiresTime]);

  if (timeLeft !== null && timeLeft <= 0) {
    return null;
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 12, scale: .98 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        className={`flex gap-3 ${isMine ? "justify-end" : "justify-start"}`}
      >
        {!isMine && <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl">{message.senderAvatar}</div>}
        
        <div 
          id={`msg-${message.id}`}
          onDoubleClick={handleDoubleClick}
          className={`max-w-[82%] relative rounded-3xl border px-4 py-3 sm:max-w-[68%] cursor-default select-text ${
            timeLeft !== null ? "pb-4.5 overflow-hidden" : ""
          } ${
            isMine ? "border-cyan-300/20 bg-cyan-300/15" : "border-white/10 bg-white/[.07]"
          }`}
        >
          {/* Floating Heart Pop-up Animation */}
          {showHeartAnim && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 0 }}
              animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1, 0], y: -45 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              onAnimationComplete={() => setShowHeartAnim(false)}
              className="absolute pointer-events-none text-red-500 text-4xl filter drop-shadow-[0_0_8px_rgba(239,68,68,0.7)] z-40"
              style={{ left: heartCoords.x - 20, top: heartCoords.y - 20 }}
            >
              ❤️
            </motion.div>
          )}

          {/* Threaded Reply Preview */}
          {message.replyTo && (
            <div 
              onClick={() => {
                const target = document.getElementById(`msg-${message.replyTo!.id}`);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "center" });
                  target.classList.add("neon-flash-highlight");
                  setTimeout(() => {
                    target.classList.remove("neon-flash-highlight");
                  }, 1800);
                }
              }}
              className="mb-2.5 rounded-2xl bg-white/5 border-l-2 border-cyan-400/50 px-3 py-1.5 text-xs text-white/70 hover:bg-[#22d3ee]/10 hover:text-white cursor-pointer transition duration-200"
            >
              <span className="font-bold text-cyan-300 block mb-0.5">{message.replyTo.senderName}</span>
              <span className="line-clamp-1 opacity-80 select-none">{message.replyTo.text}</span>
            </div>
          )}

          {/* Header */}
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/70">{message.senderName}</span>
              {timeLeft !== null && (
                <span className="inline-flex items-center gap-1 rounded bg-pink-500/20 px-1.5 py-0.5 text-[9px] font-bold text-pink-300 uppercase tracking-wider animate-pulse">
                  ⏱️ {timeLeft}s
                </span>
              )}
            </div>
            <span className="text-[11px] text-white/40">{formatTime(message.createdAt)}</span>
          </div>
          
          {/* Message Text */}
          {message.text && (
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/90">
              {message.deleted ? "This message was deleted by an admin." : message.text}
            </p>
          )}

          {/* Message Poll */}
          {message.poll && !message.deleted && (
            <div className="mt-2.5 rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3 min-w-[260px] sm:min-w-[320px]">
              <h4 className="text-sm font-bold text-cyan-200 leading-snug">{message.poll.question}</h4>
              <div className="space-y-2">
                {message.poll.options.map((option, idx) => {
                  const totalVotes = message.poll!.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
                  const optionVotes = option.votes?.length || 0;
                  const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                  const hasVoted = !!(appUser && option.votes?.includes(appUser.uid));

                  return (
                    <button
                      key={idx}
                      onClick={() => onVote?.(idx)}
                      className={`w-full text-left relative overflow-hidden rounded-xl border p-3 transition active:scale-98 ${
                        hasVoted
                          ? "border-pink-500/30 bg-pink-500/10 text-pink-100 font-bold"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white font-medium"
                      }`}
                    >
                      {/* Progress Bar background */}
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                          hasVoted ? "bg-pink-500/25" : "bg-cyan-500/15"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                      
                      {/* Label and Count */}
                      <div className="relative z-10 flex items-center justify-between text-xs">
                        <span className="truncate pr-4">{option.text}</span>
                        <span className="shrink-0 flex items-center gap-1.5 font-mono">
                          <span>{percentage}%</span>
                          <span className="opacity-55 text-[10px]">({optionVotes})</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                <span>
                  {message.poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0)} total votes
                </span>
                <span className="italic font-mono">Click to vote</span>
              </div>
            </div>
          )}

          {/* Message Image Attachment */}
          {message.imageUrl && !message.deleted && (
            message.viewOnce ? (
              isViewed ? (
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-pink-500/20 bg-pink-500/5 px-4 py-3 text-xs text-pink-300">
                  <span>🔥 View Once Photo (Expired)</span>
                </div>
              ) : viewCountdown !== null ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-pink-500/30 bg-black/20 shadow-inner relative group">
                  <img
                    src={message.imageUrl}
                    alt="Attachment"
                    className="max-h-60 max-w-full object-cover cursor-zoom-in select-none"
                    style={{ ["WebkitUserDrag" as any]: "none" }}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    onClick={() => setLightboxOpen(true)}
                  />
                  <div className="absolute top-2 right-2 rounded-full bg-pink-500 px-2.5 py-1 text-[10px] font-black text-white shadow-lg flex items-center gap-1.5 animate-pulse">
                    <span>🔥</span>
                    <span>{viewCountdown}s</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setRevealed(true);
                    setViewCountdown(5);
                  }}
                  className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-950/20 px-4 py-6 text-center transition hover:bg-cyan-950/30 active:scale-[0.99]"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-cyan-400/10 text-cyan-300">
                    <span className="text-xl">🔥</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-cyan-200">View Once Media</p>
                    <p className="text-[10px] text-white/50">Click to reveal (5-second limit)</p>
                  </div>
                </button>
              )
            ) : (
              <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-inner">
                <img
                  src={message.imageUrl}
                  alt="Attachment"
                  className="max-h-60 max-w-full cursor-zoom-in object-cover transition duration-300 hover:opacity-90 active:scale-98"
                  onClick={() => setLightboxOpen(true)}
                />
              </div>
            )
          )}

          {/* Message Audio Attachment */}
          {message.audioUrl && !message.deleted && (
            <div className="mt-2">
              <AudioPlayer src={message.audioUrl} duration={message.audioDuration} />
            </div>
          )}

          {/* Reaction Badges */}
          {!message.deleted && message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(message.reactions).map(([emoji, uids]) => {
                if (!uids || uids.length === 0) return null;
                const reactedByMe = !!(appUser && uids.includes(appUser.uid));
                return (
                  <button
                    key={emoji}
                    onClick={() => onReact(emoji)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition border ${
                      reactedByMe 
                        ? "border-pink-300/30 bg-pink-300/15 text-pink-200" 
                        : "border-white/5 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-[9px] opacity-75">{uids.length}</span>
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Action Footer */}
          {!message.deleted && (
            <div className="relative mt-2 flex justify-end gap-2">
              {/* Floating Emoji Picker Popup */}
              {showPicker && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`absolute z-35 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/85 p-1.5 shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md -top-12 ${
                    isMine ? "right-0" : "left-0"
                  }`}
                >
                  {["👍", "❤️", "😂", "😮", "😢", "🔥"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onReact(emoji);
                        setShowPicker(false);
                      }}
                      className="text-base hover:scale-125 transition duration-150 active:scale-95 px-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}

              <button
                onClick={onReply}
                className="rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-cyan-200"
                title="Reply"
              >
                <CornerUpLeft className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setShowPicker(!showPicker)}
                className={`rounded-full p-1 transition ${showPicker ? "bg-white/10 text-cyan-200" : "text-white/40 hover:bg-white/10 hover:text-cyan-200"}`}
                title="React"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>

              <button 
                onClick={onReport} 
                className="rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-yellow-200" 
                title="Report"
              >
                <Flag className="h-3.5 w-3.5" />
              </button>
              {isAdmin && (
                <button 
                  onClick={onDelete} 
                  className="rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-red-200" 
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Self-Destruct Progress Bar */}
          {timeLeft !== null && expiresTime && (
            <div className="absolute bottom-0 left-0 right-0 h-0.75 overflow-hidden bg-white/5">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: Math.max(0, (expiresTime - Date.now()) / 1000), ease: "linear" }}
                className="h-full bg-pink-500/50"
              />
            </div>
          )}
        </div>
        
        {isMine && <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl">{message.senderAvatar}</div>}
      </motion.div>

      {/* Full-Screen Lightbox Modal for Images */}
      {lightboxOpen && message.imageUrl && (!message.viewOnce || !isViewed) && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button 
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2.5 text-white/80 hover:bg-white/20 transition hover:scale-105 active:scale-95"
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* Image */}
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            src={message.imageUrl}
            alt="Attachment Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl border border-white/10 select-none"
            style={{ ["WebkitUserDrag" as any]: "none" }}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      )}
    </>
  );
}
