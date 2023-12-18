const tabs = await chrome.tabs.query({
    url: [
        "https://*/*",
    ]
});

const collator = new Intl.Collator();
tabs.sort((a, b) => collator.compare(a.title, b.title));

const template = document.getElementById("li_template");
const elements = new Set();

for (const tab of tabs) {
    const element = template.content.firstElementChild.cloneNode(true);

    const title = tab.title.trim();
    const pathname = new URL(tab.url).pathname.trim();

    console.log(title, pathname);

    element.querySelector(".title").textContent = title;
    element.querySelector(".pathname").textContent = pathname;

    element.querySelector("a").addEventListener("click", async () => {
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
    });

    elements.add(element);
}

document.querySelector("ul").append(...elements);

const button = document.querySelector("button");
button.addEventListener("click", async () => {

    const uniqueMainDomains = Array.from(new Set(tabs.map(tab => getMainDomain(tab.url))));
    // Create tab groups based on unique hostnames
    for (const mainDomain of uniqueMainDomains) {
        const tabIds = tabs.filter(tab => getMainDomain(tab.url)  === mainDomain).map(tab => tab.id);
        const group = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(group, { title: mainDomain });
    }
})

// Function to extract the main domain from a URL
function getMainDomain(url) {
    try {
        const hostname = new URL(url).hostname;
        const parts = hostname.split('.');
        return parts[parts.length - 2]; // Return the second-to-last part as the main domain
    } catch (error) {
        console.error('Error extracting main domain:', error);
        return null;
    }
}