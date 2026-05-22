const { initializeApp } = require("firebase/app");
const { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyAPxXmfA0efnrAKOWLP5WGsz8rrvZd-aGo",
  authDomain: "rainbow-room-fda2a.firebaseapp.com",
  projectId: "rainbow-room-fda2a",
  storageBucket: "rainbow-room-fda2a.firebasestorage.app",
  messagingSenderId: "100894259037",
  appId: "1:100894259037:web:ed73f44291126d3c5edab4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testUid = "test_user_id_" + Math.random().toString(36).substring(2, 10);
const ref = doc(db, "users", testUid);

console.log("Subscribing to user doc:", testUid);

const unsub = onSnapshot(ref, (snap) => {
  console.log("Snapshot received! Exists:", snap.exists());
  if (!snap.exists()) {
    console.log("Writing test user document...");
    setDoc(ref, {
      anonymousName: "TestUser",
      avatar: "🤖",
      createdAt: new Date(),
      banned: false
    }).then(() => {
      console.log("Write complete.");
    }).catch((err) => {
      console.error("Write failed:", err);
    });
  } else {
    console.log("User data:", snap.data());
    console.log("Test passed! Exiting...");
    unsub();
    process.exit(0);
  }
}, (err) => {
  console.error("Subscription error:", err);
  process.exit(1);
});

// Set a timeout of 10 seconds to detect if it hangs
setTimeout(() => {
  console.log("HUNG: Subscription timed out after 10 seconds without any response.");
  unsub();
  process.exit(1);
}, 10000);
