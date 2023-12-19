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

const groupTemplate = document.getElementById("gr_template");
const groupElements = new Set();

const uniqueMainDomains = Array.from(new Set(tabs.map(tab => getMainDomain(tab.url))));

for (const mainDomain of uniqueMainDomains) {
    const groupElement = groupTemplate.content.firstElementChild.cloneNode(true);
    groupElement.querySelector(".group-title").textContent = mainDomain;
    
    const button = groupElement.querySelector(".group_button");
    button.classList.add(mainDomain);
    button.addEventListener("click", async () => groupThisTab(mainDomain));

    groupElements.add(groupElement);
}

document.querySelector("ol").append(...groupElements);

const button = document.querySelector("button");
button.addEventListener("click", async () => {
    // Create tab groups based on unique domains
    for (const mainDomain of uniqueMainDomains) {
        const tabIds = tabs.filter(tab => getMainDomain(tab.url)  === mainDomain).map(tab => tab.id);
        const group = await chrome.tabs.group({ tabIds });

        await chrome.tabGroups.update(group, { title: mainDomain });
    }
})


// Function to group a specific tab group
async function groupThisTab(domain) {
    const tabIds = tabs.filter(tab => getMainDomain(tab.url) === domain).map(tab => tab.id);
    const group = await chrome.tabs.group({ tabIds });

    await chrome.tabGroups.update(group, { title: domain });
}


// Function to extract the main domain from a URL
function getMainDomain(url) {
    try {
        const hostname = new URL(url).hostname;
        const parts = hostname.split('.');
        const mainDomain = parts[parts.length - 2];// Return the second-to-last part as the main domain
        return mainDomain.charAt(0).toUpperCase() + mainDomain.substr(1).toLowerCase()
    } catch (error) {
        console.error('Error extracting main domain:', error);
        return null;
    }
}