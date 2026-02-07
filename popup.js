document.getElementById("enable").onclick = async () => {
    const theme = document.getElementById("theme").value;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
        await chrome.tabs.sendMessage(tab.id, { action: "enable", theme: theme });
        window.close(); // Closes popup after clicking
    } catch (err) {
        alert("Please refresh this page once to activate Reader View!");
    }
};

document.getElementById("disable").onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
        await chrome.tabs.sendMessage(tab.id, { action: "disable" });
        window.close();
    } catch (err) {
        // Silently fail if not in reader mode
    }
};