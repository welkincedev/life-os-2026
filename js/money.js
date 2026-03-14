/**
 * money.js — Personal Finance Tracker Logic
 * 
 * Handles:
 * - Adding income/expense transactions with method, mood, note, date
 * - Loading and displaying transactions from Firestore
 * - Calculating monthly totals and balance
 * - Category-wise spending breakdown
 * - Filtering by type
 */

import { db, auth } from "./firebase.js";
import {
    collection, addDoc, getDocs, deleteDoc, doc,
    query, orderBy, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) initMoney(user);
});

let selectedType = "expense";
let selectedMethod = "upi";
let selectedMood = "neutral";

function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentMonthRange() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return {
        start: `${y}-${m}-01`,
        end: `${y}-${m}-${String(new Date(y, now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`
    };
}

async function initMoney(user) {
    initTransactionModal(user);
    initFilter(user);
    setDefaultDate();
    await loadTransactions(user);
}

function setDefaultDate() {
    const dateInput = document.getElementById("txn-date");
    if (dateInput) dateInput.value = getTodayKey();
}

// ==========================================
// TRANSACTION MODAL
// ==========================================
function initTransactionModal(user) {
    const openBtn = document.getElementById("add-transaction-btn");
    const closeBtn = document.getElementById("close-txn-modal");
    const closeX = document.getElementById("close-txn-modal-x");
    const modal = document.getElementById("transaction-modal");
    const form = document.getElementById("transaction-form");

    // --- Type toggle ---
    document.querySelectorAll(".type-toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".type-toggle-btn").forEach(b => {
                b.classList.remove("active-type-expense", "active-type-income");
            });
            selectedType = btn.dataset.type;
            btn.classList.add(selectedType === "expense" ? "active-type-expense" : "active-type-income");
        });
    });

    // --- Method pills ---
    document.querySelectorAll(".method-pill").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".method-pill").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedMethod = btn.dataset.method;
        });
    });

    // --- Mood selector ---
    const moodLabels = { happy: "Happy 😊", neutral: "Neutral", regret: "Regret 😞" };
    document.querySelectorAll(".mood-select").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".mood-select").forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            selectedMood = btn.dataset.mood;
            const label = document.getElementById("mood-label");
            if (label) label.textContent = moodLabels[selectedMood] || "";
        });
    });

    // --- Open/Close modal ---
    function openModal() {
        if (modal) {
            modal.classList.remove("hidden");
            setDefaultDate();
        }
    }
    function closeModal() {
        if (modal) modal.classList.add("hidden");
    }

    if (openBtn) openBtn.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (closeX) closeX.addEventListener("click", closeModal);

    // Close on backdrop click
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // --- Form submit ---
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById("txn-submit-btn");
            const amount = parseFloat(document.getElementById("txn-amount").value);
            const note = document.getElementById("txn-note").value.trim();
            const category = document.getElementById("txn-category").value;
            const date = document.getElementById("txn-date").value || getTodayKey();

            if (!amount || amount <= 0) return;

            // Loading state
            submitBtn.textContent = "Saving...";
            submitBtn.disabled = true;

            try {
                await addDoc(collection(db, "users", user.uid, "transactions"), {
                    type: selectedType,
                    amount,
                    method: selectedMethod,
                    mood: selectedMood,
                    note,
                    category,
                    date,
                    createdAt: Timestamp.now()
                });

                closeModal();
                form.reset();
                setDefaultDate();

                // Reset selectors
                selectedType = "expense";
                selectedMethod = "upi";
                selectedMood = "neutral";
                document.querySelectorAll(".type-toggle-btn").forEach(b => b.classList.remove("active-type-expense", "active-type-income"));
                document.querySelector('[data-type="expense"]')?.classList.add("active-type-expense");
                document.querySelectorAll(".method-pill").forEach(b => b.classList.remove("selected"));
                document.querySelector('[data-method="upi"]')?.classList.add("selected");
                document.querySelectorAll(".mood-select").forEach(b => b.classList.remove("selected"));
                document.querySelector('[data-mood="neutral"]')?.classList.add("selected");
                const moodLabelEl = document.getElementById("mood-label");
                if (moodLabelEl) moodLabelEl.textContent = "Neutral";

                await loadTransactions(user);
            } catch (err) {
                console.error("Error adding transaction:", err);
            } finally {
                submitBtn.textContent = "Save Transaction";
                submitBtn.disabled = false;
            }
        });
    }
}

// ==========================================
// FILTER
// ==========================================
function initFilter(user) {
    const filter = document.getElementById("filter-type");
    if (filter) {
        filter.addEventListener("change", () => loadTransactions(user, filter.value));
    }
}

// ==========================================
// LOAD & DISPLAY TRANSACTIONS
// ==========================================
async function loadTransactions(user, filterType = "all") {
    const list = document.getElementById("transactions-list");
    if (!list) return;

    try {
        const q = query(
            collection(db, "users", user.uid, "transactions"),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);

        const { start: monthStart, end: monthEnd } = getCurrentMonthRange();

        let totalIncome = 0;
        let totalExpenses = 0;
        let monthIncome = 0;
        let monthExpenses = 0;
        const categoryTotals = {};
        const transactions = [];

        snapshot.forEach(docSnap => {
            const txn = { id: docSnap.id, ...docSnap.data() };
            const txnDate = txn.date || "";

            if (txn.type === "income") {
                totalIncome += txn.amount;
                if (txnDate >= monthStart && txnDate <= monthEnd) monthIncome += txn.amount;
            } else {
                totalExpenses += txn.amount;
                if (txnDate >= monthStart && txnDate <= monthEnd) monthExpenses += txn.amount;
                if (txnDate >= monthStart && txnDate <= monthEnd) {
                    categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
                }
            }

            transactions.push(txn);
        });

        // --- Update summary cards ---
        const balance = totalIncome - totalExpenses;
        updateEl("total-balance", `${balance < 0 ? '-' : ''}₹${Math.abs(balance).toLocaleString()}`);
        updateEl("total-income", `₹${monthIncome.toLocaleString()}`);
        updateEl("total-expenses", `₹${monthExpenses.toLocaleString()}`);

        // Colorize balance
        const balanceEl = document.getElementById("total-balance");
        if (balanceEl) {
            balanceEl.className = `text-3xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`;
        }

        // --- Category chart ---
        renderCategoryChart(categoryTotals, monthExpenses);

        // --- Filter & render transactions ---
        const filtered = filterType === "all"
            ? transactions
            : transactions.filter(t => t.type === filterType);

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="text-center py-12 text-textMuted">
                    <p class="text-4xl mb-3">💸</p>
                    <p class="text-sm">No transactions yet. Start tracking your money!</p>
                </div>
            `;
            return;
        }

        const methodIcons = { upi: "📱", cash: "💵", card: "💳" };
        const moodIcons = { happy: "😊", neutral: "😐", regret: "😞" };
        const categoryIcons = {
            food: "🍔", transport: "🚗", shopping: "🛍️", bills: "📄",
            entertainment: "🎬", health: "💊", education: "📚", salary: "💰", other: "📦"
        };

        list.innerHTML = filtered.map((txn, i) => {
            const isIncome = txn.type === "income";
            const dateStr = txn.date ? formatDate(txn.date) : "";
            const methodIcon = methodIcons[txn.mood === undefined ? "cash" : (txn.method || "cash")];
            const moodIcon = moodIcons[txn.mood] || "";
            const catIcon = categoryIcons[txn.category] || "📦";
            const note = txn.note || txn.description || "";
            const methodLabel = (txn.method || "cash").toUpperCase();

            return `
                <div class="txn-card glow-card bg-card border border-border rounded-2xl p-4 flex items-center justify-between fade-in" style="animation-delay: ${i * 0.03}s">
                    <div class="flex items-center gap-4 flex-1 min-w-0">
                        <div class="w-11 h-11 rounded-xl ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center text-lg flex-shrink-0">
                            ${catIcon}
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="font-medium text-sm truncate">${note || txn.category}</p>
                            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span class="text-textMuted text-[11px]">${txn.category}</span>
                                <span class="text-textMuted/30 text-[11px]">•</span>
                                <span class="text-textMuted text-[11px]">${dateStr}</span>
                                ${txn.method ? `
                                    <span class="text-textMuted/30 text-[11px]">•</span>
                                    <span class="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-accent/8 text-accent/70 border border-accent/10">${methodIcons[txn.method] || ""} ${methodLabel}</span>
                                ` : ''}
                                ${txn.mood ? `<span class="text-xs">${moodIcon}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 flex-shrink-0">
                        <p class="font-semibold text-sm ${isIncome ? 'text-green-400' : 'text-red-400'}">
                            ${isIncome ? '+' : '-'}₹${txn.amount.toLocaleString()}
                        </p>
                        <button onclick="deleteTransaction('${txn.id}')" class="txn-delete w-7 h-7 rounded-lg flex items-center justify-center text-textMuted hover:text-red-400 hover:bg-red-500/10 transition text-xs" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Error loading transactions:", err);
        list.innerHTML = `
            <div class="text-center py-8 text-red-400">
                <p class="text-sm">Error loading transactions. Check console.</p>
            </div>
        `;
    }
}

// ==========================================
// CATEGORY CHART
// ==========================================
function renderCategoryChart(categoryTotals, total) {
    const container = document.getElementById("category-chart");
    if (!container) return;

    if (total === 0 || Object.keys(categoryTotals).length === 0) {
        container.innerHTML = `<p class="text-textMuted text-sm text-center py-4">Add expenses to see category breakdown</p>`;
        return;
    }

    const colors = {
        food: "#f97316", transport: "#3b82f6", shopping: "#ec4899",
        bills: "#eab308", entertainment: "#8b5cf6", health: "#10b981",
        education: "#06b6d4", salary: "#22c55e", other: "#6b7280"
    };

    const catIcons = {
        food: "🍔", transport: "🚗", shopping: "🛍️", bills: "📄",
        entertainment: "🎬", health: "💊", education: "📚", salary: "💰", other: "📦"
    };

    container.innerHTML = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .map(([cat, amount]) => {
            const pct = ((amount / total) * 100).toFixed(0);
            return `
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-textSecondary capitalize flex items-center gap-1.5">
                            <span class="text-xs">${catIcons[cat] || "📦"}</span>
                            ${cat}
                        </span>
                        <span class="text-textMuted text-xs font-medium">₹${amount.toLocaleString()} (${pct}%)</span>
                    </div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width: ${pct}%; background-color: ${colors[cat] || '#6b7280'}"></div>
                    </div>
                </div>
            `;
        }).join("");
}

// ==========================================
// DELETE TRANSACTION
// ==========================================
window.deleteTransaction = async function(txnId) {
    if (!confirm("Delete this transaction?")) return;
    try {
        const user = auth.currentUser;
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "transactions", txnId));
        await loadTransactions(user, document.getElementById("filter-type")?.value || "all");
    } catch (err) {
        console.error("Error deleting transaction:", err);
    }
};

// ==========================================
// HELPERS
// ==========================================
function updateEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function formatDate(dateStr) {
    try {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return dateStr;
    }
}
