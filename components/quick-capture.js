/**
 * quick-capture.js — 2nd Brain Quick Capture Vault Component
 * 
 * Allows capturing thoughts, expenses, habits, or mood logs instantly from any page in LifeOS.
 * Shortcut: Cmd/Ctrl + Shift + K
 */

import { LifeOSDB, getTodayKey } from "../js/db.js";

function injectQuickCaptureModal() {
    if (document.getElementById("quick-capture-modal")) return;

    const modalHTML = `
        <div id="quick-capture-modal" class="fixed inset-0 z-[80] bg-base/80 backdrop-blur-md flex items-center justify-center p-4 hidden">
            <div class="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl p-6 overflow-hidden">
                <!-- Header -->
                <div class="flex items-center justify-between pb-4 border-b border-border/50">
                    <div class="flex items-center gap-2">
                        <span class="text-xl">⚡</span>
                        <h3 class="font-bold text-base text-textPrimary">2nd Brain Quick Capture</h3>
                    </div>
                    <button onclick="window.toggleQuickCapture()" class="w-7 h-7 rounded-lg flex items-center justify-center text-textMuted hover:text-textPrimary hover:bg-base transition text-xs">✕</button>
                </div>

                <!-- Tabs -->
                <div class="flex gap-2 my-4 p-1 rounded-xl bg-base border border-border/40 text-xs font-medium">
                    <button type="button" onclick="switchCaptureTab('idea')" id="cap-tab-idea" class="flex-1 py-2 rounded-lg bg-card text-accent shadow transition">💡 Idea / Note</button>
                    <button type="button" onclick="switchCaptureTab('expense')" id="cap-tab-expense" class="flex-1 py-2 rounded-lg text-textMuted hover:text-textPrimary transition">💸 Expense</button>
                    <button type="button" onclick="switchCaptureTab('mood')" id="cap-tab-mood" class="flex-1 py-2 rounded-lg text-textMuted hover:text-textPrimary transition">😊 Mood Log</button>
                </div>

                <!-- Tab 1: Idea / Note -->
                <div id="cap-panel-idea" class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Title / Subject</label>
                        <input type="text" id="cap-idea-title" placeholder="What's on your mind?"
                            class="w-full px-4 py-3 rounded-xl bg-base border border-border/40 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Content</label>
                        <textarea id="cap-idea-content" rows="4" placeholder="Capture details quickly before you forget..."
                            class="w-full px-4 py-3 rounded-xl bg-base border border-border/40 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition resize-none"></textarea>
                    </div>
                    <button type="button" onclick="submitQuickCapture('idea')" id="cap-idea-btn"
                        class="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-base text-sm font-semibold transition active:scale-[0.98]">
                        Save to 2nd Brain 💡
                    </button>
                </div>

                <!-- Tab 2: Expense -->
                <div id="cap-panel-expense" class="space-y-4 hidden">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Amount (₹)</label>
                            <input type="number" id="cap-exp-amount" placeholder="0"
                                class="w-full px-4 py-3 rounded-xl bg-base border border-border/40 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Category</label>
                            <select id="cap-exp-category"
                                class="w-full px-4 py-3 rounded-xl bg-base border border-border/40 text-sm text-textPrimary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition">
                                <option value="food">🍔 Food</option>
                                <option value="transport">🚗 Transport</option>
                                <option value="shopping">🛍️ Shopping</option>
                                <option value="bills">📄 Bills</option>
                                <option value="entertainment">🎬 Entertainment</option>
                                <option value="health">💊 Health</option>
                                <option value="other">📦 Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Description / Note</label>
                        <input type="text" id="cap-exp-note" placeholder="What was this for?"
                            class="w-full px-4 py-3 rounded-xl bg-base border border-border/40 text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition">
                    </div>
                    <button type="button" onclick="submitQuickCapture('expense')" id="cap-exp-btn"
                        class="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-base text-sm font-semibold transition active:scale-[0.98]">
                        Log Expense 💸
                    </button>
                </div>

                <!-- Tab 3: Mood Log -->
                <div id="cap-panel-mood" class="space-y-4 hidden">
                    <div>
                        <label class="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">How are you feeling right now?</label>
                        <div class="flex justify-around py-3 rounded-xl bg-base border border-border/40">
                            <button type="button" onclick="selectCapMood('happy')" id="cap-mood-happy" class="text-3xl hover:scale-125 transition">😊</button>
                            <button type="button" onclick="selectCapMood('neutral')" id="cap-mood-neutral" class="text-3xl hover:scale-125 transition">😐</button>
                            <button type="button" onclick="selectCapMood('sad')" id="cap-mood-sad" class="text-3xl hover:scale-125 transition">😞</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Energy Level</label>
                        <div class="flex gap-2">
                            <button type="button" onclick="selectCapEnergy('low')" id="cap-nrg-low" class="flex-1 py-2.5 rounded-xl border border-border/40 text-xs font-medium text-textSecondary hover:border-accent transition">Low</button>
                            <button type="button" onclick="selectCapEnergy('medium')" id="cap-nrg-medium" class="flex-1 py-2.5 rounded-xl border border-border/40 text-xs font-medium text-textSecondary hover:border-accent transition">Medium</button>
                            <button type="button" onclick="selectCapEnergy('high')" id="cap-nrg-high" class="flex-1 py-2.5 rounded-xl border border-border/40 text-xs font-medium text-textSecondary hover:border-accent transition">High</button>
                        </div>
                    </div>
                    <button type="button" onclick="submitQuickCapture('mood')" id="cap-mood-btn"
                        class="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-base text-sm font-semibold transition active:scale-[0.98]">
                        Log Mood & Energy 😊
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

let activeCapMood = "neutral";
let activeCapEnergy = "medium";

window.selectCapMood = (mood) => {
    activeCapMood = mood;
    ["happy", "neutral", "sad"].forEach(m => {
        const btn = document.getElementById(`cap-mood-${m}`);
        if (btn) btn.style.transform = m === mood ? "scale(1.3)" : "scale(1)";
    });
};

window.selectCapEnergy = (energy) => {
    activeCapEnergy = energy;
    ["low", "medium", "high"].forEach(e => {
        const btn = document.getElementById(`cap-nrg-${e}`);
        if (btn) {
            if (e === energy) {
                btn.className = "flex-1 py-2.5 rounded-xl bg-accent text-base text-xs font-semibold shadow transition";
            } else {
                btn.className = "flex-1 py-2.5 rounded-xl border border-border/40 text-xs font-medium text-textSecondary hover:border-accent transition";
            }
        }
    });
};

window.switchCaptureTab = (tab) => {
    ["idea", "expense", "mood"].forEach(t => {
        const panel = document.getElementById(`cap-panel-${t}`);
        const btn = document.getElementById(`cap-tab-${t}`);
        if (panel && btn) {
            if (t === tab) {
                panel.classList.remove("hidden");
                btn.className = "flex-1 py-2 rounded-lg bg-card text-accent shadow transition";
            } else {
                panel.classList.add("hidden");
                btn.className = "flex-1 py-2 rounded-lg text-textMuted hover:text-textPrimary transition";
            }
        }
    });
};

window.toggleQuickCapture = () => {
    injectQuickCaptureModal();
    const modal = document.getElementById("quick-capture-modal");
    if (!modal) return;
    const isHidden = modal.classList.toggle("hidden");
    if (!isHidden) {
        setTimeout(() => document.getElementById("cap-idea-title")?.focus(), 100);
    }
};

window.submitQuickCapture = async (type) => {
    try {
        if (type === "idea") {
            const title = document.getElementById("cap-idea-title")?.value?.trim() || "Quick Note";
            const content = document.getElementById("cap-idea-content")?.value?.trim();
            if (!content) return alert("Please enter some content.");

            const btn = document.getElementById("cap-idea-btn");
            if (btn) { btn.textContent = "Saving..."; btn.disabled = true; }

            await LifeOSDB.saveJournalEntry({ type: "idea", title, content });
            document.getElementById("cap-idea-title").value = "";
            document.getElementById("cap-idea-content").value = "";
            alert("✅ Captured to Journal!");

        } else if (type === "expense") {
            const amount = parseFloat(document.getElementById("cap-exp-amount")?.value);
            const category = document.getElementById("cap-exp-category")?.value || "other";
            const note = document.getElementById("cap-exp-note")?.value?.trim() || "";

            if (!amount || amount <= 0) return alert("Please enter a valid amount.");

            const btn = document.getElementById("cap-exp-btn");
            if (btn) { btn.textContent = "Saving..."; btn.disabled = true; }

            await LifeOSDB.addTransaction({ type: "expense", amount, category, note, method: "cash" });
            document.getElementById("cap-exp-amount").value = "";
            document.getElementById("cap-exp-note").value = "";
            alert("✅ Expense Logged!");

        } else if (type === "mood") {
            const btn = document.getElementById("cap-mood-btn");
            if (btn) { btn.textContent = "Saving..."; btn.disabled = true; }

            await LifeOSDB.saveDailyLog({ mood: activeCapMood, energy: activeCapEnergy });
            alert("✅ Mood & Energy Logged!");
        }

        window.toggleQuickCapture();
        location.reload();

    } catch (err) {
        console.error("Quick capture error:", err);
        alert("Error saving capture. Please check connection.");
    }
};

// Shortcut: Cmd/Ctrl + Shift + K
document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "K" || e.key === "k")) {
        e.preventDefault();
        window.toggleQuickCapture();
    }
});

// Auto-inject on import
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectQuickCaptureModal);
} else {
    injectQuickCaptureModal();
}
