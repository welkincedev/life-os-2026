/**
 * dashboard.js — Dashboard Logic
 * 
 * Handles:
 * - Dynamic greeting based on time of day
 * - Quick stat cards (habits done, mood, journal entries, balance)
 * - Mood & energy logging to Firestore
 * - Widget previews (habits, journal, finance)
 * - Daily brain game (memory match)
 */

import { db, auth } from "./firebase.js";
import {
    collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- Wait for Auth ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        initDashboard(user);
    }
});

async function initDashboard(user) {
    setGreeting(user);
    loadStatCards(user);
    initMoodLogger(user);
    loadWidgetPreviews(user);
    initDailyGame();
}

// --- Greeting ---
function setGreeting(user) {
    const el = document.getElementById("greeting-section");
    if (!el) return;
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";
    const name = user.displayName ? user.displayName.split(" ")[0] : "there";
    el.querySelector("h1").textContent = `${greeting}, ${name} 👋`;
}

// --- Stat Cards ---
async function loadStatCards(user) {
    const grid = document.getElementById("stats-grid");
    if (!grid) return;

    const stats = [
        { label: "Habits Today", value: "0/5", icon: "✅", color: "from-green-500/20 to-green-500/5" },
        { label: "Current Mood", value: "—", icon: "😊", color: "from-yellow-500/20 to-yellow-500/5" },
        { label: "Journal Streak", value: "0 days", icon: "📝", color: "from-blue-500/20 to-blue-500/5" },
        { label: "This Month", value: "₹0", icon: "💰", color: "from-purple-500/20 to-purple-500/5" }
    ];

    grid.innerHTML = stats.map(s => `
        <div class="bg-gradient-to-br ${s.color} border border-gray-800 rounded-2xl p-5 card-hover">
            <div class="flex items-center justify-between mb-3">
                <span class="text-2xl">${s.icon}</span>
            </div>
            <p class="text-2xl font-bold">${s.value}</p>
            <p class="text-gray-400 text-sm mt-1">${s.label}</p>
        </div>
    `).join("");
}

// --- Mood Logger ---
function initMoodLogger(user) {
    const buttons = document.querySelectorAll(".mood-btn");
    const slider = document.getElementById("energy-slider");
    const valueDisplay = document.getElementById("energy-value");

    if (slider && valueDisplay) {
        slider.addEventListener("input", () => {
            valueDisplay.textContent = slider.value;
        });
    }

    buttons.forEach(btn => {
        btn.addEventListener("click", async () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const mood = btn.dataset.mood;
            const energy = parseInt(slider?.value || 5);

            try {
                await addDoc(collection(db, "users", user.uid, "moods"), {
                    mood,
                    energy,
                    timestamp: Timestamp.now()
                });
            } catch (err) {
                console.error("Error logging mood:", err);
            }
        });
    });
}

// --- Widget Previews ---
async function loadWidgetPreviews(user) {
    // Habits preview
    const habitsPreview = document.getElementById("habits-preview");
    if (habitsPreview) {
        habitsPreview.innerHTML = `
            <p class="text-gray-500 text-sm">No habits tracked yet. <a href="habits.html" class="text-indigo-400 hover:underline">Add your first habit →</a></p>
        `;
    }

    // Journal preview
    const journalPreview = document.getElementById("journal-preview");
    if (journalPreview) {
        journalPreview.innerHTML = `
            <p class="text-gray-500 text-sm">Start your day with a journal entry. <a href="journal.html" class="text-indigo-400 hover:underline">Write now →</a></p>
        `;
    }

    // Finance preview
    const financePreview = document.getElementById("finance-preview");
    if (financePreview) {
        financePreview.innerHTML = `
            <p class="text-gray-500 text-sm">Track your spending. <a href="money.html" class="text-indigo-400 hover:underline">Add a transaction →</a></p>
        `;
    }
}

// --- Daily Brain Game (Memory Match) ---
function initDailyGame() {
    const playBtn = document.getElementById("play-game-btn");
    const container = document.getElementById("game-container");
    if (!playBtn || !container) return;

    playBtn.addEventListener("click", () => {
        container.classList.remove("hidden");
        playBtn.textContent = "Restart";
        startMemoryGame(container);
    });
}

function startMemoryGame(container) {
    const emojis = ["🎯", "🎲", "🧩", "🎨", "🚀", "⚡", "🔥", "🌟"];
    const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);

    let flipped = [];
    let matched = 0;
    let moves = 0;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <span class="text-sm text-gray-400">Moves: <span id="game-moves" class="text-white font-semibold">0</span></span>
            <span class="text-sm text-gray-400">Matched: <span id="game-matched" class="text-indigo-400 font-semibold">0</span>/8</span>
        </div>
        <div class="grid grid-cols-4 gap-3 max-w-sm mx-auto">
            ${cards.map((emoji, i) => `
                <div class="game-card w-16 h-16 md:w-20 md:h-20 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-2xl cursor-pointer hover:border-indigo-500/50 transition select-none" data-index="${i}" data-emoji="${emoji}">
                    ?
                </div>
            `).join("")}
        </div>
    `;

    container.querySelectorAll(".game-card").forEach(card => {
        card.addEventListener("click", () => {
            if (flipped.length >= 2 || card.classList.contains("matched") || flipped.includes(card)) return;

            card.textContent = card.dataset.emoji;
            card.style.borderColor = "#6366f1";
            flipped.push(card);

            if (flipped.length === 2) {
                moves++;
                document.getElementById("game-moves").textContent = moves;

                if (flipped[0].dataset.emoji === flipped[1].dataset.emoji) {
                    flipped.forEach(c => c.classList.add("matched"));
                    flipped.forEach(c => c.style.background = "rgba(99, 102, 241, 0.15)");
                    matched++;
                    document.getElementById("game-matched").textContent = matched;
                    flipped = [];

                    if (matched === 8) {
                        setTimeout(() => {
                            container.innerHTML += `
                                <div class="text-center mt-6 fade-in">
                                    <p class="text-2xl mb-2">🎉</p>
                                    <p class="text-lg font-semibold text-indigo-400">You won in ${moves} moves!</p>
                                </div>
                            `;
                        }, 500);
                    }
                } else {
                    setTimeout(() => {
                        flipped.forEach(c => { c.textContent = "?"; c.style.borderColor = "#374151"; });
                        flipped = [];
                    }, 800);
                }
            }
        });
    });
}
