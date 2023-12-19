// all active tabs
const tabs = await chrome.tabs.query({
    url: [
        "https://*/*",
    ]
});

// Sort Tab list by their title
const collator = new Intl.Collator();
tabs.sort((a, b) => collator.compare(a.title, b.title));

//load intial tab list with no URL
const template = document.getElementById("li_template");
const elements = new Set();
loadTabList(false);

// load tab list when toggle switch is clicked
var toggleSwitch = document.getElementById("toggle_switch");
toggleSwitch.addEventListener("click", () => {
    loadTabList(toggleSwitch.checked)
});

function loadTabList(isChecked) {
    elements.clear();
    console.log(isChecked);
    for (const tab of tabs) {
        const element = template.content.firstElementChild.cloneNode(true);

        element.querySelector(".title").textContent = tab.title.trim();
        const urlElement = element.querySelector(".url");
        if (isChecked) {
            urlElement.style.display = "block";
            urlElement.textContent = tab.url;
        }
        else {
            urlElement.style.display = "none";
        }
        // Made this tab active when the list item is clicked
        element.querySelector("a").addEventListener("click", async () => {
            await chrome.tabs.update(tab.id, { active: true });
            await chrome.windows.update(tab.windowId, { focused: true });
        });

        elements.add(element);
    }
    document.querySelector("ul").innerHTML = "";
    document.querySelector("ul").append(...elements);
}

// Create tab groups based on unique domains
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

// Group tab when button is clicked
const button = document.querySelector("button");
button.addEventListener("click", async () => {
    for (const mainDomain of uniqueMainDomains) {
        const tabIds = tabs.filter(tab => getMainDomain(tab.url)  === mainDomain).map(tab => tab.id);
        const group = await chrome.tabs.group({ tabIds });

        await chrome.tabGroups.update(group, { title: mainDomain, collapsed: true });
    }
})


// Function to group a specific tab group
async function groupThisTab(domain) {
    const tabIds = tabs.filter(tab => getMainDomain(tab.url) === domain).map(tab => tab.id);
    const group = await chrome.tabs.group({ tabIds });

    await chrome.tabGroups.update(group, { title: domain, collapsed: true });
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