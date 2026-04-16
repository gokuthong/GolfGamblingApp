import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import {
  initializeAuth,
  getAuth,
  Auth,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD1W5WI_oTNLPfzpHt4g70EqcODP-0oY1E",
  authDomain: "golfgamblingapp.firebaseapp.com",
  projectId: "golfgamblingapp",
  storageBucket: "golfgamblingapp.firebasestorage.app",
  messagingSenderId: "80662036444",
  appId: "1:80662036444:web:23fbe203b61a4a0b92d919",
  measurementId: "G-L9CSN6K30P",
};

let app: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

// Initialize Firebase only once
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

firestore = getFirestore(app);

export { app, firestore, auth };
