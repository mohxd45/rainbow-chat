const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

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

async function testWrite() {
  console.log("Attempting to write to rooms collection without authentication...");
  try {
    const docRef = await addDoc(collection(db, "rooms"), {
      name: "Test Room",
      createdBy: "unauthenticated-test",
      createdAt: new Date(),
      type: "public",
      roomCode: "TEST"
    });
    console.log("Write SUCCEEDED! Document ID:", docRef.id);
    console.log("This indicates your Firestore security rules are open (public) or allowing unauthenticated writes.");
  } catch (error) {
    console.error("Write FAILED with error:", error);
  }
}

testWrite();
