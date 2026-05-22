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

async function checkRooms() {
  console.log("Querying Firestore rooms collection...");
  try {
    const querySnapshot = await getDocs(collection(db, "rooms"));
    console.log(`Successfully fetched ${querySnapshot.size} rooms.`);
    querySnapshot.forEach((doc) => {
      console.log(`ID: ${doc.id} | Name: "${doc.data().name}" | Code: ${doc.data().roomCode} | Type: ${doc.data().type} | Active: ${doc.data().isActive}`);
    });
  } catch (error) {
    console.error("Error querying Firestore:", error);
  }
}

checkRooms();
