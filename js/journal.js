/**
 * journal.js — Journal Page Logic for LifeOS
 * 
 * Handles 3 writing sections:
 * - Daily Reflection (type: "daily")
 * - Idea Parking Lot (type: "idea")
 * - Unsent Letters (type: "letter")
 * 
 * Features:
 * - Save entries to Firestore (journalEntries collection)
 * - Load past entries with type filtering
 * - Edit entries via modal
 * - Delete entries
 * - Daily writing prompts
 */

import { db, auth } from "./firebase.js";
import {
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc,
    query, orderBy, Timestamp, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getTodayKey, escapeHtml } from "./db.js";

let currentUser = null;
let allEntries = [];
let currentFilter = "all";

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        initJournal();
    }
});

// ==========================================
// DAILY PROMPTS
// ==========================================
const prompts = [
    "What are you grateful for today?",
    "What's one thing you learned recently?",
    "Describe your ideal day in detail.",
    "What challenge are you currently facing?",
    "Write about someone who inspired you.",
    "What would you do if failure wasn't possible?",
    "What small win did you have today?",
    "How are you feeling right now, and why?",
    "What habit do you want to build next?",
    "Write a letter to your future self.",
    "What made you smile today?",
    "What's something you want to let go of?",
    "Describe a moment of peace you experienced.",
    "What are your top 3 priorities this week?",
    "If you could change one thing about today, what?",
    "What does success look like to you?",
    "What boundaries do you need to set?",
    "Describe a place where you feel completely safe.",
    "What fear would you conquer if you could?",
    "What's one thing you appreciate about yourself?"
];

// ==========================================
// INIT
// ==========================================
async function initJournal() {
    setDate();
    setDailyPrompt();
    initFilterTabs();
    await loadEntries();
}

function setDate() {
    const el = document.getElementById("entry-date");
    if (el) {
        el.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric"
        });
    }
}

function setDailyPrompt() {
    const el = document.getElementById("daily-prompt");
    if (el) {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        el.textContent = `"${prompts[dayOfYear % prompts.length]}"`;
    }
}

// ==========================================
// SAVE ENTRY
// ==========================================
window._saveEntry = async function (type) {
    if (!currentUser) return;

    let content = "";
    let title = "";

    if (type === "daily") {
        content = document.getElementById("daily-content")?.value?.trim();
        title = "Daily Reflection";
        if (!content) return;
    } else if (type === "idea") {
        content = document.getElementById("idea-input")?.value?.trim();
        title = "Idea";
        if (!content) return;
    } else if (type === "letter") {
        const to = document.getElementById("letter-to")?.value?.trim() || "";
        content = document.getElementById("letter-content")?.value?.trim();
        title = to ? `Letter to ${to}` : "Unsent Letter";
        if (!content) return;
        // Prepend "Dear X" to content for storage
        if (to) content = `Dear ${to},\n\n${content}`;
    }

    try {
        await addDoc(collection(db, "users", currentUser.uid, "journalEntries"), {
            type,
            title,
            content,
            date: getTodayKey(),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        // Clear fields
        if (type === "daily") {
            document.getElementById("daily-content").value = "";
        } else if (type === "idea") {
            document.getElementById("idea-input").value = "";
        } else if (type === "letter") {
            document.getElementById("letter-to").value = "";
            document.getElementById("letter-content").value = "";
        }

        // Show saved toast
        showSaved(type);

        // Reload entries
        await loadEntries();
    } catch (err) {
        console.error("Error saving entry:", err);
        alert("Failed to save entry. Please check your connection.");
    } finally {
        // Reset button state (specific to type)
        const btnId = `${type}-save-btn`; // Assuming IDs follow this pattern
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

function showSaved(type) {
    const el = document.getElementById(`${type}-saved`);
    if (el) {
        el.classList.remove("hidden");
        el.classList.add("saved-toast");
        setTimeout(() => {
            el.classList.add("hidden");
            el.classList.remove("saved-toast");
        }, 1500);
    }
}

// ==========================================
// LOAD ENTRIES
// ==========================================
async function loadEntries() {
    try {
        const q = query(
            collection(db, "users", currentUser.uid, "journalEntries"),
            orderBy("createdAt", "desc"),
            limit(100)
        );
        const snap = await getDocs(q);
        allEntries = [];
        snap.forEach(d => allEntries.push({ id: d.id, ...d.data() }));
        renderEntries();
    } catch (err) {
        console.error("Error loading entries:", err);
    }
}

// ==========================================
// FILTER TABS
// ==========================================
function initFilterTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach(b => {
                b.classList.remove("active-tab");
                b.classList.add("text-textMuted");
            });
            btn.classList.add("active-tab");
            btn.classList.remove("text-textMuted");
            currentFilter = btn.dataset.filter;
            renderEntries();
        });
    });
}

// ==========================================
// RENDER ENTRIES
// ==========================================
function renderEntries() {
    const list = document.getElementById("entries-list");
    const countEl = document.getElementById("entries-count");
    if (!list) return;

    const filtered = currentFilter === "all"
        ? allEntries
        : allEntries.filter(e => e.type === currentFilter);

    if (countEl) countEl.textContent = filtered.length > 0 ? `(${filtered.length})` : "";

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="text-center py-16 text-textMuted">
                <p class="text-5xl mb-4">📖</p>
                <p class="text-textSecondary font-medium mb-1">No entries yet</p>
                <p class="text-sm">Start writing above to see your entries here.</p>
            </div>
        `;
        return;
    }

    // Group by date
    const groups = {};
    filtered.forEach(entry => {
        const dateKey = entry.date || "Unknown";
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(entry);
    });

    const typeIcons = { daily: "📝", idea: "💡", letter: "💌" };
    const typeLabels = { daily: "Daily", idea: "Idea", letter: "Letter" };
    const typeClasses = { daily: "type-daily", idea: "type-idea", letter: "type-letter" };

    let html = "";
    for (const [date, entries] of Object.entries(groups)) {
        const formattedDate = formatDate(date);

        html += `<div class="mb-6">`;
        html += `<p class="text-textMuted text-xs font-medium uppercase tracking-wider mb-3">${formattedDate}</p>`;

        entries.forEach((entry, i) => {
            const icon = typeIcons[entry.type] || "📝";
            const label = typeLabels[entry.type] || "Entry";
            const badgeClass = typeClasses[entry.type] || "type-daily";
            const preview = entry.content?.substring(0, 200) || "";
            const time = entry.createdAt?.toDate
                ? entry.createdAt.toDate().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                : "";

            html += `
                <div class="entry-card bg-card border border-border rounded-2xl p-5 mb-3 fade-up" style="animation-delay: ${i * 0.03}s">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${badgeClass}">${icon} ${label}</span>
                                <span class="text-textMuted text-[11px]">${time}</span>
                            </div>
                            <h3 class="font-semibold text-sm mb-1">${entry.title || "Untitled"}</h3>
                            <p class="text-textSecondary text-sm leading-relaxed line-clamp-3 whitespace-pre-line">${escapeHtml(preview)}${preview.length >= 200 ? '...' : ''}</p>
                        </div>
                        <div class="entry-actions flex gap-1 flex-shrink-0 mt-1">
                            <button onclick="window._editEntry('${entry.id}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-textMuted hover:text-accent hover:bg-accent/10 transition text-xs" title="Edit">✏️</button>
                            <button onclick="window._deleteEntry('${entry.id}')" class="w-8 h-8 rounded-lg flex items-center justify-center text-textMuted hover:text-red-400 hover:bg-red-500/10 transition text-xs" title="Delete">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    }

    list.innerHTML = html;
}

// ==========================================
// DELETE ENTRY
// ==========================================
window._deleteEntry = async function (entryId) {
    if (!currentUser) return;
    if (!confirm("Delete this entry? This cannot be undone.")) return;

    try {
        await deleteDoc(doc(db, "users", currentUser.uid, "journalEntries", entryId));
        await loadEntries();
    } catch (err) {
        console.error("Error deleting entry:", err);
    }
};

// ==========================================
// EDIT ENTRY
// ==========================================
window._editEntry = function (entryId) {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) return;

    document.getElementById("edit-id").value = entryId;
    document.getElementById("edit-type").value = entry.type;
    document.getElementById("edit-content").value = entry.content || "";

    // Show "To" field for letters
    const toWrap = document.getElementById("edit-to-wrap");
    const toInput = document.getElementById("edit-to");
    if (entry.type === "letter") {
        toWrap.classList.remove("hidden");
        // Extract "Dear X" from content
        const match = entry.content?.match(/^Dear (.+?),\n/);
        toInput.value = match ? match[1] : "";
    } else {
        toWrap.classList.add("hidden");
        toInput.value = "";
    }

    document.getElementById("edit-modal").classList.remove("hidden");
};

window._closeEditModal = function () {
    document.getElementById("edit-modal").classList.add("hidden");
};

window._updateEntry = async function () {
    if (!currentUser) return;

    const entryId = document.getElementById("edit-id").value;
    const type = document.getElementById("edit-type").value;
    let content = document.getElementById("edit-content").value.trim();

    if (!content) return;

    // Rebuild title
    let title = "Entry";
    if (type === "daily") title = "Daily Reflection";
    else if (type === "idea") title = "Idea";
    else if (type === "letter") {
        const to = document.getElementById("edit-to").value.trim();
        title = to ? `Letter to ${to}` : "Unsent Letter";
    }

    try {
        await updateDoc(doc(db, "users", currentUser.uid, "journalEntries", entryId), {
            content,
            title,
            updatedAt: Timestamp.now()
        });

        document.getElementById("edit-modal").classList.add("hidden");
        await loadEntries();
    } catch (err) {
        console.error("Error updating entry:", err);
    }
};

// ==========================================
// HELPERS
// ==========================================


function formatDate(dateStr) {
    try {
        const d = new Date(dateStr + "T00:00:00");
        const today = getTodayKey();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (dateStr === today) return "Today";
        if (dateStr === yesterdayKey) return "Yesterday";
        return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
    } catch {
        return dateStr;
    }
}


