
// Service Worker
// Handles installation and background tasks

chrome.runtime.onInstalled.addListener(() => {
    console.log("WebFindLead Extension Installed");
});

// Listener for messages if needed (e.g. from popup to navigate tabs)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Pass
});
