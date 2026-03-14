/**
 * habits.js — Habit Tracker Logic for LifeOS
 * 
 * Handles:
 * - Loading habits from Firestore
 * - Adding new habits (with category)
 * - Toggling daily completion (no page reload)
 * - Streak calculation (current + longest)
 * - Weekly heatmap with color intensity
 * - Delete habit
 * - Streak overview stat cards
 */

import { db, auth } from "./firebase.js";
import {
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
    query, orderBy, Timestamp, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDateKey, getTodayKey, escapeHtml } from "./db.js";

let currentUser = null;
let allHabits = [];
let selectedCategory = "health";

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        initHabits(user);
    }
});

// ==========================================
// INIT
// ==========================================
async function initHabits(user) {
    initModal();
    initCategoryPills();
    await refreshAll(user);
}

async function refreshAll(user) {
    allHabits = await loadHabitsFromDB(user);
    renderStreakOverview(allHabits);
    renderWeeklyHeatmap(allHabits);
    renderHabitList(allHabits, user);
}

// ==========================================
// LOAD FROM FIRESTORE
// ==========================================
async function loadHabitsFromDB(user) {
    try {
        const q = query(
            collection(db, "users", user.uid, "habits"),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const habits = [];
        snap.forEach(d => habits.push({ id: d.id, ...d.data() }));
        return habits;
    } catch (err) {
        console.error("Error loading habits:", err);
        return [];
    }
}

// ==========================================
// STREAK CALCULATION
// ==========================================


function calcCurrentStreak(completedDates) {
    if (!completedDates?.length) return 0;
    const sorted = new Set(completedDates);
    const today = getTodayKey();
    let streak = 0;
    let d = new Date();

    // If today isn't done, start checking from yesterday
    if (!sorted.has(today)) {
        d.setDate(d.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
        if (sorted.has(getDateKey(d))) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function calcLongestStreak(completedDates) {
    if (!completedDates?.length) return 0;
    const sorted = [...completedDates].sort();
    let longest = 1;
    let current = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1] + "T00:00:00");
        const curr = new Date(sorted[i] + "T00:00:00");
        const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
            current++;
            if (current > longest) longest = current;
        } else if (diffDays > 1) {
            current = 1;
        }
    }
    return longest;
}

function streakFires(count) {
    if (count === 0) return '<span class="text-textMuted text-xs">No streak</span>';
    const fires = Math.min(count, 7);
    return '<span class="streak-fire">' + '🔥'.repeat(fires) + '</span>' +
        (count > 7 ? `<span class="text-xs text-textMuted ml-1">${count}d</span>` : '');
}

// ==========================================
// STREAK OVERVIEW CARDS
// ==========================================
function renderStreakOverview(habits) {
    const container = document.getElementById("streak-overview");
    if (!container) return;

    const today = getTodayKey();
    let bestCurrent = 0;
    let bestLongest = 0;
    let totalCompleted = 0;
    let totalPossible = 0;
    let completedToday = 0;

    habits.forEach(h => {
        const dates = h.completedDates || [];
        const cs = calcCurrentStreak(dates);
        const ls = calcLongestStreak(dates);
        if (cs > bestCurrent) bestCurrent = cs;
        if (ls > bestLongest) bestLongest = ls;
        totalCompleted += dates.length;
        if (dates.includes(today)) completedToday++;
    });

    totalPossible = habits.length;

    const stats = [
        { label: "Today's Progress", value: totalPossible > 0 ? `${completedToday}/${totalPossible}` : "—", icon: "✅", color: "green" },
        { label: "Best Current Streak", value: bestCurrent > 0 ? `${bestCurrent}d` : "—", icon: "🔥", color: "orange" },
        { label: "Longest Streak", value: bestLongest > 0 ? `${bestLongest}d` : "—", icon: "🏆", color: "yellow" },
        { label: "Total Completions", value: totalCompleted > 0 ? totalCompleted : "—", icon: "📊", color: "blue" }
    ];

    const colorMap = {
        green: "from-green-500/10 to-emerald-500/5 border-green-500/15",
        orange: "from-orange-500/10 to-amber-500/5 border-orange-500/15",
        yellow: "from-yellow-500/10 to-amber-500/5 border-yellow-500/15",
        blue: "from-blue-500/10 to-cyan-500/5 border-blue-500/15"
    };

    container.innerHTML = stats.map(s => `
        <div class="bg-gradient-to-br ${colorMap[s.color]} border rounded-2xl p-5 text-center glow-card">
            <p class="text-2xl mb-1.5">${s.icon}</p>
            <p class="text-2xl font-bold">${s.value}</p>
            <p class="text-textMuted text-xs mt-1">${s.label}</p>
        </div>
    `).join("");
}

// ==========================================
// WEEKLY HEATMAP
// ==========================================
function renderWeeklyHeatmap(habits) {
    const container = document.getElementById("weekly-heatmap");
    if (!container) return;

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();

    // Build array of last 7 days (Mon-Sun of current week)
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDays.push(d);
    }

    // Count habits completed per day
    const totalHabits = habits.length || 1;

    container.innerHTML = weekDays.map((day, i) => {
        const dk = getDateKey(day);
        let count = 0;
        habits.forEach(h => {
            if ((h.completedDates || []).includes(dk)) count++;
        });

        const isToday = dk === getTodayKey();
        const isFuture = day > today;
        const pct = count / totalHabits;

        let bg;
        if (isFuture) bg = "bg-border/30";
        else if (count === 0) bg = "bg-border/60";
        else if (pct <= 0.33) bg = ""; // use inline style
        else if (pct <= 0.66) bg = "";
        else bg = "";

        // Inline color for intensity
        let style = "";
        if (!isFuture && count > 0) {
            const alpha = 0.2 + pct * 0.8;
            style = `background: rgba(34, 197, 94, ${alpha.toFixed(2)})`;
        }

        return `
            <div class="flex flex-col items-center gap-2">
                <span class="text-[11px] ${isToday ? 'text-accent font-bold' : 'text-textMuted'}">${dayLabels[i]}</span>
                <div class="heat-cell ${bg} ${isToday ? 'ring-2 ring-accent/30' : ''} flex items-center justify-center text-xs font-medium"
                     style="${style}" title="${dk}: ${count}/${habits.length} habits">
                    ${count > 0 && !isFuture ? count : ''}
                </div>
            </div>
        `;
    }).join("");
}

// ==========================================
// HABIT LIST
// ==========================================
function renderHabitList(habits, user) {
    const list = document.getElementById("habits-list");
    const countEl = document.getElementById("habit-count");
    if (!list) return;

    if (countEl) countEl.textContent = habits.length > 0 ? `(${habits.length})` : "";

    if (habits.length === 0) {
        list.innerHTML = `
            <div class="text-center py-16 text-textMuted">
                <p class="text-5xl mb-4">🎯</p>
                <p class="font-semibold text-textSecondary mb-1">No habits yet</p>
                <p class="text-sm">Click "+ New Habit" to start building your routine.</p>
            </div>
        `;
        return;
    }

    const today = getTodayKey();
    const catIcons = { health: "💪", life: "🌱", study: "📚", work: "💼" };
    const catColors = {
        health: "text-green-400 bg-green-500/10 border-green-500/15",
        life: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
        study: "text-blue-400 bg-blue-500/10 border-blue-500/15",
        work: "text-yellow-400 bg-yellow-500/10 border-yellow-500/15"
    };

    list.innerHTML = habits.map((habit, i) => {
        const dates = habit.completedDates || [];
        const completedToday = dates.includes(today);
        const currentStreak = calcCurrentStreak(dates);
        const longestStreak = calcLongestStreak(dates);
        const cat = habit.category || "life";
        const icon = habit.icon || "📌";

        // Mini 7-day dots
        const miniDots = [];
        for (let j = 6; j >= 0; j--) {
            const d = new Date();
            d.setDate(d.getDate() - j);
            const dk = getDateKey(d);
            const done = dates.includes(dk);
            miniDots.push(`<div class="w-2 h-2 rounded-full ${done ? 'bg-accent' : 'bg-border'}" title="${dk}"></div>`);
        }

        return `
            <div class="habit-card bg-card border border-border rounded-2xl p-5 fade-up" style="animation-delay: ${i * 0.04}s">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <!-- Checkbox -->
                        <button class="habit-checkbox w-11 h-11 rounded-xl border-2 ${completedToday ? 'checked border-accent bg-accent' : 'border-border hover:border-accent'} flex items-center justify-center flex-shrink-0"
                            onclick="window._toggleHabit('${habit.id}')">
                        </button>

                        <!-- Info -->
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-lg">${icon}</span>
                                <p class="font-semibold text-sm ${completedToday ? 'line-through text-textMuted' : ''} truncate">${escapeHtml(habit.name)}</p>
                                <span class="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg border ${catColors[cat] || catColors.life}">${catIcons[cat] || "🌱"} ${cat}</span>
                            </div>
                            <div class="flex items-center gap-3 mt-1">
                                <span class="text-xs text-textMuted">${habit.frequency || 'daily'}</span>
                                <span class="text-textMuted/30">•</span>
                                ${currentStreak > 0 ? `<span class="text-xs">${streakFires(currentStreak)}</span>` : `<span class="text-xs text-textMuted">No streak</span>`}
                                ${longestStreak > 0 ? `<span class="text-textMuted/30">•</span><span class="text-xs text-textMuted">Best: ${longestStreak}d 🏆</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Right side: mini dots + delete -->
                    <div class="flex items-center gap-4 flex-shrink-0">
                        <div class="hidden sm:flex items-center gap-1">${miniDots.join("")}</div>
                        <button class="delete-btn w-8 h-8 rounded-lg flex items-center justify-center text-textMuted hover:text-red-400 hover:bg-red-500/10 transition text-xs"
                            onclick="window._deleteHabit('${habit.id}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// ==========================================
// TOGGLE HABIT COMPLETION
// ==========================================
window._toggleHabit = async function (habitId) {
    if (!currentUser) return;
    const today = getTodayKey();

    try {
        const habit = allHabits.find(h => h.id === habitId);
        if (!habit) return;

        const dates = habit.completedDates || [];
        const isDone = dates.includes(today);
        const ref = doc(db, "users", currentUser.uid, "habits", habitId);

        if (isDone) {
            await updateDoc(ref, { completedDates: arrayRemove(today) });
        } else {
            await updateDoc(ref, { completedDates: arrayUnion(today) });
        }

        // Refresh without page reload
        await refreshAll(currentUser);
    } catch (err) {
        console.error("Error toggling habit:", err);
    }
};

// ==========================================
// DELETE HABIT
// ==========================================
window._deleteHabit = async function (habitId) {
    if (!currentUser) return;
    if (!confirm("Delete this habit? This cannot be undone.")) return;

    try {
        await deleteDoc(doc(db, "users", currentUser.uid, "habits", habitId));
        await refreshAll(currentUser);
    } catch (err) {
        console.error("Error deleting habit:", err);
    }
};

// ==========================================
// ADD HABIT MODAL
// ==========================================
function initModal() {
    const openBtn = document.getElementById("add-habit-btn");
    const closeBtn = document.getElementById("close-habit-modal");
    const closeBtn2 = document.getElementById("close-habit-modal-2");
    const modal = document.getElementById("add-habit-modal");
    const form = document.getElementById("habit-form");

    function open() { modal?.classList.remove("hidden"); }
    function close() { modal?.classList.add("hidden"); }

    openBtn?.addEventListener("click", open);
    closeBtn?.addEventListener("click", close);
    closeBtn2?.addEventListener("click", close);
    modal?.addEventListener("click", (e) => { if (e.target === modal) close(); });

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const submitBtn = document.getElementById("habit-submit-btn");
            const name = document.getElementById("habit-name").value.trim();
            const icon = document.getElementById("habit-icon").value.trim() || "📌";
            const frequency = document.getElementById("habit-frequency").value;

            if (!name) return;

            submitBtn.textContent = "Saving...";
            submitBtn.disabled = true;

            try {
                await addDoc(collection(db, "users", currentUser.uid, "habits"), {
                    name,
                    icon,
                    category: selectedCategory,
                    frequency,
                    completedDates: [],
                    createdAt: Timestamp.now()
                });

                close();
                form.reset();
                selectedCategory = "health";
                document.querySelectorAll(".cat-pill").forEach(b => b.classList.remove("selected"));
                document.querySelector('[data-cat="health"]')?.classList.add("selected");

                await refreshAll(currentUser);
            } catch (err) {
                console.error("Error adding habit:", err);
                alert("Failed to save habit. Please check your connection.");
            } finally {
                submitBtn.textContent = "Save Habit";
                submitBtn.disabled = false;
                close(); // Ensure modal closes even on error to prevent being stuck
            }
        });
    }
}

// ==========================================
// CATEGORY PILLS
// ==========================================
function initCategoryPills() {
    document.querySelectorAll(".cat-pill").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".cat-pill").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedCategory = btn.dataset.cat;
        });
    });
}
