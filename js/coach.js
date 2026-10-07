/**
 * coach.js — LifeOS 2.0 Second Brain Life Supporter & Coach
 * 
 * Features:
 * 1. Analyzes real Firestore user data (Habits, Mood, Energy, Transactions, Journal)
 * 2. Calculates Dynamic Life Score (0–100) and updates Sidebar & Dashboard UI
 * 3. Provides intelligent real-life nudges & personalized recommendations
 * 4. Interactive 2nd Brain Coach Modal with actionable life advice protocols
 */

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { LifeOSDB, getTodayKey, generateDateKeys } from "./db.js";

let coachInitialized = false;

onAuthStateChanged(auth, async (user) => {
    if (user && !coachInitialized) {
        coachInitialized = true;
        await initSecondBrain(user);
    }
});

/**
 * Initialize 2nd Brain Supporter
 */
export async function initSecondBrain(user) {
    try {
        const [habits, recentLogs, transactions, journal] = await Promise.all([
            LifeOSDB.getHabits(),
            LifeOSDB.getRecentDailyLogs(14),
            LifeOSDB.getTransactions(),
            LifeOSDB.getJournalEntries(10)
        ]);

        const scoreData = calculateLifeScore({ habits, recentLogs, transactions, journal });
        updateSidebarLifeScore(scoreData);
        injectCoachWidget(scoreData, { habits, recentLogs, transactions, journal });

        console.log("🧠 2nd Brain Coach active. Life Score:", scoreData.score);
    } catch (err) {
        console.error("❌ 2nd Brain Coach init error:", err);
    }
}

/**
 * Calculate Dynamic Life Score (0–100)
 */
export function calculateLifeScore({ habits = [], recentLogs = [], transactions = [], journal = [] }) {
    const today = getTodayKey();
    const last7Days = generateDateKeys(7);

    // 1. Habit Score (35%)
    let habitScore = 0;
    if (habits.length > 0) {
        let totalCompletions7d = 0;
        habits.forEach(h => {
            const completed = (h.completedDates || []).filter(d => last7Days.includes(d)).length;
            totalCompletions7d += completed;
        });
        const possible = habits.length * 7;
        habitScore = Math.min(100, Math.round((totalCompletions7d / possible) * 100));
    } else {
        habitScore = 50; // Neutral baseline
    }

    // 2. Mood & Energy Balance (25%)
    let wellnessScore = 60;
    if (recentLogs.length > 0) {
        const moodValues = { happy: 100, neutral: 65, sad: 30 };
        const energyValues = { high: 100, medium: 70, low: 40 };

        let total = 0;
        let count = 0;
        recentLogs.slice(0, 7).forEach(log => {
            if (log.mood) { total += moodValues[log.mood] || 50; count++; }
            if (log.energy) { total += energyValues[log.energy] || 50; count++; }
        });
        if (count > 0) wellnessScore = Math.round(total / count);
    }

    // 3. Financial Health (25%)
    let financeScore = 70;
    if (transactions.length > 0) {
        let income = 0;
        let expenses = 0;
        transactions.forEach(t => {
            if (t.type === "income") income += t.amount;
            else expenses += t.amount;
        });
        if (income > 0) {
            const savingsRatio = Math.max(0, (income - expenses) / income);
            financeScore = Math.min(100, Math.round(savingsRatio * 100 + 40));
        } else if (expenses > 0) {
            financeScore = 50;
        }
    }

    // 4. Reflection & Mind Capture (15%)
    let reflectionScore = 40;
    if (journal.length > 0) {
        const recentEntries = journal.filter(e => {
            const dateStr = e.date || (e.createdAt?.toDate ? e.createdAt.toDate().toISOString().split("T")[0] : "");
            return last7Days.includes(dateStr);
        }).length;
        reflectionScore = Math.min(100, Math.round((recentEntries / 3) * 100));
    }

    // Overall Weighted Life Score
    const overallScore = Math.round(
        (habitScore * 0.35) +
        (wellnessScore * 0.25) +
        (financeScore * 0.25) +
        (reflectionScore * 0.15)
    );

    let statusLabel = "Balanced ⚖️";
    let statusColor = "#22c55e"; // Accent green

    if (overallScore >= 85) { statusLabel = "Thriving 🌱"; statusColor = "#22c55e"; }
    else if (overallScore >= 70) { statusLabel = "On Track ⚡"; statusColor = "#3b82f6"; }
    else if (overallScore >= 55) { statusLabel = "Steady ⚖️"; statusColor = "#eab308"; }
    else { statusLabel = "Needs Recharge 🔋"; statusColor = "#f97316"; }

    return {
        score: overallScore,
        statusLabel,
        statusColor,
        breakdown: {
            habits: habitScore,
            wellness: wellnessScore,
            finance: financeScore,
            reflection: reflectionScore
        }
    };
}

/**
 * Update Sidebar Life Score Card
 */
function updateSidebarLifeScore(scoreData) {
    const sidebarAside = document.getElementById("sidebar-aside");
    if (!sidebarAside) return;

    const scoreCard = sidebarAside.querySelector(".bg-gradient-to-br");
    if (scoreCard) {
        scoreCard.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-textMuted">Life Score</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background: ${scoreData.statusColor}20; color: ${scoreData.statusColor}">
                    ${scoreData.statusLabel}
                </span>
            </div>
            <div class="flex items-baseline justify-center gap-1 my-1">
                <span class="text-3xl font-black text-textPrimary">${scoreData.score}</span>
                <span class="text-textMuted text-xs font-medium">/ 100</span>
            </div>
            <div class="w-full bg-base/80 h-1.5 rounded-full overflow-hidden my-2">
                <div class="h-full rounded-full transition-all duration-500" style="width: ${scoreData.score}%; background: ${scoreData.statusColor}"></div>
            </div>
            <button onclick="window.openCoachModal()" class="w-full mt-2 py-1.5 rounded-lg bg-card border border-border/50 text-textSecondary hover:text-accent hover:border-accent/40 text-xs font-medium transition flex items-center justify-center gap-1">
                <span>🧠</span> Ask 2nd Brain Coach
            </button>
        `;
    }
}

/**
 * Generate Real-Life Insights & Nudges
 */
export function generateNudges({ habits = [], recentLogs = [], transactions = [], journal = [] }) {
    const nudges = [];
    const today = getTodayKey();
    const todayLog = recentLogs.find(l => (l.date || l.id) === today);

    // 1. Habit Nudge
    const completedToday = habits.filter(h => (h.completedDates || []).includes(today)).length;
    if (habits.length > 0) {
        if (completedToday === habits.length) {
            nudges.push({
                type: "success",
                icon: "🏆",
                title: "All Habits Crushed Today!",
                text: `You completed all ${habits.length} habits today. Incredible discipline!`
            });
        } else if (completedToday === 0) {
            nudges.push({
                type: "focus",
                icon: "🎯",
                title: "Habit Momentum",
                text: `You have ${habits.length} habits waiting. Start with the easiest one right now to build momentum.`
            });
        } else {
            nudges.push({
                type: "info",
                icon: "⚡",
                title: "Habit Progress",
                text: `You're at ${completedToday}/${habits.length} habits today. Finish strong!`
            });
        }
    }

    // 2. Wellness / Energy Nudge
    if (todayLog) {
        if (todayLog.energy === "low") {
            nudges.push({
                type: "warning",
                icon: "🔋",
                title: "Low Energy Detected",
                text: "Your energy is low today. Consider a 5-minute breathing session in Calm Zone or a quick walk."
            });
        } else if (todayLog.mood === "happy" && todayLog.energy === "high") {
            nudges.push({
                type: "success",
                icon: "🌟",
                title: "Peak State!",
                text: "You're feeling happy & high energy. Perfect time to tackle your most important task."
            });
        }
    } else {
        nudges.push({
            type: "action",
            icon: "📝",
            title: "Daily Check-in Pending",
            text: "Take 30 seconds to log your mood & energy in your dashboard."
        });
    }

    // 3. Financial Nudge
    if (transactions.length > 0) {
        const todayTxns = transactions.filter(t => t.date === today);
        const spentToday = todayTxns.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
        if (spentToday > 0) {
            nudges.push({
                type: "finance",
                icon: "💸",
                title: "Money Tracked",
                text: `₹${spentToday.toLocaleString()} spent today. Great job keeping your logs up to date!`
            });
        }
    }

    // 4. Mind & Journal Nudge
    if (journal.length === 0) {
        nudges.push({
            type: "mind",
            icon: "💡",
            title: "Clear Your Brain",
            text: "Write your first daily reflection or idea in the Journal to declutter your mental space."
        });
    }

    return nudges;
}

/**
 * Inject Coach UI Widgets & Modal into DOM
 */
function injectCoachWidget(scoreData, userData) {
    if (document.getElementById("second-brain-modal")) return;

    const nudges = generateNudges(userData);

    // Create Floating 2nd Brain Button
    const floatBtn = document.createElement("button");
    floatBtn.id = "second-brain-float-btn";
    floatBtn.className = "fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-accent to-emerald-600 text-base font-semibold shadow-xl shadow-accent/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20";
    floatBtn.innerHTML = `
        <span class="text-xl">🧠</span>
        <span class="text-xs tracking-wide">2nd Brain</span>
    `;
    floatBtn.onclick = () => window.openCoachModal();
    document.body.appendChild(floatBtn);

    // Create 2nd Brain Coach Modal
    const modalHTML = `
        <div id="second-brain-modal" class="fixed inset-0 z-[70] bg-base/80 backdrop-blur-md flex items-center justify-center p-4 hidden">
            <div class="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-3xl p-6 md:p-8 overflow-hidden max-h-[90vh] flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between pb-4 border-b border-border/50">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-xl">
                            🧠
                        </div>
                        <div>
                            <h2 class="text-lg font-bold text-textPrimary tracking-tight">2nd Brain Life Coach</h2>
                            <p class="text-xs text-textMuted">Your personal life supporter & intelligence hub</p>
                        </div>
                    </div>
                    <button onclick="window.closeCoachModal()" class="w-8 h-8 rounded-xl bg-base border border-border flex items-center justify-center text-textMuted hover:text-textPrimary transition">✕</button>
                </div>

                <!-- Content Body -->
                <div class="flex-1 overflow-y-auto py-6 space-y-6">

                    <!-- Life Score Banner -->
                    <div class="glow-card bg-gradient-to-br from-accent/10 via-card to-card border border-accent/20 rounded-2xl p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <p class="text-xs text-textMuted font-medium uppercase tracking-wider">Overall Life Balance</p>
                                <p class="text-2xl font-black text-accent mt-0.5">${scoreData.score} <span class="text-sm font-semibold text-textSecondary">/ 100</span> — ${scoreData.statusLabel}</p>
                            </div>
                            <div class="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center font-bold text-accent">
                                ${scoreData.score}%
                            </div>
                        </div>

                        <!-- Score breakdown bars -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border/30">
                            <div>
                                <span class="text-[10px] text-textMuted block mb-1">Habits (${scoreData.breakdown.habits}%)</span>
                                <div class="w-full bg-base h-1.5 rounded-full overflow-hidden">
                                    <div class="h-full bg-accent rounded-full" style="width: ${scoreData.breakdown.habits}%"></div>
                                </div>
                            </div>
                            <div>
                                <span class="text-[10px] text-textMuted block mb-1">Wellness (${scoreData.breakdown.wellness}%)</span>
                                <div class="w-full bg-base h-1.5 rounded-full overflow-hidden">
                                    <div class="h-full bg-blue-400 rounded-full" style="width: ${scoreData.breakdown.wellness}%"></div>
                                </div>
                            </div>
                            <div>
                                <span class="text-[10px] text-textMuted block mb-1">Finance (${scoreData.breakdown.finance}%)</span>
                                <div class="w-full bg-base h-1.5 rounded-full overflow-hidden">
                                    <div class="h-full bg-emerald-400 rounded-full" style="width: ${scoreData.breakdown.finance}%"></div>
                                </div>
                            </div>
                            <div>
                                <span class="text-[10px] text-textMuted block mb-1">Reflection (${scoreData.breakdown.reflection}%)</span>
                                <div class="w-full bg-base h-1.5 rounded-full overflow-hidden">
                                    <div class="h-full bg-purple-400 rounded-full" style="width: ${scoreData.breakdown.reflection}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Personalized Nudges Section -->
                    <div>
                        <h3 class="text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">Real-Time Insights & Nudges</h3>
                        <div class="space-y-3">
                            ${nudges.map(n => `
                                <div class="flex items-start gap-3.5 p-4 rounded-2xl bg-base/60 border border-border/40 hover:border-border/80 transition">
                                    <span class="text-2xl mt-0.5">${n.icon}</span>
                                    <div>
                                        <h4 class="text-sm font-semibold text-textPrimary">${n.title}</h4>
                                        <p class="text-xs text-textSecondary mt-0.5 leading-relaxed">${n.text}</p>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    </div>

                    <!-- Quick Protocols / Actions -->
                    <div>
                        <h3 class="text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">2nd Brain Smart Actions</h3>
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="window.location.href='habits.html'" class="p-4 rounded-2xl bg-base border border-border/40 hover:border-accent/50 text-left transition group">
                                <span class="text-xl block mb-2 group-hover:scale-110 transition-transform">⚡</span>
                                <p class="text-sm font-semibold">Build Habit Momentum</p>
                                <p class="text-[11px] text-textMuted mt-0.5">Check off habits & build streaks</p>
                            </button>
                            <button onclick="window.location.href='calm.html'" class="p-4 rounded-2xl bg-base border border-border/40 hover:border-accent/50 text-left transition group">
                                <span class="text-xl block mb-2 group-hover:scale-110 transition-transform">🧘</span>
                                <p class="text-sm font-semibold">Stress Relief Protocol</p>
                                <p class="text-[11px] text-textMuted mt-0.5">5-min breathing & ambient sound</p>
                            </button>
                            <button onclick="window.location.href='journal.html'" class="p-4 rounded-2xl bg-base border border-border/40 hover:border-accent/50 text-left transition group">
                                <span class="text-xl block mb-2 group-hover:scale-110 transition-transform">📝</span>
                                <p class="text-sm font-semibold">Brain Dump</p>
                                <p class="text-[11px] text-textMuted mt-0.5">Clear thoughts into Journal</p>
                            </button>
                            <button onclick="window.location.href='money.html'" class="p-4 rounded-2xl bg-base border border-border/40 hover:border-accent/50 text-left transition group">
                                <span class="text-xl block mb-2 group-hover:scale-110 transition-transform">💰</span>
                                <p class="text-sm font-semibold">Financial Control</p>
                                <p class="text-[11px] text-textMuted mt-0.5">Review spending & budgets</p>
                            </button>
                        </div>
                    </div>

                </div>

                <!-- Footer -->
                <div class="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-textMuted">
                    <span>LifeOS 2.0 Second Brain Engine</span>
                    <button onclick="window.closeCoachModal()" class="px-4 py-2 rounded-xl bg-accent text-base font-semibold hover:bg-accent/90 transition">Got it 👍</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    window.openCoachModal = () => {
        document.getElementById("second-brain-modal")?.classList.remove("hidden");
    };

    window.closeCoachModal = () => {
        document.getElementById("second-brain-modal")?.classList.add("hidden");
    };
}
