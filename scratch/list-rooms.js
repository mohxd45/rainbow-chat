const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

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

async function listRooms() {
  console.log("Fetching all documents from 'rooms' collection...");
  try {
    const querySnapshot = await getDocs(collection(db, "rooms"));
    console.log(`Total rooms found: ${querySnapshot.size}`);
    querySnapshot.forEach((doc) => {
      console.log(`Room Document ID: ${doc.id}`);
      console.log(`- Data:`, doc.data());
    });
  } catch (error) {
    console.error("Error listing rooms:", error);
  }
}

listRooms();
