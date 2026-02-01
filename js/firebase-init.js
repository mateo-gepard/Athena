// Firebase Configuration and Initialization
// This must be loaded after Firebase SDK but before any modules that use Firebase

const firebaseConfig = {
  apiKey: "AIzaSyBuEp1bvLIZdBlkPMb5rKOWgQFElmvE8Bw",
  authDomain: "athena-ultra-5cb84.firebaseapp.com",
  databaseURL: "https://athena-ultra-5cb84-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "athena-ultra-5cb84",
  storageBucket: "athena-ultra-5cb84.firebasestorage.app",
  messagingSenderId: "624163803330",
  appId: "1:624163803330:web:7e3f90c3eab42f2fc5cbed"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

console.log('✅ Firebase initialized');
