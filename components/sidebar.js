/**
 * sidebar.js — Sidebar Navigation Component
 */

const sidebarContainer = document.getElementById("sidebar-container");
if (sidebarContainer) {
    const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";

    const links = [
        { href: "dashboard.html", icon: "🏠", label: "Dashboard" },
        { href: "habits.html", icon: "✅", label: "Habits" },
        { href: "journal.html", icon: "📝", label: "Journal" },
        { href: "money.html", icon: "💰", label: "Money" },
        { href: "calm.html", icon: "🎵", label: "Calm Zone" },
        { href: "insights.html", icon: "📊", label: "Insights" },
    ];

    sidebarContainer.innerHTML = `
        <aside id="sidebar-aside" class="sidebar-container fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border/50 z-30 overflow-y-auto transition-all duration-300">
            <nav class="p-4 space-y-1 mt-2">
                ${links.map(link => {
                    const isActive = currentPage === link.href;
                    return `
                        <a href="${link.href}"
                            class="sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
                            ${isActive
                                ? "active bg-accent/10 text-accent border-l-[3px] border-accent"
                                : "text-textSecondary hover:text-textPrimary hover:bg-cardHover border-l-[3px] border-transparent"
                            }">
                            <span class="text-lg">${link.icon}</span>
                            ${link.label}
                        </a>
                    `;
                }).join("")}
            </nav>

            <!-- Bottom Section -->
            <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
                <div class="bg-gradient-to-br from-accent/10 to-indigo-500/10 border border-accent/20 rounded-xl p-4 text-center">
                    <p class="text-sm font-medium text-textSecondary mb-1">Life Score</p>
                    <p class="text-2xl font-black text-accent">—</p>
                    <p class="text-xs text-textMuted mt-1">Start tracking to see</p>
                </div>
            </div>
        </aside>
    `;
}
