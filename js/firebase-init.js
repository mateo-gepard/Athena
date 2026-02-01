// Firebase Configuration and Initialization
// This must be loaded after Firebase SDK but before any modules that use Firebase

const firebaseConfig = {
  apiKey: "AIzaSyBR0ecmgOa-rUVEzWi2SiUXEuyfoLRJRPw",
  authDomain: "athena-1df6d.firebaseapp.com",
  databaseURL: "https://athena-1df6d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "athena-1df6d",
  storageBucket: "athena-1df6d.firebasestorage.app",
  messagingSenderId: "687796502304",
  appId: "1:687796502304:web:7097f4cd395af831b46145",
  measurementId: "G-E3WSL6SJ6T"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

console.log('✅ Firebase initialized');
