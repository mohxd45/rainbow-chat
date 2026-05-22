"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ChatHeader } from "@/components/ChatHeader";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MessageBubble } from "@/components/MessageBubble";
import { MessageInput } from "@/components/MessageInput";
import { ReportModal } from "@/components/ReportModal";
import { TypingIndicator } from "@/components/TypingIndicator";

import { useAuth } from "@/hooks/useAuth";
import { useStealth } from "@/components/StealthProvider";
import { db, addDoc, collection, doc, increment, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, deleteDoc } from "@/lib/firebase";
import { filterBadWords } from "@/lib/utils";
import type { Message, Room } from "@/types";

export default function ChatRoomPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;
  const router = useRouter();
  const { appUser, loading } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [reportTarget, setReportTarget] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const lastMessageRef = useRef("");
  const lastSentAtRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef(0);
  const { isDisguised } = useStealth();

  const isAdmin = useMemo(() => !!room && !!appUser && room.createdBy === appUser.uid, [room, appUser]);

  // Soft synth popup sound notification
  const playSoftNotification = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Soft notification play failed:", e);
    }
  };

  useEffect(() => {
    if (messages.length === 0) {
      prevMessageCountRef.current = 0;
      return;
    }
    
    if (prevMessageCountRef.current > 0 && messages.length > prevMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderId !== appUser?.uid) {
        if (!isDisguised) {
          playSoftNotification();
        }
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, appUser?.uid, isDisguised]);

  useEffect(() => {
    if (!loading && !appUser) {
      router.replace(`/enter?redirect=/rooms/${roomId}`);
    }
  }, [appUser, loading, router, roomId]);

  useEffect(() => {
    if (!roomId) return;
    
    // Add a safety timeout of 7 seconds to prevent hanging on loader if room snapshot hangs
    const safetyTimeout = setTimeout(() => {
      console.warn("[ChatRoomPage] Room snapshot subscription timed out after 7s. Forcing loadingRoom=false.");
      setLoadingRoom(false);
    }, 7000);

    const roomRef = doc(db, "rooms", roomId);
    const unsub = onSnapshot(roomRef, (snap) => {
      clearTimeout(safetyTimeout);
      if (!snap.exists()) {
        setLoadingRoom(false);
        return;
      }
      setRoom({ id: snap.id, ...snap.data() } as Room);
      setLoadingRoom(false);
    }, (err) => {
      clearTimeout(safetyTimeout);
      console.error("[ChatRoomPage] Room subscription error:", err);
      setLoadingRoom(false);
    });
    return () => {
      clearTimeout(safetyTimeout);
      unsub();
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !appUser) return;
    const roomRef = doc(db, "rooms", roomId);
    updateDoc(roomRef, { activeUsers: increment(1) }).catch(() => {});
    return () => { updateDoc(roomRef, { activeUsers: increment(-1) }).catch(() => {}); };
  }, [roomId, appUser]);

  useEffect(() => {
    if (!roomId) return;
    const q = query(collection(db, "rooms", roomId, "messages"), orderBy("createdAt", "asc"), limit(80));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Message)));
    }, (err) => {
      console.error("[ChatRoomPage] Messages query error:", err);
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !appUser) return;
    const q = query(collection(db, "rooms", roomId, "typing"), where("isTyping", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      setTypingNames(snap.docs.map((d: any) => d.data().username as string).filter((name: string) => name !== appUser.anonymousName));
    }, (err) => {
      console.error("[ChatRoomPage] Typing indicators query error:", err);
    });
    return () => unsub();
  }, [roomId, appUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingNames.length]);

  // Scavenge expired disappearing messages (run by room creator/admin to clean up DB)
  useEffect(() => {
    if (!isAdmin || messages.length === 0) return;
    
    const now = Date.now();
    const expired = messages.filter((m) => {
      if (!m.expiresAt) return false;
      const expTime = m.expiresAt.toDate ? m.expiresAt.toDate().getTime() : new Date(m.expiresAt).getTime();
      return expTime <= now;
    });

    expired.forEach((m) => {
      console.log("[ChatRoomPage] Scavenger deleting expired message:", m.id);
      deleteDoc(doc(db, "rooms", roomId, "messages", m.id)).catch((err) => {
        console.error("[ChatRoomPage] Failed to delete expired message:", err);
      });
    });
  }, [messages, isAdmin, roomId]);

  async function setTyping(isTyping: boolean) {
    if (!appUser) return;
    await setDoc(doc(db, "rooms", roomId, "typing", appUser.uid), {
      username: appUser.anonymousName,
      isTyping,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  async function sendMessage(
    rawText: string,
    media?: { imageUrl?: string; audioUrl?: string; audioDuration?: number },
    options?: { 
      replyTo?: { id: string; text: string; senderName: string } | Message | null; 
      selfDestruct?: boolean;
      poll?: { question: string; options: string[] } | null;
      viewOnce?: boolean;
    }
  ) {
    if (!appUser) return "Please enter anonymously first.";
    const now = Date.now();
    const text = rawText ? filterBadWords(rawText) : "";
    
    if (text) {
      if (text.length > 500) return "Message is too long. Keep it under 500 characters.";
      if (text.toLowerCase() === lastMessageRef.current.toLowerCase() && !media) {
        return "Please avoid sending the same message repeatedly.";
      }
    }
    
    if (now - lastSentAtRef.current < 1500) return "Slow down a little before sending again.";

    lastSentAtRef.current = now;
    if (text) lastMessageRef.current = text;

    const expiresAt = options?.selfDestruct ? new Date(Date.now() + 15000) : null;

    const messageData: any = {
      text,
      senderId: appUser.uid,
      senderName: appUser.anonymousName,
      senderAvatar: appUser.avatar,
      createdAt: serverTimestamp(),
      deleted: false,
      reported: false,
      ...(media?.imageUrl ? { imageUrl: media.imageUrl } : {}),
      ...(media?.audioUrl ? { audioUrl: media.audioUrl } : {}),
      ...(media?.audioDuration !== undefined ? { audioDuration: media.audioDuration } : {}),
      ...(options?.replyTo ? {
        replyTo: {
          id: options.replyTo.id,
          text: options.replyTo.text,
          senderName: options.replyTo.senderName
        }
      } : {}),
      ...(expiresAt ? { expiresAt } : {}),
      ...(options?.viewOnce ? { viewOnce: true, viewedBy: [] } : {}),
    };

    if (options?.poll) {
      messageData.poll = {
        question: options.poll.question,
        options: options.poll.options.map((opt) => ({ text: opt, votes: [] }))
      };
      if (!messageData.text) messageData.text = "";
    }

    await addDoc(collection(db, "rooms", roomId, "messages"), messageData);
  }

  async function markMediaAsViewed(messageId: string) {
    if (!appUser) return;
    const msgRef = doc(db, "rooms", roomId, "messages", messageId);
    const msgDoc = messages.find((m) => m.id === messageId);
    if (!msgDoc) return;

    const currentViewedBy = msgDoc.viewedBy || [];
    if (currentViewedBy.includes(appUser.uid)) return;

    const updatedViewedBy = [...currentViewedBy, appUser.uid];
    await updateDoc(msgRef, { viewedBy: updatedViewedBy }).catch((err) => {
      console.error("[ChatRoomPage] Failed to mark media as viewed:", err);
    });
  }

  async function deleteMessage(message: Message) {
    if (!isAdmin) return;
    await updateDoc(doc(db, "rooms", roomId, "messages", message.id), { deleted: true, text: "", deletedAt: serverTimestamp() });
  }

  async function reportMessage(reason: string) {
    if (!appUser || !reportTarget) return;
    await addDoc(collection(db, "reports"), {
      roomId,
      messageId: reportTarget.id,
      reportedBy: appUser.uid,
      messageText: reportTarget.text,
      reason,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "rooms", roomId, "messages", reportTarget.id), { reported: true });
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!appUser) return;
    const msgRef = doc(db, "rooms", roomId, "messages", messageId);
    const msgDoc = messages.find((m) => m.id === messageId);
    if (!msgDoc) return;

    const currentReactions = msgDoc.reactions || {};
    const currentUsers = currentReactions[emoji] || [];
    let newUsers: string[];

    if (currentUsers.includes(appUser.uid)) {
      newUsers = currentUsers.filter((uid) => uid !== appUser.uid);
    } else {
      newUsers = [...currentUsers, appUser.uid];
    }

    const updatedReactions = { ...currentReactions, [emoji]: newUsers };
    
    // Clean up empty reaction arrays to keep DB small
    if (newUsers.length === 0) {
      delete updatedReactions[emoji];
    }

    await updateDoc(msgRef, { reactions: updatedReactions }).catch((err) => {
      console.error("[ChatRoomPage] Failed to toggle reaction:", err);
    });
  }

  async function votePoll(messageId: string, optionIndex: number) {
    if (!appUser) return;
    const msgRef = doc(db, "rooms", roomId, "messages", messageId);
    const msgDoc = messages.find((m) => m.id === messageId);
    if (!msgDoc || !msgDoc.poll) return;

    const updatedOptions = msgDoc.poll.options.map((opt, idx) => {
      let votes = opt.votes || [];
      if (idx === optionIndex) {
        if (votes.includes(appUser.uid)) {
          votes = votes.filter((uid) => uid !== appUser.uid);
        } else {
          votes = [...votes, appUser.uid];
        }
      } else {
        // Option level user vote removal for single-choice polls (like Instagram)
        votes = votes.filter((uid) => uid !== appUser.uid);
      }
      return { ...opt, votes };
    });

    await updateDoc(msgRef, {
      poll: {
        ...msgDoc.poll,
        options: updatedOptions
      }
    }).catch((err) => {
      console.error("[ChatRoomPage] Failed to vote:", err);
    });
  }

  if (loading || loadingRoom || !appUser) {
    return <main className="relative z-10 grid min-h-screen place-items-center"><LoadingSpinner label="Loading chat room" /></main>;
  }

  if (!room) {
    return <main className="relative z-10 mx-auto grid min-h-screen max-w-2xl place-items-center px-5"><EmptyState title="Room not found" description="This room may have been deleted or the link is incorrect." /></main>;
  }

  return (
    <main className="relative z-10 mx-auto flex h-[100dvh] sm:h-screen max-w-6xl flex-col p-0 sm:p-4">
      <ChatHeader room={room} />
      
      {/* Sidebar Layout wrapping the Chat Stream and Ad Panel */}
      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        
        {/* Left Area: Messages stream & text/media input */}
        <div className="flex flex-1 flex-col min-w-0 h-full">


          <section className="scrollbar-thin flex-1 space-y-4 overflow-y-auto rounded-none sm:rounded-3xl border-0 sm:border border-white/10 bg-transparent sm:bg-black/20 p-3 sm:p-5">
            {messages.length === 0 ? (
              <EmptyState title="No messages yet" description="Be the first anonymous voice in this room." />
            ) : (
              messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isMine={message.senderId === appUser.uid} 
                  isAdmin={isAdmin} 
                  onReport={() => setReportTarget(message)} 
                  onDelete={() => deleteMessage(message)}
                  onReact={(emoji) => toggleReaction(message.id, emoji)}
                  onReply={() => setReplyTo(message)}
                  onVote={(optionIndex) => votePoll(message.id, optionIndex)}
                  onViewOnceBurn={() => markMediaAsViewed(message.id)}
                />
              ))
            )}
            <TypingIndicator names={typingNames} />
            <div ref={bottomRef} />
          </section>
          
          <div className="mt-0 sm:mt-3 shrink-0">
            <MessageInput 
              onSend={sendMessage} 
              onTyping={setTyping} 
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
            />
          </div>
        </div>

        {/* Right Area: Room Info & Vertical Ad Panel (Desktop only) */}
        <div className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto rounded-3xl border border-white/10 bg-black/20 p-5 md:flex">
          <div>
            <h3 className="text-xs font-bold tracking-wider text-cyan-300 uppercase">Room Information</h3>
            <p className="mt-4 text-sm font-bold text-white leading-tight truncate">{room.name}</p>
            <p className="mt-1.5 text-xs text-white/60 leading-relaxed">{room.description || "No description provided."}</p>
            
            <div className="mt-5 border-t border-white/10 pt-4 space-y-3 text-xs text-white/50">
              <div>
                <span className="font-semibold text-white/70">Created By:</span>
                <p className="font-mono mt-0.5 truncate text-[10px]">{room.createdBy === appUser.uid ? "You (Admin)" : "Anonymous Creator"}</p>
              </div>
              <div>
                <span className="font-semibold text-white/70">Room Code:</span>
                <p className="mt-0.5 font-mono text-[10px] tracking-wide bg-white/5 px-2 py-1 rounded-lg inline-block border border-white/5 text-pink-300 select-all">{room.roomCode}</p>
              </div>
              <div>
                <span className="font-semibold text-white/70">Type:</span>
                <p className="mt-0.5 capitalize">{room.type} chat room</p>
              </div>
            </div>
          </div>


        </div>

      </div>

      <ReportModal open={!!reportTarget} message={reportTarget} onClose={() => setReportTarget(null)} onSubmit={reportMessage} />
    </main>
  );
}
