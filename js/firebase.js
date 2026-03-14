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
    apiKey: "AIzaSyACim10-pTh8fGb0kxioW_vnytdmSVqXbA",
    authDomain: "lifeos-2026-9aa0a.firebaseapp.com",
    projectId: "lifeos-2026-9aa0a",
    storageBucket: "lifeos-2026-9aa0a.firebasestorage.app",
    messagingSenderId: "1016084626405",
    appId: "1:1016084626405:web:dd46e685b791eddd104d0c"
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
