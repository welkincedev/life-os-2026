/**
 * firebase.js — Firebase Configuration & Initialization
 * 
 * Initializes Firebase app with project credentials.
 * Exposes auth & db on window.LifeOS for use across all pages.
 * Loaded as type="module" in HTML.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔑 Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAB5tykpO1JAnMZEXb1Mv9_gKTQNGegjQ0",
    authDomain: "lifeos2026-f4af9.firebaseapp.com",
    projectId: "lifeos2026-f4af9",
    storageBucket: "lifeos2026-f4af9.firebasestorage.app",
    messagingSenderId: "601136076575",
    appId: "1:601136076575:web:f06ae8e19201486c6c822a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set session persistence to LOCAL (survives browser restart)
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Persistence error:", err);
});

// Expose globally for non-module scripts
window.LifeOS = { app, auth, db };

// Export for ES module scripts
export { app, auth, db };
