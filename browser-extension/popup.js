
// WebFindLead Chrome Extension Popup Logic

// Backend URL
const BACKEND_URL = "http://127.0.0.1:3000";

// DOM Elements
const authView = document.getElementById("auth-view");
const scannerView = document.getElementById("scanner-view");
const statusIndicator = document.getElementById("status-indicator");
const scanBtn = document.getElementById("scan-btn");
const scanText = document.getElementById("scan-text");
const scanSpinner = document.getElementById("scan-spinner");
const resultsArea = document.getElementById("results-area");
const resultsCount = document.getElementById("results-count");
const leadsList = document.getElementById("leads-list");
const syncBtn = document.getElementById("sync-crm-btn");
const wrongPageWarning = document.getElementById("wrong-page-warning");
const scanControls = document.getElementById("scan-controls");
const checkAuthBtn = document.getElementById("check-auth-btn");
const leadsCountEl = document.getElementById("leads-count");
const leadsLimitEl = document.getElementById("leads-limit");
const quotaBar = document.getElementById("quota-bar");

// New Elements
const roleFilter = document.getElementById("role-filter");
const exportBtn = document.getElementById("export-btn");
// Detail View Elements
const detailView = document.getElementById("detail-view");
const backToListBtn = document.getElementById("back-to-list-btn");
const detailName = document.getElementById("detail-name");
const detailCategory = document.getElementById("detail-category");
const detailStatus = document.getElementById("detail-status");
const detailPhone = document.getElementById("detail-phone");
const detailWebsite = document.getElementById("detail-website");
const detailMapLink = document.getElementById("detail-map-link");
const detailRating = document.getElementById("detail-rating");
const detailReviews = document.getElementById("detail-reviews");
const saveLeadBtn = document.getElementById("save-lead-btn");


// State
let currentUser = null;
let currentLeads = [];
let selectedLead = null;

// --- Initialization ---

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await checkAuth();

        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];

        if (tab && tab.url && (tab.url.includes("google.com/maps") || tab.url.includes("google.com/search"))) {
            if (wrongPageWarning) wrongPageWarning.classList.add("hidden");
            if (scanControls) scanControls.classList.remove("hidden");

            const contextText = document.querySelector("#scan-controls p");
            if (contextText) {
                if (tab.url.includes("google.com/search")) {
                    contextText.textContent = "Scans 'Places' list in search results";
                } else {
                    contextText.textContent = "Scans businesses (auto-scrolls list)";
                }
            }
        } else {
            if (wrongPageWarning) wrongPageWarning.classList.remove("hidden");
            if (scanControls) scanControls.classList.add("hidden");
        }
    } catch (err) {
        console.error("Popup init error:", err);
    }
});

// --- Auth Logic ---

async function checkAuth(isUserAction = false) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/extension-health`, { cache: "no-store" });
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showScannerUi();
            if (isUserAction) alert("Connection Successful! You are logged in.");
        } else {
            showAuthUi();
            if (isUserAction) alert(`Connection failed: Server returned ${response.status}.`);
        }
    } catch (error) {
        console.error("Auth check failed", error);
        showAuthUi();
        if (isUserAction) alert(`Connection failed: ${error.message}.`);
    }
}

function showAuthUi() {
    if (authView) authView.classList.remove("hidden");
    if (scannerView) scannerView.classList.add("hidden");
    if (statusIndicator) statusIndicator.classList.add("hidden");
}

function showScannerUi() {
    if (authView) authView.classList.add("hidden");
    if (scannerView) scannerView.classList.remove("hidden");
    if (statusIndicator) statusIndicator.classList.remove("hidden");

    if (currentUser) {
        if (leadsCountEl) leadsCountEl.textContent = (75 - currentUser.leadsRemaining).toString();
        if (leadsLimitEl) leadsLimitEl.textContent = "75";
        const percentage = ((75 - currentUser.leadsRemaining) / 75) * 100;
        if (quotaBar) quotaBar.style.width = `${percentage}%`;
    }
}

if (checkAuthBtn) checkAuthBtn.addEventListener("click", () => checkAuth(true));

// --- Scanning Logic ---

if (scanBtn) {
    scanBtn.addEventListener("click", async () => {
        scanBtn.setAttribute("disabled", "true");
        if (scanText) scanText.textContent = "Scanning (scrolling)...";
        if (scanSpinner) scanSpinner.classList.remove("hidden");
        if (resultsArea) resultsArea.classList.add("hidden");
        if (detailView) detailView.classList.add("hidden");

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { action: "SCAN_LEADS" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Runtime error:", chrome.runtime.lastError);
                        alert("Connection failed. Please refresh the page.");
                        resetScanUi();
                        return;
                    }

                    if (response && response.leads) {
                        currentLeads = response.leads;
                        if (currentLeads.length === 0) {
                            alert("No businesses found here.");
                        }
                        displayResults(); // Default sort
                    }
                    resetScanUi();
                });
            }
        } catch (error) {
            console.error("Scan error:", error);
            alert("Scan failed. " + error.message);
            resetScanUi();
        }
    });
}

function resetScanUi() {
    if (scanBtn) scanBtn.removeAttribute("disabled");
    if (scanText) scanText.textContent = "Start Local Scan";
    if (scanSpinner) scanSpinner.classList.add("hidden");
}

// --- Filter & Display Logic ---

if (roleFilter) {
    roleFilter.addEventListener("change", () => {
        displayResults();
    });
}

function displayResults() {
    if (resultsArea) resultsArea.classList.remove("hidden");
    if (detailView) detailView.classList.add("hidden");

    // 1. Filter/Sort
    let validLeads = [...currentLeads];
    const role = roleFilter ? roleFilter.value : 'all';

    if (role === 'web-dev') {
        // Sort NO_WEBSITE to top, then LOW_QUALITY (http), then GOOD
        validLeads.sort((a, b) => {
            const score = (status) => status === 'NO_WEBSITE' ? 3 : (status === 'LOW_QUALITY' ? 2 : 1);
            return score(b.status) - score(a.status);
        });
    } else if (role === 'marketer') {
        // Sort LOW_QUALITY to top (assuming these need marketing help), or maybe low reviews?
        // Let's sort by 'Needs Help' descending
        validLeads.sort((a, b) => {
            // Heuristic: No website or low rating is good for marketers
            const scoreA = (a.status !== 'GOOD' ? 2 : 0) + (a.rating < 4.0 ? 1 : 0);
            const scoreB = (b.status !== 'GOOD' ? 2 : 0) + (b.rating < 4.0 ? 1 : 0);
            return scoreB - scoreA;
        });
    }

    if (resultsCount) resultsCount.textContent = validLeads.length.toString();
    if (leadsList) leadsList.innerHTML = "";

    validLeads.forEach(lead => {
        const el = document.createElement("div");
        el.className = "lead-item cursor-pointer hover:bg-gray-50 transition p-2 border border-gray-100 rounded-lg flex items-center justify-between group";

        // Status logic
        let statusClass = "bg-emerald-400";
        let statusText = "Good Site";
        let statusColor = "text-gray-400";

        if (lead.status === 'NO_WEBSITE') {
            statusClass = "bg-red-500";
            statusText = "No Website";
            statusColor = "text-red-500";
        } else if (lead.status === 'LOW_QUALITY') {
            statusClass = "bg-amber-400";
            statusText = "Low Quality";
            statusColor = "text-amber-500";
        }

        el.innerHTML = `
      <div class="flex flex-col min-w-0 pr-2">
        <span class="text-xs font-bold truncate text-gray-900 group-hover:text-indigo-600 transition">${lead.name}</span>
        <span class="text-[10px] text-gray-500 truncate">${lead.category || "Business"} • ${lead.rating || "N/A"}★</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-[8px] font-bold uppercase tracking-wider ${statusColor}">${statusText}</span>
        <div class="lead-status-dot w-2 h-2 rounded-full ${statusClass}"></div>
      </div>
    `;

        el.addEventListener("click", () => showLeadDetail(lead));
        if (leadsList) leadsList.appendChild(el);
    });
}

// --- Detail View Logic ---

function showLeadDetail(lead) {
    selectedLead = lead;
    if (resultsArea) resultsArea.classList.add("hidden");
    if (detailView) detailView.classList.remove("hidden");
    if (scanControls) scanControls.classList.add("hidden"); // Hide scan button in detail view

    if (detailName) detailName.textContent = lead.name;
    if (detailCategory) detailCategory.textContent = lead.category || "Local Business";
    if (detailPhone) detailPhone.textContent = lead.phone || "No Phone";

    if (detailWebsite) {
        if (lead.website) {
            detailWebsite.href = lead.website;
            detailWebsite.classList.remove("hidden");
            detailWebsite.querySelector("span").textContent = lead.website.replace(/^https?:\/\//, '');
        } else {
            detailWebsite.classList.add("hidden");
        }
    }

    if (detailMapLink) detailMapLink.href = lead.mapsLink || "#";
    if (detailRating) detailRating.textContent = lead.rating || "0.0";
    if (detailReviews) detailReviews.textContent = lead.reviews || "0";

    // Badges in Detail
    if (detailStatus) {
        detailStatus.innerHTML = "";
        const badge = document.createElement("span");
        badge.className = "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ";
        if (lead.status === 'NO_WEBSITE') {
            badge.className += "bg-red-100 text-red-700";
            badge.textContent = "No Website";
        } else if (lead.status === 'LOW_QUALITY') {
            badge.className += "bg-amber-100 text-amber-700";
            badge.textContent = "Low Quality";
        } else {
            badge.className += "bg-emerald-100 text-emerald-700";
            badge.textContent = "Good Standing";
        }
        detailStatus.appendChild(badge);
    }

    // Reset save button state
    if (saveLeadBtn) {
        saveLeadBtn.textContent = "Save to My Leads";
        saveLeadBtn.disabled = false;
        saveLeadBtn.classList.remove("bg-green-600", "hover:bg-green-700");
        saveLeadBtn.classList.add("bg-indigo-600", "hover:bg-indigo-700");
    }
}

if (backToListBtn) {
    backToListBtn.addEventListener("click", () => {
        if (detailView) detailView.classList.add("hidden");
        if (resultsArea) resultsArea.classList.remove("hidden");
        if (scanControls) scanControls.classList.remove("hidden"); // Show scan button again
    });
}

if (saveLeadBtn) {
    saveLeadBtn.addEventListener("click", async () => {
        if (!selectedLead) return;

        saveLeadBtn.textContent = "Saving...";
        saveLeadBtn.disabled = true;

        try {
            const success = await syncSingleLead(selectedLead);
            if (success) {
                saveLeadBtn.textContent = "Saved Successfully!";
                saveLeadBtn.classList.remove("bg-indigo-600", "hover:bg-indigo-700");
                saveLeadBtn.classList.add("bg-green-600", "hover:bg-green-700");
            } else {
                throw new Error("API returned failure");
            }
        } catch (err) {
            console.error(err);
            saveLeadBtn.textContent = "Error Saving";
            setTimeout(() => {
                saveLeadBtn.textContent = "Save to My Leads";
                saveLeadBtn.disabled = false;
            }, 2000);
        }
    });
}

async function syncSingleLead(lead) {
    const response = await fetch(`${BACKEND_URL}/api/ext/sync-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: [lead], userId: currentUser ? currentUser.id : "unknown" })
    });
    const result = await response.json();
    if (response.ok && currentUser) {
        currentUser.leadsRemaining -= result.savedCount;
        showScannerUi();
    }
    return response.ok;
}


// --- Export Logic ---

if (exportBtn) {
    exportBtn.addEventListener("click", () => {
        if (!currentLeads || currentLeads.length === 0) return;

        const header = ["Name", "Category", "Status", "Webiste", "Phone", "Rating", "Reviews", "Map Link"];
        const rows = currentLeads.map(l => [
            `"${l.name.replace(/"/g, '""')}"`,
            `"${l.category || ''}"`,
            l.status,
            l.website || '',
            l.phone || '',
            l.rating,
            l.reviews,
            l.mapsLink || ''
        ]);

        const csvContent = [
            header.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// --- Bulk Sync Logic ---

if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
        if (currentLeads.length === 0) return;

        syncBtn.textContent = "Syncing...";
        syncBtn.disabled = true;

        try {
            const response = await fetch(`${BACKEND_URL}/api/ext/sync-leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ leads: currentLeads, userId: currentUser ? currentUser.id : "unknown" })
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Successfully synced ${result.savedCount} leads!`);
                syncBtn.textContent = "Sync Complete";

                if (currentUser) {
                    currentUser.leadsRemaining -= result.savedCount;
                    showScannerUi();
                }

                setTimeout(() => {
                    syncBtn.textContent = "Sync to WebFindLead CRM";
                    syncBtn.disabled = false;
                }, 2000);
            } else {
                throw new Error("Sync failed.");
            }
        } catch (error) {
            console.error("Sync error:", error);
            alert("Failed to sync.");
            syncBtn.textContent = "Sync to WebFindLead CRM";
            syncBtn.disabled = false;
        }
    });
}
