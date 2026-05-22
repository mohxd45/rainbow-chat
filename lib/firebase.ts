import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged as realOnAuthStateChanged,
  signInAnonymously as realSignInAnonymously,
} from "firebase/auth";
import {
  getFirestore,
  doc as realDoc,
  getDoc as realGetDoc,
  setDoc as realSetDoc,
  updateDoc as realUpdateDoc,
  addDoc as realAddDoc,
  deleteDoc as realDeleteDoc,
  collection as realCollection,
  onSnapshot as realOnSnapshot,
  increment as realIncrement,
  serverTimestamp as realServerTimestamp,
  getDocs as realGetDocs,
  query as realQuery,
  where as realWhere,
  orderBy as realOrderBy,
  limit as realLimit,
} from "firebase/firestore";
import {
  getStorage,
  ref as realStorageRef,
  uploadBytes as realUploadBytes,
  getDownloadURL as realGetDownloadURL,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we should use the mock client database
const isDummyKey = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("AIzaSyDummyKey");
export const useRealFirebase = !isDummyKey;

export const app = useRealFirebase
  ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

export const auth = useRealFirebase ? getAuth(app!) : ({ name: "mock-auth" } as any);
export const db = useRealFirebase ? getFirestore(app!) : ({ name: "mock-firestore" } as any);
export const storage = useRealFirebase ? getStorage(app!) : null;

export async function uploadFile(file: File): Promise<string> {
  if (useRealFirebase && storage) {
    try {
      const uploadPromise = (async () => {
        const storageRef = realStorageRef(storage, `uploads/${Date.now()}-${file.name}`);
        const snapshot = await realUploadBytes(storageRef, file);
        return await realGetDownloadURL(snapshot.ref);
      })();

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Firebase Storage upload timed out after 5s")), 5000)
      );

      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch (err) {
      console.warn("Firebase Storage upload failed or timed out. Falling back to local server upload.", err);
    }
  }

  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload file to local server");
  }
  const data = await res.json();
  return data.url;
}

// --- Mock Classes for Firestore emulator ---
class MockDocRef {
  constructor(public collectionPath: string, public id: string) {}
  get path() {
    return `${this.collectionPath}/${this.id}`;
  }
}

class MockCollectionRef {
  constructor(public path: string) {}
}

class MockQuery {
  constructor(public collectionRef: MockCollectionRef, public constraints: any[]) {}
}

// --- Client-Side API Caching & Communication ---
const clientCache: { [path: string]: any[] } = {};

export async function fetchCollection(path: string): Promise<any[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch(`/api/mock-firestore?path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error("Fetch failed");
    const data = await res.json();
    clientCache[path] = data;
    return data;
  } catch (e) {
    console.error("Error fetching mock collection:", e);
    return clientCache[path] || [];
  }
}

async function writeToMockCollection(action: "add" | "set" | "update" | "delete", path: string, id: string | null, data: any, merge?: boolean) {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/mock-firestore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, path, id, data, merge }),
    });
    if (!res.ok) throw new Error("Write failed");
    const result = await res.json();
    // Fetch updated collection to update client cache
    await fetchCollection(path);
    // Immediately notify local snapshot listeners for responsiveness
    notifyCollectionListeners(path);
    return result;
  } catch (e) {
    console.error("Error writing mock collection:", e);
    return null;
  }
}

function executeMockQuery(q: any): any[] {
  let path = "";
  let constraints: any[] = [];
  if (q instanceof MockCollectionRef) {
    path = q.path;
  } else if (q instanceof MockQuery) {
    path = q.collectionRef.path;
    constraints = q.constraints;
  } else {
    return [];
  }

  // Get data from local client cache
  let data = clientCache[path] || [];

  // Apply filters
  constraints.forEach((c) => {
    if (c.type === "where") {
      data = data.filter((item) => {
        const itemVal = item[c.field];
        if (c.operator === "==") return itemVal === c.value;
        if (c.operator === "!=") return itemVal !== c.value;
        if (c.operator === ">") return itemVal > c.value;
        if (c.operator === "<") return itemVal < c.value;
        return true;
      });
    }
  });

  // Apply sorting
  const orderByConstraint = constraints.find((c) => c.type === "orderBy");
  if (orderByConstraint) {
    const { field, direction } = orderByConstraint;
    data.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal === undefined || bVal === undefined) return 0;
      if (typeof aVal === "string") {
        return direction === "desc" ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return direction === "desc" ? bVal - aVal : aVal - bVal;
    });
  }

  // Apply limit
  const limitConstraint = constraints.find((c) => c.type === "limit");
  if (limitConstraint) {
    data = data.slice(0, limitConstraint.num);
  }

  return data;
}

// Keep track of registered snapshot listeners
const snapshotListeners: { [id: string]: { path: string; run: () => void } } = {};

function notifyCollectionListeners(path: string) {
  Object.keys(snapshotListeners).forEach((id) => {
    const listener = snapshotListeners[id];
    // Notify if paths match or is child path
    if (listener.path === path || listener.path.startsWith(path + "/")) {
      listener.run();
    }
  });
}

// --- Mock Exports matching Firebase APIs ---

export function query(collectionRef: any, ...constraints: any[]) {
  if (useRealFirebase) return realQuery(collectionRef, ...constraints);
  return new MockQuery(collectionRef, constraints);
}

export function where(field: string, operator: any, value: any) {
  if (useRealFirebase) return realWhere(field, operator, value);
  return { type: "where", field, operator, value };
}

export function orderBy(field: string, direction?: "asc" | "desc") {
  if (useRealFirebase) return realOrderBy(field, direction);
  return { type: "orderBy", field, direction: direction || "asc" };
}

export function limit(num: number) {
  if (useRealFirebase) return realLimit(num);
  return { type: "limit", num };
}

export function doc(...args: any[]) {
  if (useRealFirebase) return (realDoc as any)(...args);
  const pathSegments = args.slice(1);
  const colPath = pathSegments.slice(0, -1).join("/");
  const id = pathSegments[pathSegments.length - 1];
  return new MockDocRef(colPath, id) as any;
}

export function collection(...args: any[]) {
  if (useRealFirebase) return (realCollection as any)(...args);
  const pathSegments = args.slice(1);
  return new MockCollectionRef(pathSegments.join("/")) as any;
}

export async function getDoc(docRef: any) {
  if (useRealFirebase) return realGetDoc(docRef);
  const data = await fetchCollection(docRef.collectionPath);
  const docData = data.find((d: any) => d.id === docRef.id);
  return {
    exists: () => !!docData,
    id: docRef.id,
    data: () => docData || null,
  } as any;
}

export async function setDoc(docRef: any, payload: any, options?: any) {
  if (useRealFirebase) return realSetDoc(docRef, payload, options);
  return writeToMockCollection("set", docRef.collectionPath, docRef.id, payload, options?.merge);
}

export async function updateDoc(docRef: any, payload: any) {
  if (useRealFirebase) return realUpdateDoc(docRef, payload);
  return writeToMockCollection("update", docRef.collectionPath, docRef.id, payload);
}

export async function deleteDoc(docRef: any) {
  if (useRealFirebase) return realDeleteDoc(docRef);
  return writeToMockCollection("delete", docRef.collectionPath, docRef.id, null);
}

export async function addDoc(colRef: any, payload: any) {
  if (useRealFirebase) return realAddDoc(colRef, payload);
  return writeToMockCollection("add", colRef.path, null, payload) as any;
}

export function increment(value: number) {
  if (useRealFirebase) return realIncrement(value);
  return { _type: "increment", value } as any;
}

export function serverTimestamp() {
  if (useRealFirebase) return realServerTimestamp();
  return { _type: "timestamp" } as any;
}

export async function getDocs(target: any) {
  if (useRealFirebase) return realGetDocs(target);
  let path = target instanceof MockQuery ? target.collectionRef.path : target.path;
  await fetchCollection(path); // Update cache
  const docs = executeMockQuery(target);
  return {
    docs: docs.map((doc) => ({
      id: doc.id,
      data: () => doc,
    })),
    empty: docs.length === 0,
  } as any;
}

export function onSnapshot(
  target: any,
  onNext: (snap: any) => void,
  onError?: (err: any) => void
) {
  if (useRealFirebase) return realOnSnapshot(target, onNext, onError);

  const listenerId = Math.random().toString(36).substring(2, 15);
  let path = "";
  
  if (target instanceof MockDocRef) {
    path = target.collectionPath;
  } else {
    path = target instanceof MockQuery ? target.collectionRef.path : target.path;
  }

  let lastDataStr = "";

  const run = async () => {
    const data = await fetchCollection(path);
    
    if (target instanceof MockDocRef) {
      const docData = data.find((d: any) => d.id === target.id);
      const dataStr = JSON.stringify(docData || null);
      if (dataStr !== lastDataStr) {
        lastDataStr = dataStr;
        onNext({
          exists: () => !!docData,
          id: target.id,
          data: () => docData || null,
        });
      }
    } else {
      const docs = executeMockQuery(target);
      const dataStr = JSON.stringify(docs);
      if (dataStr !== lastDataStr) {
        lastDataStr = dataStr;
        onNext({
          docs: docs.map((doc) => ({
            id: doc.id,
            data: () => doc,
          })),
          empty: docs.length === 0,
        });
      }
    }
  };

  snapshotListeners[listenerId] = { path, run };
  run();

  // Poll server for changes every 1 second
  const intervalId = setInterval(run, 1000);

  return () => {
    delete snapshotListeners[listenerId];
    clearInterval(intervalId);
  };
}

// --- Auth Mock using localStorage and device fingerprinting ---
import { getDeviceFingerprint } from "./utils";

const authListeners: ((user: any) => void)[] = [];

export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  if (useRealFirebase) return realOnAuthStateChanged(authInstance, callback);
  authListeners.push(callback);
  
  // Read dynamically from localStorage on call
  let user = null;
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("mock_auth_user");
    if (saved) user = JSON.parse(saved);
  }
  
  setTimeout(() => callback(user), 0);
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

export async function signInAnonymously(authInstance: any) {
  if (useRealFirebase) return realSignInAnonymously(authInstance);
  
  let user: any = null;
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("mock_auth_user");
    if (saved) {
      user = JSON.parse(saved);
      authListeners.forEach((cb) => cb(user));
      return { user } as any;
    }
    
    // Check by device fingerprint before creating a new user
    try {
      const fp = getDeviceFingerprint();
      const users = await fetchCollection("users");
      const existingUser = users.find((u: any) => u.deviceFingerprint === fp);
      if (existingUser) {
        user = { uid: existingUser.id, isAnonymous: true };
        localStorage.setItem("mock_auth_user", JSON.stringify(user));
        authListeners.forEach((cb) => cb(user));
        return { user } as any;
      }
    } catch (err) {
      console.error("Fingerprint sign-in failed:", err);
    }
  }

  // Generate brand new user
  const uid = "mock_uid_" + Math.random().toString(36).substring(2, 10);
  const newUser = { uid, isAnonymous: true };
  if (typeof window !== "undefined") {
    localStorage.setItem("mock_auth_user", JSON.stringify(newUser));
  }
  authListeners.forEach((cb) => cb(newUser));
  return { user: newUser } as any;
}

