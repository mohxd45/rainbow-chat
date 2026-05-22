import { NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const dbFilePath = join(process.cwd(), "mock_db.json");

// In-memory database on the Next.js server, loaded from disk if available
const globalRef = global as any;
if (!globalRef.mockDatabase) {
  if (existsSync(dbFilePath)) {
    try {
      const fileData = readFileSync(dbFilePath, "utf-8");
      globalRef.mockDatabase = JSON.parse(fileData);
      console.log("Mock Firestore loaded from persistence:", dbFilePath);
    } catch (e) {
      console.error("Failed to load mock_db.json:", e);
      globalRef.mockDatabase = { collections: {} };
    }
  } else {
    globalRef.mockDatabase = {
      collections: {},
    };
  }
}
const db = globalRef.mockDatabase;

// Helper to save the database to disk synchronously to avoid race conditions
function saveDatabase() {
  try {
    writeFileSync(dbFilePath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save mock database:", e);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const data = db.collections[path] || [];
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, path, id, merge } = body;
    let data = body.data || {};

    if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

    // Sniff client IP address if writing a user document
    if (path === "users" && (action === "add" || action === "set" || action === "update")) {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const clientIp = forwardedFor 
        ? forwardedFor.split(",")[0].trim() 
        : (request.headers.get("x-real-ip") || "127.0.0.1");
      
      data.ipAddress = clientIp;
    }

    if (!db.collections[path]) {
      db.collections[path] = [];
    }
    const collection = db.collections[path];

    const resolvePayload = (payload: any, existing: any = {}) => {
      const resolved = { ...payload };
      Object.keys(resolved).forEach((key) => {
        const val = resolved[key];
        if (val && typeof val === "object") {
          if (val._type === "timestamp") {
            resolved[key] = new Date().toISOString();
          } else if (val._type === "increment") {
            resolved[key] = (existing[key] || 0) + val.value;
          }
        }
      });
      return resolved;
    };

    if (action === "add") {
      const docId = Math.random().toString(36).substring(2, 15);
      const newDoc = { ...resolvePayload(data), id: docId };
      collection.push(newDoc);
      saveDatabase();
      return NextResponse.json({ id: docId, path: `${path}/${docId}` });
    }

    if (action === "set") {
      if (!id) return NextResponse.json({ error: "Missing id for set" }, { status: 400 });
      const idx = collection.findIndex((d: any) => d.id === id);
      let newPayload = { ...data };
      if (merge && idx !== -1) {
        newPayload = { ...collection[idx], ...data };
      }
      const resolved = { ...resolvePayload(newPayload, idx !== -1 ? collection[idx] : {}), id };
      if (idx !== -1) {
        collection[idx] = resolved;
      } else {
        collection.push(resolved);
      }
      saveDatabase();
      return NextResponse.json(resolved);
    }

    if (action === "update") {
      if (!id) return NextResponse.json({ error: "Missing id for update" }, { status: 400 });
      const idx = collection.findIndex((d: any) => d.id === id);
      if (idx === -1) {
        const resolved = { ...resolvePayload(data), id };
        collection.push(resolved);
        saveDatabase();
        return NextResponse.json(resolved);
      }
      
      const docData = collection[idx];
      Object.keys(data).forEach((key) => {
        const val = data[key];
        if (val && typeof val === "object" && val._type === "increment") {
          docData[key] = (docData[key] || 0) + val.value;
        } else if (val && typeof val === "object" && val._type === "timestamp") {
          docData[key] = new Date().toISOString();
        } else {
          docData[key] = val;
        }
      });
      saveDatabase();
      return NextResponse.json(docData);
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ error: "Missing id for delete" }, { status: 400 });
      const idx = collection.findIndex((d: any) => d.id === id);
      if (idx !== -1) {
        collection.splice(idx, 1);
        saveDatabase();
        return NextResponse.json({ success: true, id });
      }
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
