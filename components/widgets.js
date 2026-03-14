/**
 * widgets.js — Reusable Widget Components
 * 
 * Provides helper functions to create consistent UI widgets
 * used across multiple pages (stat cards, progress bars, etc.)
 */

// --- Stat Card ---
function createStatCard({ icon, label, value, color = "gray", trend = null }) {
    const trendHTML = trend
        ? `<span class="text-xs ${trend > 0 ? "text-green-400" : "text-red-400"} font-medium">
               ${trend > 0 ? "↑" : "↓"} ${Math.abs(trend)}%
           </span>`
        : "";

    return `
        <div class="bg-gray-900 border border-gray-800 rounded-2xl p-5 card-hover">
            <div class="flex items-center justify-between mb-3">
                <span class="text-2xl">${icon}</span>
                ${trendHTML}
            </div>
            <p class="text-2xl font-bold">${value}</p>
            <p class="text-gray-400 text-sm mt-1">${label}</p>
        </div>
    `;
}

// --- Progress Bar ---
function createProgressBar({ label, value, max, color = "#6366f1" }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return `
        <div>
            <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-300">${label}</span>
                <span class="text-gray-400">${pct}%</span>
            </div>
            <div class="category-bar">
                <div class="category-bar-fill" style="width: ${pct}%; background-color: ${color}"></div>
            </div>
        </div>
    `;
}

// --- Empty State ---
function createEmptyState({ icon = "📭", title, message, actionText = null, actionHref = null }) {
    return `
        <div class="text-center py-12 text-gray-500">
            <p class="text-4xl mb-3">${icon}</p>
            <p class="font-medium">${title}</p>
            <p class="text-sm mt-1">${message}</p>
            ${actionText && actionHref ? `<a href="${actionHref}" class="inline-block mt-4 px-5 py-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-sm font-medium hover:bg-indigo-500/30 transition">${actionText}</a>` : ""}
        </div>
    `;
}

// --- Toast Notification ---
function showToast(message, type = "success") {
    const colors = {
        success: "bg-green-500/10 border-green-500/20 text-green-400",
        error: "bg-red-500/10 border-red-500/20 text-red-400",
        info: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
    };

    const toast = document.createElement("div");
    toast.className = `fixed bottom-6 right-6 px-5 py-3 rounded-xl border ${colors[type]} text-sm font-medium shadow-2xl z-50 fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Make globally available ---
window.LifeOSWidgets = {
    createStatCard,
    createProgressBar,
    createEmptyState,
    showToast
};
