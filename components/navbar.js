/**
 * navbar.js — Top Navigation Bar Component (ES Module)
 */

import { LifeOSDB as db, escapeHtml } from "../js/db.js";
import { auth } from "../js/firebase.js";

const navContainer = document.getElementById("navbar-container");

if (navContainer) {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const pageTitles = {
        "dashboard.html": "Dashboard",
        "habits.html": "Habits",
        "journal.html": "Journal",
        "money.html": "Money",
        "calm.html": "Calm Zone",
        "insights.html": "Insights"
    };

    navContainer.innerHTML = `
        <nav class="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
            <div class="flex items-center justify-between px-6 py-3">
                <!-- Left: Menu toggle + Logo -->
                <div class="flex items-center gap-4">
                    <button id="menu-toggle" class="lg:hidden text-gray-400 hover:text-white text-xl">
                        ☰
                    </button>
                    <a href="dashboard.html" class="flex items-center gap-2">
                        <span class="text-xl">🧬</span>
                        <span class="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            LifeOS
                        </span>
                    </a>
                    <span class="hidden sm:inline text-gray-600 text-sm">/ ${pageTitles[currentPage] || ""}</span>
                </div>

                <!-- Right: Actions -->
                <div class="flex items-center gap-4">
                    <!-- Weather (compact) -->
                    <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-sm">
                        <span class="weather-icon text-base">🌡️</span>
                        <span id="nav-weather-text" class="text-gray-400 text-xs font-medium">Loading...</span>
                    </div>

                    <!-- Search (desktop) -->
                    <div class="relative hidden md:block">
                        <button onclick="toggleSearch()" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-base border border-border/40 text-textMuted text-sm hover:border-accent/40 transition group">
                            <span class="group-hover:scale-110 transition-transform">🔍</span> 
                            <span>Search...</span>
                            <kbd class="text-[10px] bg-card border border-border px-1.5 py-0.5 rounded ml-2 group-hover:bg-border transition">⌘K</kbd>
                        </button>
                    </div>

                    <!-- Search (mobile) -->
                    <button onclick="toggleSearch()" class="md:hidden w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center text-textSecondary hover:text-textPrimary transition">
                        🔍
                    </button>

                    <!-- Notifications -->
                    <div class="relative">
                        <button class="w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center text-textSecondary hover:text-textPrimary hover:border-border transition" onclick="toggleNotifications()">
                            🔔
                        </button>
                        <div id="notif-dropdown" class="absolute top-12 right-0 w-80 bg-card border border-border shadow-2xl rounded-2xl p-4 hidden z-50 overflow-hidden">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="font-bold text-sm">Notifications</h3>
                                <button class="text-[10px] text-accent font-semibold uppercase tracking-wider">Mark all as read</button>
                            </div>
                            <div class="p-3 rounded-xl bg-base border border-border/40 text-center py-6">
                                <p class="text-2xl mb-2">🎈</p>
                                <p class="text-textSecondary text-xs">All caught up!</p>
                            </div>
                        </div>
                    </div>

                    <!-- User Avatar -->
                    <div class="relative group">
                        <button id="user-menu-btn" class="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center text-sm font-bold text-base shadow-lg transition active:scale-95" onclick="toggleProfileDropdown()">
                            ?
                        </button>
                        <div id="profile-dropdown" class="profile-dropdown absolute right-0 top-12 bg-card border border-border rounded-xl shadow-2xl p-2 min-w-[200px] hidden z-50">
                            <div class="px-3 py-2.5 border-b border-border/30 mb-1">
                                <p id="profile-user-name" class="text-sm font-semibold">User</p>
                                <p id="profile-user-email" class="text-[11px] text-textMuted">loading...</p>
                            </div>
                            <a href="dashboard.html" class="block px-3 py-2 text-sm text-textSecondary hover:text-textPrimary hover:bg-white/[0.04] rounded-lg transition">🏠 Dashboard</a>
                            <a href="insights.html" class="block px-3 py-2 text-sm text-textSecondary hover:text-textPrimary hover:bg-white/[0.04] rounded-lg transition">📊 Insights</a>
                            <button onclick="window.lifeosSignOut()" class="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.04] rounded-lg transition mt-1">🚪 Sign Out</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Search Modal -->
            <div id="search-modal" class="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4 hidden">
                <div class="absolute inset-0 bg-base/80 backdrop-blur-sm" onclick="toggleSearch()"></div>
                <div class="relative w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden fade-up">
                    <div class="p-4 border-b border-border/50 flex items-center gap-3">
                        <span class="text-xl">🔍</span>
                        <input id="search-input" type="text" placeholder="Search habits, journal, transactions..." 
                            class="w-full bg-transparent border-none outline-none text-textPrimary placeholder:text-textMuted py-2"
                            oninput="performSearch(this.value)">
                        <kbd class="text-[10px] text-textMuted border border-border rounded px-1.5 py-0.5">ESC</kbd>
                    </div>
                    <div id="search-results" class="max-h-[400px] overflow-y-auto p-2">
                        <div class="p-8 text-center text-textMuted">
                            <p class="text-sm">Type anything to search across LifeOS...</p>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    `;

    // --- Global Click Listeners ---
    window.toggleProfileDropdown = () => document.getElementById('profile-dropdown')?.classList.toggle('hidden');
    window.toggleNotifications = () => document.getElementById('notif-dropdown')?.classList.toggle('hidden');

    document.addEventListener("click", (e) => {
        const profileBtn = document.getElementById("user-menu-btn");
        const profileDd = document.getElementById("profile-dropdown");
        const notifBtn = document.querySelector('[onclick="toggleNotifications()"]');
        const notifDd = document.getElementById("notif-dropdown");

        if (profileBtn && profileDd && !profileBtn.contains(e.target) && !profileDd.contains(e.target)) {
            profileDd.classList.add("hidden");
        }
        if (notifBtn && notifDd && !notifBtn.contains(e.target) && !notifDd.contains(e.target)) {
            notifDd.classList.add("hidden");
        }
    });

    // --- Search Logic ---
    window.toggleSearch = () => {
        const modal = document.getElementById('search-modal');
        if (!modal) return;
        const isHidden = modal.classList.toggle('hidden');
        if (!isHidden) {
            const input = document.getElementById('search-input');
            setTimeout(() => input?.focus(), 100);
        }
    };

    window.performSearch = async (query) => {
        const resultsEl = document.getElementById('search-results');
        if (!resultsEl) return;
        if (!query || query.length < 2) {
            resultsEl.innerHTML = `<div class="p-8 text-center text-textMuted text-sm">Type at least 2 characters to search...</div>`;
            return;
        }

        const dbRef = window.LifeOSDB;
        if (!dbRef) return;

        resultsEl.innerHTML = `<div class="p-8 text-center text-textMuted animate-pulse text-sm">Searching...</div>`;

        try {
            const [habits, journal, transactions] = await Promise.all([
                db.getHabits(),
                db.getJournalEntries(50),
                db.getTransactions()
            ]);

            const q = query.toLowerCase();
            const results = [];

            habits.forEach(h => {
                if (h.name.toLowerCase().includes(q)) {
                    results.push({ type: 'habit', title: h.name, subtitle: `${h.frequency} habit`, icon: h.icon || '✅', link: 'habits.html' });
                }
            });

            journal.forEach(e => {
                if (e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)) {
                    results.push({ type: 'journal', title: e.title, subtitle: e.content.substring(0, 60) + '...', icon: '📝', link: 'journal.html' });
                }
            });

            transactions.forEach(t => {
                const note = (t.note || t.description || "").toLowerCase();
                if (note.includes(q) || t.category.toLowerCase().includes(q)) {
                    results.push({ type: 'money', title: t.note || t.category, subtitle: `₹${t.amount.toLocaleString()} • ${t.date}`, icon: t.type === 'income' ? '💰' : '💸', link: 'money.html' });
                }
            });

            if (results.length === 0) {
                resultsEl.innerHTML = `<div class="p-8 text-center text-textMuted text-sm">No results found for "${query}"</div>`;
                return;
            }

            resultsEl.innerHTML = results.map(r => `
                <a href="${r.link}" class="flex items-center gap-4 p-3 rounded-xl hover:bg-cardHover border border-transparent hover:border-border/30 transition group mb-1">
                    <div class="w-10 h-10 rounded-xl bg-base border border-border/50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                        ${r.icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-textPrimary truncate">${escapeHtml(r.title)}</p>
                        <p class="text-[11px] text-textMuted truncate">${escapeHtml(r.subtitle)}</p>
                    </div>
                </a>
            `).join("");

        } catch (err) {
            console.error("Search failed:", err);
            resultsEl.innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Oops! Something went wrong while searching.</div>`;
        }
    };

    // Shortcut: Cmd/Ctrl + K
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            toggleSearch();
        }
        if (e.key === 'Escape') {
            const modal = document.getElementById('search-modal');
            if (modal && !modal.classList.contains('hidden')) modal.classList.add('hidden');
        }
    });

    // Mobile sidebar toggle
    const menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) {
        menuToggle.onclick = () => {
            const sidebarAside = document.getElementById("sidebar-aside");
            if (sidebarAside) {
                sidebarAside.classList.toggle("open");
            }
        };
    }

    // Set user initial/profile from global state
    const user = window.LifeOS?.user;
    if (user) {
        const initial = user.displayName?.[0] || user.email?.[0] || "?";
        const btn = document.getElementById("user-menu-btn");
        if (btn) btn.textContent = initial.toUpperCase();
        
        const nameEl = document.getElementById("profile-user-name");
        if (nameEl) nameEl.textContent = user.displayName || user.email?.split('@')[0] || "User";
        
        const emailEl = document.getElementById("profile-user-email");
        if (emailEl) emailEl.textContent = user.email || "";
    }

    // Refresh weather display in the new navbar
    if (typeof window.refreshWeatherUI === "function") {
        window.refreshWeatherUI();
    }
}
