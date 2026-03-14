/**
 * insights.js — Insights Page Logic
 * 
 * Fetches daily logs and habits from Firestore to render:
 * - Habit heatmap (CSS grid)
 * - Mood trend (Chart.js line)
 * - Energy trend (Chart.js line)
 * - Life balance wheel (Chart.js radar)
 * - Overview stat cards
 */

import { db, auth } from "./firebase.js";
import {
    collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getHabits, getRecentDailyLogs, generateDateKeys } from "./db.js";

let moodChartInstance = null;
let energyChartInstance = null;
let balanceChartInstance = null;
let currentRange = 7;

onAuthStateChanged(auth, (user) => {
    if (user) {
        initRangeButtons(user);
        loadInsights(user, currentRange);
    }
});

// ==========================================
// RANGE SELECTOR
// ==========================================
function initRangeButtons(user) {
    document.querySelectorAll(".range-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".range-btn").forEach(b => {
                b.classList.remove("active-range");
                b.classList.add("text-textMuted");
            });
            btn.classList.add("active-range");
            btn.classList.remove("text-textMuted");
            currentRange = parseInt(btn.dataset.range);
            loadInsights(user, currentRange);
        });
    });
}

// ==========================================
// MAIN LOADER
// ==========================================
async function loadInsights(user, days) {
    try {
        const [logs, habits] = await Promise.all([
            getRecentDailyLogs(90),
            getHabits()
        ]);

        // Generate date keys for the range
        const dateKeys = generateDateKeys(days);

        // Map logs by date for quick lookup
        const logsByDate = {};
        logs.forEach(log => { logsByDate[log.date || log.id] = log; });

        // Build data arrays
        const moodData = [];
        const energyData = [];
        const labels = [];
        let totalMood = 0, moodCount = 0;
        let totalEnergy = 0, energyCount = 0;
        let habitsCompletedCount = 0;
        let daysLogged = 0;

        const moodMap = { happy: 3, neutral: 2, sad: 1 };
        const energyMap = { high: 3, medium: 2, low: 1 };

        dateKeys.forEach(dateKey => {
            const log = logsByDate[dateKey];
            const d = new Date(dateKey + "T00:00:00");
            labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));

            if (log) {
                daysLogged++;
                const mv = moodMap[log.mood] || null;
                const ev = energyMap[log.energy] || null;
                moodData.push(mv);
                energyData.push(ev);
                if (mv) { totalMood += mv; moodCount++; }
                if (ev) { totalEnergy += ev; energyCount++; }
                habitsCompletedCount += (log.habitsCompleted?.length || 0);
            } else {
                moodData.push(null);
                energyData.push(null);
            }
        });

        // --- Update stat cards ---
        const avgMoodVal = moodCount > 0 ? totalMood / moodCount : 0;
        const avgEnergyVal = energyCount > 0 ? totalEnergy / energyCount : 0;
        const moodEmojis = { 3: "😊 Happy", 2: "😐 Neutral", 1: "😞 Sad" };
        const energyLabels = { 3: "⚡ High", 2: "🔋 Medium", 1: "🪫 Low" };

        setEl("stat-mood", avgMoodVal > 0 ? moodEmojis[Math.round(avgMoodVal)] || "—" : "—");
        setEl("stat-energy", avgEnergyVal > 0 ? energyLabels[Math.round(avgEnergyVal)] || "—" : "—");
        setEl("stat-habits", habitsCompletedCount > 0 ? `${habitsCompletedCount}` : "—");
        setEl("stat-logged", daysLogged > 0 ? `${daysLogged} / ${days}` : "—");

        // --- Render charts ---
        renderHeatmap(dateKeys, logsByDate, habits);
        renderMoodChart(labels, moodData);
        renderEnergyChart(labels, energyData);
        renderBalanceWheel(avgMoodVal, avgEnergyVal, habitsCompletedCount, daysLogged, days);

    } catch (err) {
        console.error("Error loading insights:", err);
    }
}

// ==========================================
// FETCH DATA
// ==========================================


// ==========================================
// HABIT HEATMAP
// ==========================================
function renderHeatmap(dateKeys, logsByDate, habits) {
    const container = document.getElementById("habit-heatmap");
    if (!container) return;

    // Count how many habits completed each day
    // Also count from habits' completedDates arrays
    const habitsPerDay = {};
    dateKeys.forEach(dk => { habitsPerDay[dk] = 0; });

    // From daily logs
    dateKeys.forEach(dk => {
        const log = logsByDate[dk];
        if (log?.habitsCompleted?.length) {
            habitsPerDay[dk] += log.habitsCompleted.length;
        }
    });

    // From habit completedDates
    habits.forEach(habit => {
        (habit.completedDates || []).forEach(d => {
            if (habitsPerDay[d] !== undefined) {
                habitsPerDay[d]++;
            }
        });
    });

    // Find max for color scale
    const maxHabits = Math.max(1, ...Object.values(habitsPerDay));

    container.innerHTML = dateKeys.map(dk => {
        const count = habitsPerDay[dk] || 0;
        const intensity = count / maxHabits;
        let bg;
        if (count === 0) bg = "#161b22";
        else if (intensity <= 0.25) bg = "rgba(129,140,248,0.15)";
        else if (intensity <= 0.5) bg = "rgba(129,140,248,0.35)";
        else if (intensity <= 0.75) bg = "rgba(129,140,248,0.6)";
        else bg = "#818cf8";

        const d = new Date(dk + "T00:00:00");
        const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        return `<div class="heat-cell" style="background:${bg}" title="${label}: ${count} habits"></div>`;
    }).join("");
}

// ==========================================
// MOOD TREND CHART
// ==========================================
function renderMoodChart(labels, data) {
    const canvas = document.getElementById("mood-chart");
    if (!canvas) return;

    if (moodChartInstance) moodChartInstance.destroy();

    moodChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Mood",
                data,
                borderColor: "#facc15",
                backgroundColor: "rgba(250, 204, 21, 0.08)",
                borderWidth: 2.5,
                pointBackgroundColor: "#facc15",
                pointBorderColor: "#111118",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4,
                spanGaps: true
            }]
        },
        options: chartOptions("Mood", ["", "Sad 😞", "Neutral 😐", "Happy 😊"], 0.5, 3.5)
    });
}

// ==========================================
// ENERGY TREND CHART
// ==========================================
function renderEnergyChart(labels, data) {
    const canvas = document.getElementById("energy-chart");
    if (!canvas) return;

    if (energyChartInstance) energyChartInstance.destroy();

    energyChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Energy",
                data,
                borderColor: "#f97316",
                backgroundColor: "rgba(249, 115, 22, 0.08)",
                borderWidth: 2.5,
                pointBackgroundColor: "#f97316",
                pointBorderColor: "#111118",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4,
                spanGaps: true
            }]
        },
        options: chartOptions("Energy", ["", "Low 🪫", "Medium 🔋", "High ⚡"], 0.5, 3.5)
    });
}

// ==========================================
// LIFE BALANCE WHEEL (Radar)
// ==========================================
function renderBalanceWheel(avgMood, avgEnergy, habitsCount, daysLogged, totalDays) {
    const canvas = document.getElementById("balance-chart");
    if (!canvas) return;

    if (balanceChartInstance) balanceChartInstance.destroy();

    // Normalize all scores to 0–10 scale
    const moodScore = avgMood > 0 ? Math.round((avgMood / 3) * 10) : 0;
    const energyScore = avgEnergy > 0 ? Math.round((avgEnergy / 3) * 10) : 0;
    const consistencyScore = daysLogged > 0 ? Math.round((daysLogged / totalDays) * 10) : 0;
    const habitScore = habitsCount > 0 ? Math.min(10, Math.round((habitsCount / (totalDays * 3)) * 10)) : 0;
    const mindfulScore = Math.round((moodScore + energyScore) / 2); // Proxy for mindfulness
    const disciplineScore = Math.round((consistencyScore + habitScore) / 2);

    balanceChartInstance = new Chart(canvas, {
        type: "radar",
        data: {
            labels: ["Mood", "Energy", "Habits", "Consistency", "Mindfulness", "Discipline"],
            datasets: [{
                label: "Life Balance",
                data: [moodScore, energyScore, habitScore, consistencyScore, mindfulScore, disciplineScore],
                borderColor: "#818cf8",
                backgroundColor: "rgba(129, 140, 248, 0.12)",
                borderWidth: 2.5,
                pointBackgroundColor: "#818cf8",
                pointBorderColor: "#111118",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#1e1e2e",
                    titleColor: "#e2e8f0",
                    bodyColor: "#94a3b8",
                    borderColor: "#2e2e3e",
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw}/10`
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        display: false
                    },
                    grid: {
                        color: "rgba(30, 30, 46, 0.8)",
                        circular: true
                    },
                    angleLines: {
                        color: "rgba(30, 30, 46, 0.6)"
                    },
                    pointLabels: {
                        color: "#94a3b8",
                        font: { size: 11, family: "Inter", weight: "500" },
                        padding: 12
                    }
                }
            }
        }
    });
}

// ==========================================
// SHARED CHART OPTIONS
// ==========================================
function chartOptions(label, yLabels, yMin, yMax) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#1e1e2e",
                titleColor: "#e2e8f0",
                bodyColor: "#94a3b8",
                borderColor: "#2e2e3e",
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (ctx) => {
                        const val = ctx.raw;
                        return val != null ? `${label}: ${yLabels[val] || val}` : "No data";
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { color: "rgba(30, 30, 46, 0.5)", drawBorder: false },
                ticks: {
                    color: "#64748b",
                    font: { size: 10, family: "Inter" },
                    maxRotation: 45,
                    autoSkip: true,
                    maxTicksLimit: 10
                }
            },
            y: {
                min: yMin,
                max: yMax,
                grid: { color: "rgba(30, 30, 46, 0.5)", drawBorder: false },
                ticks: {
                    stepSize: 1,
                    color: "#64748b",
                    font: { size: 10, family: "Inter" },
                    callback: (val) => yLabels[val] || ""
                }
            }
        },
        interaction: {
            intersect: false,
            mode: "index"
        }
    };
}

// ==========================================
// HELPERS
// ==========================================


function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
