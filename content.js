chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "enable") {
        enableReadingView(request.theme);
    } else if (request.action === "disable") {
        disableReadingView();
    }
});

function enableReadingView(theme) {
    if (document.getElementById("reader-overlay")) {
        document.getElementById("reader-overlay").className = theme;
        return;
    }

    const container = findBestContentContainer();
    if (!container) return alert("Could not find article content.");

    injectReaderStyles();

    const title = extractTitle(container);
    const blocks = extractParagraphs(container);

    let tocItems = [];
    const contentHTML = blocks.map((b, index) => {
        if (b.type === "h2" || b.type === "h3") {
            const anchorId = `reader-sec-${index}`;
            tocItems.push({ type: b.type, text: b.text, id: anchorId });
            return `<${b.type} id="${anchorId}">${b.text}</${b.type}>`;
        }
        return `<p>${b.text}</p>`;
    }).join("");

    const tocHTML = tocItems.length > 1 
        ? `<nav class="reader-toc">
            <div class="toc-label">Contents</div>
            ${tocItems.map(item => `<a href="#${item.id}" class="toc-link-${item.type}">${item.text}</a>`).join("")}
           </nav>` 
        : "";

    const overlay = document.createElement("div");
    overlay.id = "reader-overlay";
    overlay.className = theme;

    overlay.innerHTML = `
        <button id="reader-close-ui" class="reader-exit-btn" title="Exit Reader">✕</button>
        
        <div class="reader-toolbar">
            <div class="theme-selectors">
                <button class="t-btn paper" data-theme="paperlike">📜</button>
                <button class="t-btn white" data-theme="light">☀️</button>
                <button class="t-btn black" data-theme="dark">🌙</button>
            </div>
        </div>

        <div class="reader-canvas">
            ${tocHTML}
            <div class="reader-paper">
                <h1 class="reader-title">${title}</h1>
                <div class="reader-content">${contentHTML}</div>
                <div class="reader-footer">
                    <p>End of Content</p>
                    <a href="https://github.com/OnlineBunker" target="_blank" class="github-link">github.com/OnlineBunker</a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    // Theme Switcher Logic
    overlay.querySelectorAll('.t-btn').forEach(btn => {
        btn.onclick = () => { overlay.className = btn.getAttribute('data-theme'); };
    });

    // Close Button Logic
    document.getElementById("reader-close-ui").onclick = disableReadingView;

    // Smooth Scroll TOC
    overlay.querySelectorAll('.reader-toc a').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const target = document.getElementById(link.getAttribute('href').substring(1));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        };
    });
}

function disableReadingView() {
    const overlay = document.getElementById("reader-overlay");
    if (overlay) {
        overlay.remove();
        document.body.style.overflow = "";
    }
}

function findBestContentContainer() {
    const semanticMatch = document.querySelector("article") || document.querySelector("main") || document.querySelector(".post-content") || document.querySelector("#content");
    const candidates = document.querySelectorAll("div, section, article");
    let bestElement = semanticMatch, maxScore = 0;
    candidates.forEach(el => {
        if (!isVisible(el)) return;
        let score = 0;
        const ps = el.querySelectorAll("p");
        ps.forEach(p => { if (p.innerText.trim().length > 50) score += p.innerText.trim().length; });
        if (el.tagName.toLowerCase() === 'article') score *= 1.2;
        if (score > maxScore) { maxScore = score; bestElement = el; }
    });
    return maxScore > 500 ? bestElement : semanticMatch;
}

function extractParagraphs(container) {
    const blocks = [];
    container.querySelectorAll("h2, h3, p").forEach(el => {
        const text = el.innerText.trim();
        if (text.length < 35 || /cookie|subscribe|newsletter|sign up|log in/i.test(text)) return;
        blocks.push({ type: el.tagName.toLowerCase(), text: text });
    });
    return blocks;
}

function extractTitle(container) {
    const h1 = document.querySelector("h1");
    if (h1 && h1.innerText.trim().length > 5) return h1.innerText.trim();
    return document.title.split(/[|-]/)[0].trim();
}

function isVisible(el) {
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const idAndClass = (el.id + " " + el.className).toLowerCase();
    return !(/nav|footer|header|menu|sidebar|comment|social/i.test(idAndClass));
}

function injectReaderStyles() {
    if (document.getElementById("reader-styles")) return;
    const link = document.createElement("link");
    link.id = "reader-styles";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("styles.css");
    document.head.appendChild(link);
}