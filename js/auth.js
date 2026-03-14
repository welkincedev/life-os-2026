/**
 * auth.js — Firebase Authentication Module
 * 
 * Handles:
 * - Email/password sign in & sign up
 * - Google sign in (popup)
 * - Auth state observer with redirect logic
 * - Sign out
 * - Updates UI with user info (avatar, name, email)
 * 
 * Loaded as type="module" in HTML.
 */

import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ============================
// AUTH STATE OBSERVER
// ============================
const publicPages = ["login.html"];
const path = window.location.pathname;
const currentPage = path.split("/").pop();
const isRoot = currentPage === "" || currentPage === "index.html" || path.endsWith("/");

onAuthStateChanged(auth, (user) => {
    const loader = document.getElementById("auth-loading");
    const loginContainer = document.getElementById("login-container");

    if (user) {
        // ✅ User is logged in
        console.log("✅ Logged in:", user.displayName || user.email);

        // Redirect away from login or index pages
        if (currentPage === "login.html" || isRoot) {
            window.location.href = "dashboard.html";
            return;
        }

        // Store user globally
        window.LifeOS = window.LifeOS || {};
        window.LifeOS.user = user;

        // Update UI elements with user info
        updateUserUI(user);

        // Hide loader on app pages
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => loader.style.display = "none", 300);
        }

    } else {
        // ❌ Not logged in
        if (currentPage === "login.html") {
            // Show the login form
            if (loader) {
                loader.style.opacity = "0";
                setTimeout(() => {
                    loader.style.display = "none";
                    if (loginContainer) loginContainer.style.display = "block";
                }, 300);
            } else if (loginContainer) {
                loginContainer.style.display = "block";
            }
        } else if (!publicPages.includes(currentPage) || isRoot) {
            // Redirect protected pages OR root to login
            window.location.href = "login.html";
            return;
        }
    }
});

// ============================
// UPDATE UI WITH USER INFO
// ============================
function updateUserUI(user) {
    const displayName = user.displayName || user.email?.split("@")[0] || "User";
    const initial = (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase();
    const photoURL = user.photoURL;

    // --- Greeting text ---
    const greetingEl = document.getElementById("greeting-text");
    if (greetingEl) {
        const hour = new Date().getHours();
        let greeting = "Good evening";
        if (hour < 12) greeting = "Good morning";
        else if (hour < 17) greeting = "Good afternoon";
        greetingEl.textContent = `${greeting}, ${displayName} 👋`;
    }

    // --- Navbar/Profile button (avatar) ---
    const profileBtn = document.getElementById("profile-btn");
    const userMenuBtn = document.getElementById("user-menu-btn"); // from navbar.js
    
    const updateAvatar = (btn) => {
        if (!btn) return;
        const avatarContainer = btn.querySelector("div");
        if (avatarContainer) {
            if (photoURL) {
                avatarContainer.innerHTML = `<img src="${photoURL}" alt="${displayName}" class="w-8 h-8 rounded-lg object-cover">`;
            } else {
                avatarContainer.textContent = initial;
            }
        }
    };

    updateAvatar(profileBtn);
    updateAvatar(userMenuBtn);

    // --- Profile dropdown name/email ---
    const nameEls = document.querySelectorAll("#profile-user-name, #nav-user-name");
    const emailEls = document.querySelectorAll("#profile-user-email, #nav-user-email");
    nameEls.forEach(el => el.textContent = displayName);
    emailEls.forEach(el => el.textContent = user.email || "");

    // --- Sidebar user section ---
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    const sidebarName = document.getElementById("sidebar-name");
    if (sidebarAvatar) {
        if (photoURL) {
            sidebarAvatar.innerHTML = `<img src="${photoURL}" alt="${displayName}" class="w-9 h-9 rounded-full object-cover">`;
        } else {
            sidebarAvatar.textContent = initial;
        }
    }
    if (sidebarName) sidebarName.textContent = displayName;
}

// ============================
// EMAIL / PASSWORD LOGIN
// ============================
const loginForm = document.getElementById("login-form");
if (loginForm) {
    let isSignupMode = false;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const errorEl = document.getElementById("auth-error");
        const submitBtn = loginForm.querySelector("button[type='submit']");

        // Loading state
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Please wait...";
        submitBtn.disabled = true;
        errorEl.classList.add("hidden");

        try {
            if (isSignupMode) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            // onAuthStateChanged will handle the redirect
        } catch (err) {
            errorEl.textContent = getErrorMessage(err.code);
            errorEl.classList.remove("hidden");
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // --- Toggle Sign Up / Sign In ---
    const toggleLink = document.getElementById("show-signup");
    const toggleText = document.getElementById("toggle-text");
    if (toggleLink) {
        toggleLink.addEventListener("click", (e) => {
            e.preventDefault();
            isSignupMode = !isSignupMode;

            const submitBtn = loginForm.querySelector("button[type='submit']");
            const heading = document.getElementById("login-heading");
            const subtext = document.getElementById("login-subtext");

            if (isSignupMode) {
                submitBtn.textContent = "Create Account";
                toggleLink.textContent = "Sign in instead";
                if (toggleText) toggleText.textContent = "Already have an account?";
                if (heading) heading.textContent = "Create your account";
                if (subtext) subtext.textContent = "Start your journey with LifeOS";
            } else {
                submitBtn.textContent = "Sign In";
                toggleLink.textContent = "Sign up";
                if (toggleText) toggleText.textContent = "Don't have an account?";
                if (heading) heading.textContent = "Welcome back";
                if (subtext) subtext.textContent = "Sign in to continue to your dashboard";
            }
        });
    }
}

// ============================
// GOOGLE SIGN IN
// ============================
const googleBtn = document.getElementById("google-login-btn");
if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
        const provider = new GoogleAuthProvider();
        const errorEl = document.getElementById("auth-error");

        // Loading state
        googleBtn.disabled = true;
        googleBtn.innerHTML = `
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
        `;

        try {
            await signInWithPopup(auth, provider);
            // onAuthStateChanged handles redirect
        } catch (err) {
            if (err.code !== "auth/popup-closed-by-user") {
                errorEl.textContent = getErrorMessage(err.code);
                errorEl.classList.remove("hidden");
            }
            // Restore button
            googleBtn.disabled = false;
            googleBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                Continue with Google
            `;
        }
    });
}

// ============================
// SIGN OUT (Global)
// ============================
window.lifeosSignOut = async () => {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (err) {
        console.error("Sign out error:", err);
    }
};

// ============================
// ERROR MESSAGE HELPER
// ============================
function getErrorMessage(code) {
    const messages = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Try again.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/popup-blocked": "Popup was blocked. Please allow popups for this site.",
        "auth/network-request-failed": "Network error. Check your connection.",
    };
    return messages[code] || `Something went wrong (${code}). Please try again.`;
}
