/**
 * navbar.js — Top Navigation Bar Component
 * 
 * Injects a consistent navigation bar across all pages.
 * Includes: logo, page title, user avatar, sign-out button, mobile menu toggle.
 */

(function () {
    const container = document.getElementById("navbar-container");
    if (!container) return;

    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    const pageTitles = {
        "dashboard.html": "Dashboard",
        "habits.html": "Habits",
        "journal.html": "Journal",
        "money.html": "Money",
        "calm.html": "Calm Zone",
        "insights.html": "Insights"
    };

    container.innerHTML = `
        <nav class="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/50">
            <div class="flex items-center justify-between px-6 py-3">
                <!-- Left: Menu toggle + Logo -->
                <div class="flex items-center gap-4">
                    <button id="menu-toggle" class="md:hidden text-gray-400 hover:text-white text-xl">
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
                    <!-- Weather (compact, populated by weather.js) -->
                    <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-sm">
                        <span class="weather-icon text-base">🌡️</span>
                        <span id="nav-weather-text" class="text-gray-400 text-xs font-medium">Loading...</span>
                    </div>

                    <!-- Search (placeholder) -->
                    <button class="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-base border border-border/40 text-textMuted text-sm hover:border-accent/40 transition">
                        🔍 Search...
                        <kbd class="text-[10px] bg-card border border-border px-1.5 py-0.5 rounded ml-2">⌘K</kbd>
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
                        <div id="profile-dropdown" class="profile-dropdown absolute right-0 top-12 bg-card border border-border rounded-xl shadow-2xl p-2 min-w-[200px] z-50">
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
        </nav>
    `;

    // --- Global Click Listeners for Dropdowns ---
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

    // Mobile sidebar toggle
    const menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            const sidebar = document.querySelector(".sidebar-container");
            if (sidebar) sidebar.classList.toggle("open");
        });
    }

    // Set user initial from auth
    if (window.lifeosUser) {
        const initial = window.lifeosUser.displayName?.[0] || window.lifeosUser.email?.[0] || "?";
        document.getElementById("user-menu-btn").textContent = initial.toUpperCase();
        document.getElementById("user-display-name").textContent = window.lifeosUser.displayName || window.lifeosUser.email || "User";
    }
})();
