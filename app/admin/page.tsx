"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Trash2, 
  Ban, 
  Check, 
  ChevronRight, 
  Sparkles,
  RefreshCw
} from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { RainbowButton } from "@/components/RainbowButton";
import { db, collection, doc, onSnapshot, updateDoc, deleteDoc } from "@/lib/firebase";

export default function AdminPage() {
  const [passkey, setPasskey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "rooms" | "reports">("users");

  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  // Check if admin is already logged in locally in this session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const authState = sessionStorage.getItem("admin_authorized") === "true" ||
                        localStorage.getItem("admin_authorized") === "true";
      if (authState) {
        setIsAuthorized(true);
      }
    }
  }, []);

  // Handle Passkey Authorization
  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === "mohxd_4042") {
      setIsAuthorized(true);
      setError("");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_authorized", "true");
        localStorage.setItem("admin_authorized", "true");
      }
    } else {
      setError("Incorrect Passkey. Please try again.");
    }
  };

  const handleSignOut = () => {
    setIsAuthorized(false);
    setPasskey("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_authorized");
      localStorage.removeItem("admin_authorized");
    }
  };

  // Real-time updates from Mock DB
  useEffect(() => {
    if (!isAuthorized) return;

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });

    const unsubRooms = onSnapshot(collection(db, "rooms"), (snap) => {
      setRooms(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });

    const unsubReports = onSnapshot(collection(db, "reports"), (snap) => {
      setReports(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubRooms();
      unsubReports();
    };
  }, [isAuthorized]);

  // Actions
  const handleBanUser = async (userId: string, banStatus: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { banned: banStatus });
    } catch (err) {
      console.error("Error updating ban status:", err);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to permanently delete this room?")) return;
    try {
      const roomRef = doc(db, "rooms", roomId);
      await deleteDoc(roomRef);
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  };

  const handleDeleteMessage = async (roomId: string, messageId: string, reportId: string) => {
    try {
      // 1. Mark message as deleted in its room
      const msgRef = doc(db, "rooms", roomId, "messages", messageId);
      await updateDoc(msgRef, { deleted: true, text: "" });
      // 2. Delete the report
      const reportRef = doc(db, "reports", reportId);
      await deleteDoc(reportRef);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      const reportRef = doc(db, "reports", reportId);
      await deleteDoc(reportRef);
    } catch (err) {
      console.error("Error dismissing report:", err);
    }
  };

  // Login Screen
  if (!isAuthorized) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center px-5">
        <GlassCard className="neon-border w-full max-w-md p-8 sm:p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 shadow-neon mb-5 text-cyan-200">
              <ShieldAlert className="h-7 w-7" />
            </span>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Admin Access</h1>
            <p className="mt-2 text-sm text-white/60">Enter the administration secret key to unlock dashboard controls.</p>
          </div>

          <form onSubmit={handleAuthorize} className="mt-8 space-y-4">
            <div>
              <label htmlFor="passkey" className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Secret Passkey</label>
              <input
                id="passkey"
                type="password"
                placeholder="••••••••"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-5 py-3 text-white placeholder-white/20 outline-none transition focus:border-cyan-200/50"
                required
              />
            </div>

            {error && <p className="text-sm font-medium text-red-400">{error}</p>}

            <RainbowButton type="submit" className="w-full">Unlock Dashboard</RainbowButton>
          </form>

          <p className="mt-6 text-center text-xs text-white/35">
            Authorized administrators only
          </p>
        </GlassCard>
      </main>
    );
  }

  // Dashboard Screen
  return (
    <main className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:py-12">
      {/* Header */}
      <GlassCard className="neon-border mb-8 p-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 shadow-neon text-cyan-200">
            <Settings className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-black sm:text-3xl flex items-center gap-2">
              Admin <span className="bg-gradient-to-r from-pink-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-xs text-white/50">Control rooms, review moderation reports, and manage user suspensions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/15">
              Chat Home
            </button>
          </Link>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
          >
            <LogOut className="h-4 w-4" /> Lock
          </button>
        </div>
      </GlassCard>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex w-full items-center gap-3 rounded-2xl px-5 py-4 font-semibold transition-all ${
              activeTab === "users" 
                ? "bg-white/15 text-white neon-border" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Users className="h-5 w-5 text-cyan-300" />
            <span className="flex-1 text-left">Users</span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{users.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("rooms")}
            className={`flex w-full items-center gap-3 rounded-2xl px-5 py-4 font-semibold transition-all ${
              activeTab === "rooms" 
                ? "bg-white/15 text-white neon-border" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <MessageSquare className="h-5 w-5 text-emerald-300" />
            <span className="flex-1 text-left">Active Rooms</span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs">{rooms.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex w-full items-center gap-3 rounded-2xl px-5 py-4 font-semibold transition-all ${
              activeTab === "reports" 
                ? "bg-white/15 text-white neon-border" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <ShieldAlert className={`h-5 w-5 ${reports.length > 0 ? "text-red-400 animate-pulse" : "text-white/60"}`} />
            <span className="flex-1 text-left">Reports</span>
            {reports.length > 0 && (
              <span className="rounded-md bg-red-500/25 border border-red-500/30 text-red-200 px-2 py-0.5 text-xs">
                {reports.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <GlassCard className="neon-border p-6 sm:p-8 min-h-[500px]">
          {/* USERS TAB */}
          {activeTab === "users" && (
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-cyan-300" /> User Directory
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/80">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/45">
                      <th className="pb-3 pl-3">Identity</th>
                      <th className="pb-3">User UID</th>
                      <th className="pb-3">Device / Phone</th>
                      <th className="pb-3">IP Address</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-white/40">
                          No registered users found.
                        </td>
                      </tr>
                    ) : users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[.02]">
                        <td className="py-3.5 pl-3 flex items-center gap-3 font-semibold text-white">
                          <span className="text-2xl">{user.avatar}</span>
                          <span>{user.anonymousName}</span>
                        </td>
                        <td className="py-3.5 font-mono text-xs text-white/40">{user.id}</td>
                        <td className="py-3.5 text-xs text-white/70">{user.deviceInfo || "Unknown Device"}</td>
                        <td className="py-3.5 font-mono text-xs text-white/60">{user.ipAddress || "Unknown"}</td>
                        <td className="py-3.5">
                          {user.banned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                              Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-3 text-right">
                          {user.banned ? (
                            <button
                              onClick={() => handleBanUser(user.id, false)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                            >
                              <Check className="h-3.5 w-3.5" /> Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(user.id, true)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/25 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                            >
                              <Ban className="h-3.5 w-3.5" /> Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROOMS TAB */}
          {activeTab === "rooms" && (
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-emerald-300" /> Active Social Rooms
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/80">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/45">
                      <th className="pb-3 pl-3">Room Name</th>
                      <th className="pb-3">Code / Type</th>
                      <th className="pb-3">Created By</th>
                      <th className="pb-3 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rooms.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-white/40">
                          No active rooms.
                        </td>
                      </tr>
                    ) : rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-white/[.02]">
                        <td className="py-3.5 pl-3">
                          <div className="font-semibold text-white">{room.name}</div>
                          <div className="text-xs text-white/50 mt-0.5">{room.description}</div>
                        </td>
                        <td className="py-3.5">
                          <div className="font-mono text-xs text-cyan-300 font-semibold">{room.roomCode || "PUBLIC"}</div>
                          <div className="text-[10px] text-white/40 uppercase mt-0.5">{room.type}</div>
                        </td>
                        <td className="py-3.5 font-mono text-xs text-white/40">
                          {room.createdBy}
                        </td>
                        <td className="py-3.5 pr-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/rooms/${room.id}`}>
                              <button
                                className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20"
                              >
                                Join
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/25 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <ShieldAlert className="h-5 w-5 text-red-400" /> Moderation Reports
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/80">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/45">
                      <th className="pb-3 pl-3">Report Detail</th>
                      <th className="pb-3">Flagged Content</th>
                      <th className="pb-3">Reason</th>
                      <th className="pb-3 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-white/40">
                          No pending reports. The chat is clean!
                        </td>
                      </tr>
                    ) : reports.map((report) => (
                      <tr key={report.id} className="hover:bg-white/[.02]">
                        <td className="py-3.5 pl-3">
                          <div className="text-xs text-white/50">Reported By: <code className="font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded">{report.reportedBy}</code></div>
                          <div className="text-xs text-white/50 mt-1">Room ID: <code className="font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded">{report.roomId}</code></div>
                        </td>
                        <td className="py-3.5 max-w-[200px]">
                          <div className="rounded-lg bg-black/45 px-3 py-2 text-xs italic text-white/80 border border-white/5 break-words">
                            "{report.messageText}"
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">
                            {report.reason}
                          </span>
                        </td>
                        <td className="py-3.5 pr-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleDeleteMessage(report.roomId, report.messageId, report.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/25 px-2.5 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                              title="Delete Message & Clear Report"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Msg
                            </button>
                            <button
                              onClick={() => handleDismissReport(report.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                              title="Dismiss Report"
                            >
                              <Check className="h-3.5 w-3.5" /> Dismiss
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
