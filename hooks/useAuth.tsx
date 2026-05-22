"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { auth, db, onAuthStateChanged, signInAnonymously, doc, getDoc, serverTimestamp, setDoc, updateDoc, onSnapshot, useRealFirebase, query, getDocs, collection, where, fetchCollection } from "@/lib/firebase";
import { generateAnonymousProfile, parseUserAgent, getDeviceFingerprint } from "@/lib/utils";
import type { AppUser } from "@/types";

type AuthContextValue = {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  error: string | null;
  enterAnonymously: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    
    async function initAuth() {
      console.log("[useAuth] initAuth started. useRealFirebase:", useRealFirebase);
      // 1. Check for device fingerprint auto-login if no local storage session exists (only for mock database)
      if (!useRealFirebase && typeof window !== "undefined") {
        console.log("[useAuth] Checking mock auth user...");
        const saved = localStorage.getItem("mock_auth_user");
        console.log("[useAuth] Saved mock user:", saved);
        if (!saved) {
          try {
            const fp = getDeviceFingerprint();
            console.log("[useAuth] Device fingerprint calculated:", fp);
            const res = await fetch(`/api/mock-firestore?path=users`);
            console.log("[useAuth] Fetch mock-firestore users status:", res.status);
            if (res.ok) {
              const users = await res.json();
              const existingUser = users.find((u: any) => u.deviceFingerprint === fp);
              console.log("[useAuth] Found existing user matching fingerprint:", existingUser);
              if (existingUser && isSubscribed) {
                const mockUser = { uid: existingUser.id, isAnonymous: true };
                localStorage.setItem("mock_auth_user", JSON.stringify(mockUser));
                console.log("[useAuth] Auto-logged in with fingerprint as:", mockUser.uid);
              }
            }
          } catch (e) {
            console.error("[useAuth] Auto-login fingerprint check failed:", e);
          }
        }
      }

      if (!isSubscribed) {
        console.log("[useAuth] initAuth: subscription cancelled before registering auth listener");
        return;
      }

      console.log("[useAuth] Registering onAuthStateChanged listener...");
      const unsubAuth = onAuthStateChanged(auth, (user) => {
        console.log("[useAuth] onAuthStateChanged fired. User:", user ? user.uid : "null");
        if (!isSubscribed) return;
        setFirebaseUser(user);
        if (!user) {
          setAppUser(null);
          setLoading(false);
          console.log("[useAuth] No user detected. Set loading=false");
        }
      });
      
      return unsubAuth;
    }

    let unsub: any = null;
    initAuth().then((u) => {
      if (u) unsub = u;
    });

    return () => {
      isSubscribed = false;
      if (unsub) {
        console.log("[useAuth] Cleaning up onAuthStateChanged listener");
        unsub();
      }
    };
  }, []);

  useEffect(() => {
    console.log("[useAuth] Second useEffect triggered. firebaseUser:", firebaseUser ? firebaseUser.uid : "null");
    if (!firebaseUser) return;

    let isSubscribed = true;
    
    // Add a safety timeout of 7 seconds to prevent hanging on loading screen if Firestore connection is slow/blocked
    const safetyTimeout = setTimeout(() => {
      if (isSubscribed && loading) {
        console.warn("[useAuth] Firestore user subscription timed out after 7s. Forcing loading=false.");
        setLoading(false);
      }
    }, 7000);

    const ref = doc(db, "users", firebaseUser.uid);
    console.log("[useAuth] Starting users doc subscription for:", firebaseUser.uid);

    const unsubDoc = onSnapshot(ref, (snap) => {
      clearTimeout(safetyTimeout);
      console.log("[useAuth] users doc snapshot received. Exists:", snap.exists());
      try {
        if (!snap.exists()) {
          console.log("[useAuth] Creating new user profile document...");
          const profile = generateAnonymousProfile();
          const deviceInfo = typeof window !== "undefined" ? parseUserAgent(window.navigator.userAgent) : "Unknown Device";
          const deviceFingerprint = getDeviceFingerprint();
          
          // Set initial local state instantly with "Unknown" IP to unblock loading screen
          if (isSubscribed) {
            setAppUser({ uid: firebaseUser.uid, ...profile, deviceInfo, ipAddress: "Unknown", banned: false });
            setLoading(false);
            console.log("[useAuth] Set appUser and loading=false immediately for new user");
          }

          // Asynchronously perform Firestore set doc and background IP resolution
          const createProfileAsync = async () => {
            let ipAddress = "Unknown";
            try {
              console.log("[useAuth] Fetching client IP address in background...");
              const ipRes = await fetch("/api/ip");
              if (ipRes.ok) {
                const ipData = await ipRes.json();
                ipAddress = ipData.ip || "Unknown";
              }
            } catch (e) {
              console.error("[useAuth] Failed to fetch client IP during background registration:", e);
            }

            // Check if fingerprint or IP is already banned
            let isBanned = false;
            try {
              if (useRealFirebase) {
                const qFp = query(collection(db, "users"), where("deviceFingerprint", "==", deviceFingerprint), where("banned", "==", true));
                const snapFp = await getDocs(qFp);
                if (!snapFp.empty) {
                  isBanned = true;
                  console.log("[useAuth] Banned fingerprint match found during registration.");
                } else if (ipAddress !== "Unknown") {
                  const qIp = query(collection(db, "users"), where("ipAddress", "==", ipAddress), where("banned", "==", true));
                  const snapIp = await getDocs(qIp);
                  if (!snapIp.empty) {
                    isBanned = true;
                    console.log("[useAuth] Banned IP match found during registration.");
                  }
                }
              } else {
                const users = await fetchCollection("users");
                const fpBanned = users.some((u: any) => u.deviceFingerprint === deviceFingerprint && u.banned);
                const ipBanned = users.some((u: any) => ipAddress !== "Unknown" && u.ipAddress === ipAddress && u.banned);
                if (fpBanned || ipBanned) {
                  isBanned = true;
                  console.log("[useAuth] Banned signature found in mock DB registration.");
                }
              }
            } catch (err) {
              console.error("[useAuth] Failed to check existing bans:", err);
            }

            const payload = { 
              ...profile, 
              deviceInfo,
              deviceFingerprint,
              ipAddress,
              createdAt: serverTimestamp(), 
              lastActive: serverTimestamp(), 
              banned: isBanned 
            };
            console.log("[useAuth] Writing new user document to db in background...", payload);
            await setDoc(ref, payload);
            console.log("[useAuth] New user document set successfully in background.");
            
            // If the IP resolved successfully or ban status detected, update the state
            if (isSubscribed) {
              setAppUser(prev => prev ? { ...prev, ipAddress, banned: isBanned } : null);
            }
          };

          createProfileAsync().catch(err => {
            console.error("[useAuth] Background profile creation failed:", err);
          });

        } else {
          const data = snap.data();
          console.log("[useAuth] Loaded user document data:", data);
          
          const deviceFingerprint = getDeviceFingerprint();
          const ipAddress = data.ipAddress || "Unknown";

          if (isSubscribed) {
            setAppUser({
              uid: firebaseUser.uid,
              anonymousName: data.anonymousName,
              avatar: data.avatar,
              deviceInfo: data.deviceInfo || "Unknown Device",
              ipAddress: ipAddress,
              banned: !!data.banned,
            });
            setLoading(false);
            console.log("[useAuth] Set appUser and loading=false immediately for existing user");
          }

          // Dynamically check/update missing metadata asynchronously in the background
          const handleMetadataUpdates = async () => {
            const updates: any = {};
            if (!data.deviceInfo) {
              updates.deviceInfo = typeof window !== "undefined" ? parseUserAgent(window.navigator.userAgent) : "Unknown Device";
            }
            if (!data.deviceFingerprint) {
              updates.deviceFingerprint = deviceFingerprint;
            }
            
            // Double check if their fingerprint/IP is banned
            let checkBanned = false;
            try {
              if (useRealFirebase) {
                const qFp = query(collection(db, "users"), where("deviceFingerprint", "==", deviceFingerprint), where("banned", "==", true));
                const snapFp = await getDocs(qFp);
                if (!snapFp.empty) checkBanned = true;
              } else {
                const users = await fetchCollection("users");
                if (users.some((u: any) => u.deviceFingerprint === deviceFingerprint && u.banned)) {
                  checkBanned = true;
                }
              }
            } catch (e) {
              console.error("[useAuth] Error checking device fingerprint ban for metadata sync:", e);
            }

            if (checkBanned && !data.banned) {
              updates.banned = true;
              console.log("[useAuth] Banned status sync detected! Flagging user document as banned.");
            }

            if (!data.ipAddress) {
              try {
                console.log("[useAuth] Fetching client IP for missing metadata in background...");
                const ipRes = await fetch("/api/ip");
                if (ipRes.ok) {
                  const ipData = await ipRes.json();
                  updates.ipAddress = ipData.ip || "Unknown";
                }
              } catch (e) {
                console.error("[useAuth] Failed to fetch client IP for background updates:", e);
              }
            }

            if (Object.keys(updates).length > 0) {
              console.log("[useAuth] Updating user document missing fields in background:", updates);
              await updateDoc(ref, updates);
              if (isSubscribed) {
                setAppUser(prev => prev ? { 
                  ...prev, 
                  ...(updates.ipAddress ? { ipAddress: updates.ipAddress } : {}),
                  ...(updates.banned ? { banned: true } : {})
                } : null);
              }
            }
          };

          handleMetadataUpdates().catch((err) => {
            console.error("[useAuth] Failed to process background metadata updates:", err);
          });
        }
      } catch (err: any) {
        console.error("[useAuth] Error syncing user document:", err);
        if (isSubscribed) {
          setError(err?.message || "Failed to sync user document");
          setLoading(false);
        }
      }
    }, (err) => {
      clearTimeout(safetyTimeout);
      console.error("[useAuth] Snapshot subscription error:", err);
      if (isSubscribed) {
        if (err?.message?.includes("API has not been used") || err?.message?.includes("disabled") || (err as any)?.code === "permission-denied") {
          setError("Firebase Cloud Firestore API is disabled. Please enable it in the GCP/Firebase console, or set a dummy API key in .env.local to run the database locally over the Cloudflare tunnel.");
        } else {
          setError(err?.message || "Failed to connect to Firebase Firestore");
        }
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      clearTimeout(safetyTimeout);
      console.log("[useAuth] Cleaning up users doc subscription");
      unsubDoc();
    };
  }, [firebaseUser]);

  async function enterAnonymously() {
    setLoading(true);
    setError(null);
    try {
      console.log("[useAuth] enterAnonymously: invoking signInAnonymously...");
      await signInAnonymously(auth);
      console.log("[useAuth] enterAnonymously: signInAnonymously succeeded.");
    } catch (err: any) {
      console.error("[useAuth] enterAnonymously: signInAnonymously failed:", err);
      setLoading(false);
      if (err?.message?.includes("API has not been used") || err?.message?.includes("disabled")) {
        setError("Firebase Authentication/Firestore API is disabled. Please enable it in the Firebase console.");
      } else {
        setError(err?.message || "Failed to sign in anonymously");
      }
      throw err;
    }
  }

  const value = useMemo(() => ({ 
    firebaseUser, 
    appUser, 
    loading, 
    error, 
    enterAnonymously, 
    clearError: () => setError(null) 
  }), [firebaseUser, appUser, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
