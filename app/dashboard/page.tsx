"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Plus, KeyRound, Globe, Lock, Shield, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { RainbowButton } from "@/components/RainbowButton";
import { RoomCard } from "@/components/RoomCard";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { JoinRoomModal } from "@/components/JoinRoomModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { VercelConfigModal } from "@/components/VercelConfigModal";

import { useAuth } from "@/hooks/useAuth";
import { db, collection, onSnapshot, query, where, useRealFirebase } from "@/lib/firebase";
import type { Room } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { appUser, loading } = useAuth();
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [adminRooms, setAdminRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"public" | "my-rooms" | "admin-rooms">("public");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [vercelGuideOpen, setVercelGuideOpen] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authorized = 
        sessionStorage.getItem("admin_authorized") === "true" ||
        localStorage.getItem("admin_authorized") === "true";
      setIsAdminAuthorized(authorized);
    }
  }, []);

  useEffect(() => {
    if (!loading && !appUser) router.replace("/enter");
  }, [appUser, loading, router]);

  useEffect(() => {
    if (!appUser) return;

    // 1. Subscribe to public active rooms
    const qPublic = query(
      collection(db, "rooms"),
      where("type", "==", "public"),
      where("isActive", "==", true)
    );
    const unsubPublic = onSnapshot(
      qPublic,
      (snap) => {
        const docs = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Room));
        // Sort client-side by createdAt descending to bypass composite index requirement
        docs.sort((a: Room, b: Room) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setPublicRooms(docs);
        setRoomsLoading(false);
      },
      (err) => {
        console.error("Public rooms query error:", err);
        setRoomsLoading(false);
      }
    );

    // 2. Subscribe to user's created rooms (can be public or private)
    const qMy = query(
      collection(db, "rooms"),
      where("createdBy", "==", appUser.uid),
      where("isActive", "==", true)
    );
    const unsubMy = onSnapshot(
      qMy,
      (snap) => {
        const docs = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Room));
        // Sort client-side by createdAt descending to bypass composite index requirement
        docs.sort((a: Room, b: Room) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setMyRooms(docs);
      },
      (err) => {
        console.error("My rooms query error:", err);
      }
    );

    // 3. Subscribe to all rooms if admin is authorized (public or private)
    let unsubAdmin = () => {};
    if (isAdminAuthorized) {
      const qAll = query(
        collection(db, "rooms"),
        where("isActive", "==", true)
      );
      unsubAdmin = onSnapshot(
        qAll,
        (snap) => {
          const docs = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Room));
          docs.sort((a: Room, b: Room) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
            return timeB - timeA;
          });
          setAdminRooms(docs);
        },
        (err) => {
          console.error("Admin rooms query error:", err);
        }
      );
    }

    return () => {
      unsubPublic();
      unsubMy();
      unsubAdmin();
    };
  }, [appUser, isAdminAuthorized]);

  if (loading || !appUser) {
    return <main className="relative z-10 grid min-h-screen place-items-center"><LoadingSpinner label="Opening Rainbow Chat" /></main>;
  }

  const currentRooms = activeTab === "public" 
    ? publicRooms 
    : activeTab === "my-rooms" 
      ? myRooms 
      : adminRooms;

  return (
    <>
      <Navbar />
      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-14">
        {/* Mock Database Warning Banner */}
        {!useRealFirebase && (
          <GlassCard className="border-amber-500/30 bg-amber-500/5 p-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-[0_0_15px_rgba(245,158,11,0.05)]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-200">Offline Mock Database Mode Active</h4>
                <p className="text-xs text-white/60 mt-1">
                  Rooms created in mock mode will not sync with your phone or persist on Vercel's serverless containers.
                </p>
              </div>
            </div>
            <button
              onClick={() => setVercelGuideOpen(true)}
              className="shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition self-start sm:self-center"
            >
              Setup Firebase on Vercel
            </button>
          </GlassCard>
        )}

        {/* Welcome Card */}
        <GlassCard className="neon-border mb-6 p-6 sm:p-8">
          <p className="text-sm text-white/55">Welcome back</p>
          <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black sm:text-5xl">{appUser.avatar} {appUser.anonymousName}</h1>
              <p className="mt-3 max-w-2xl text-white/60">Create a room, join by private code, or jump into a public room. Your real identity is never displayed.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <RainbowButton onClick={() => setCreateOpen(true)}><span className="inline-flex items-center gap-2"><Plus className="h-5 w-5" /> Create Room</span></RainbowButton>
              <button onClick={() => setJoinOpen(true)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 font-semibold transition hover:bg-white/15"><span className="inline-flex items-center gap-2"><KeyRound className="h-5 w-5" /> Join Code</span></button>
            </div>
          </div>
        </GlassCard>

        {/* Tab Selection */}
        <div className="mb-6 flex border-b border-white/10 pb-px gap-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("public")}
            className={`flex items-center gap-2 pb-4 text-base sm:text-lg font-bold transition relative shrink-0 ${
              activeTab === "public" ? "text-cyan-300" : "text-white/40 hover:text-white/60"
            }`}
          >
            <Globe className="h-4 w-4" />
            Explore Public
            {activeTab === "public" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("my-rooms")}
            className={`flex items-center gap-2 pb-4 text-base sm:text-lg font-bold transition relative shrink-0 ${
              activeTab === "my-rooms" ? "text-pink-300" : "text-white/40 hover:text-white/60"
            }`}
          >
            <Lock className="h-4 w-4" />
            My Rooms ({myRooms.length})
            {activeTab === "my-rooms" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.6)]" />
            )}
          </button>
          {isAdminAuthorized && (
            <button
              onClick={() => setActiveTab("admin-rooms")}
              className={`flex items-center gap-2 pb-4 text-base sm:text-lg font-bold transition relative shrink-0 ${
                activeTab === "admin-rooms" ? "text-amber-300" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Shield className="h-4 w-4" />
              All Rooms (Admin) ({adminRooms.length})
              {activeTab === "admin-rooms" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              )}
            </button>
          )}
        </div>

        {/* Rooms Listing */}
        {roomsLoading ? (
          <LoadingSpinner label="Loading rooms" />
        ) : currentRooms.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentRooms.map((room) => (
              <RoomCard key={room.id} room={room} onJoin={(r) => router.push(`/rooms/${r.id}`)} />
            ))}
          </div>
        ) : (
          <EmptyState 
            title={
              activeTab === "public" 
                ? "No public chats yet" 
                : activeTab === "my-rooms" 
                  ? "No chats created yet" 
                  : "No rooms in database"
            } 
            description={
              activeTab === "public" 
                ? "Create the first public rainbow chat and invite people to start chatting." 
                : activeTab === "my-rooms" 
                  ? "Create a private or public chat using the button above to see it here."
                  : "There are currently no rooms created in the database."
            } 
          />
        )}
      </main>
      <CreateRoomModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinRoomModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      <VercelConfigModal open={vercelGuideOpen} onClose={() => setVercelGuideOpen(false)} />
    </>
  );
}
