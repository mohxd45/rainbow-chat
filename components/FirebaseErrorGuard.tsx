"use client";

import { useAuth } from "@/hooks/useAuth";
import { Database, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import { GlassCard } from "./GlassCard";

export function FirebaseErrorGuard({ children }: { children: React.ReactNode }) {
  const { error, clearError } = useAuth();

  if (!error) {
    return <>{children}</>;
  }

  const handleReload = () => {
    clearError();
    window.location.reload();
  };

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-black/85 px-4 py-8 md:py-16 backdrop-blur-md flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <GlassCard className="neon-border border-amber-500/30 p-6 sm:p-10 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Database className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">Database Setup Required</h1>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">Firebase Connection Exception Detected</p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-8 text-sm text-amber-200/90 leading-relaxed flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Error Message:</p>
              <p className="font-mono text-xs text-amber-300 break-all select-all">{error}</p>
            </div>
          </div>

          <div className="space-y-6 text-sm">
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-black">1</span>
                Option A: Enable Cloud Firestore (Recommended)
              </h2>
              <p className="mt-2 text-white/60 leading-relaxed">
                If you want to use the live Firebase database, you must activate Firestore:
              </p>
              <ol className="mt-3 list-decimal list-inside space-y-2 text-xs text-white/70 pl-1">
                <li>Go to the <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 font-semibold">Firebase Console</a>.</li>
                <li>Select your project <strong className="text-white">rainbow-room-fda2a</strong>.</li>
                <li>In the left sidebar, click <strong className="text-white">Build &gt; Firestore Database</strong>.</li>
                <li>Click <strong className="text-white">Create Database</strong>, select <strong className="text-white">Start in test mode</strong>, and click enable.</li>
                <li>Wait a minute and refresh this page.</li>
              </ol>
            </div>

            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-pink-400/20 text-pink-300 text-xs font-black">2</span>
                Option B: Switch to Shared Local Database (Immediate Fix)
              </h2>
              <p className="mt-2 text-white/60 leading-relaxed">
                You can run the app offline on a server-saved file database. It will sync between your phone and laptop instantly:
              </p>
              <ul className="mt-3 list-disc list-inside space-y-2 text-xs text-white/70 pl-1">
                <li>Open the file <strong className="text-white">.env.local</strong> inside the <strong className="text-white">rainbow-rooms</strong> directory on your laptop.</li>
                <li>Set the API key to use a dummy signature:
                  <pre className="mt-1.5 font-mono text-[11px] bg-black/40 border border-white/5 p-2 rounded-lg text-pink-300 select-all block">NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDummyKey</pre>
                </li>
                <li>Save the file, then rebuild and restart the Next.js server.</li>
                <li>Reload the page on your phone or laptop.</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReload}
              className="flex-1 rounded-2xl bg-white text-black font-bold py-3.5 px-6 transition hover:bg-white/95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  // Fallback directly to mock mode client-side
                  clearError();
                  localStorage.setItem("mock_auth_user", JSON.stringify({ uid: "mock_local_user", isAnonymous: true }));
                  window.location.reload();
                }
              }}
              className="rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 font-bold py-3.5 px-6 text-white text-xs transition"
            >
              Force Local Offline Session
            </button>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
