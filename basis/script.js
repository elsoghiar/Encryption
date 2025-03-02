document.addEventListener("DOMContentLoaded", () => {
    initializeEventListeners();
    showEncrypt();
});


function initializeEventListeners() {
    document.getElementById("encryptTab").addEventListener("click", showEncrypt);
    document.getElementById("decryptTab").addEventListener("click", showDecrypt);
    document.getElementById("TransactionsTab").addEventListener("click", showWallet); 
    document.getElementById("ipTab").addEventListener("click", showip);
    document.getElementById("encryptButton").addEventListener("click", () => {
        encryptText();
        resetEventListeners();
    });
    document.getElementById("decryptButton").addEventListener("click", () => {
        decryptText();
        resetEventListeners();
    });
    document.getElementById("copyEncrypt").addEventListener("click", () => {
        copyText('encryptOutput');
        resetEventListeners();
    });
    document.getElementById("copyDecrypt").addEventListener("click", () => {
        copyText('decryptOutput');
        resetEventListeners();
    });
}

function showip() {
    document.getElementById("ipSection").classList.remove("hidden");
    document.getElementById("WalletAnalyzer").classList.add("hidden");
    document.getElementById("encryptSection").classList.add("hidden");
    document.getElementById("decryptSection").classList.add("hidden");
    document.getElementById("pagetitle").classList.add("hidden");

    document.getElementById("encryptTab").classList.remove("active");
    document.getElementById("decryptTab").classList.remove("active");
    document.getElementById("TransactionsTab").classList.remove("active");
    document.getElementById("ipTab").classList.add("active");
}

function showWallet() {
    document.getElementById("ipTab").classList.remove("active");
    document.getElementById("ipSection").classList.add("hidden");
    document.getElementById("WalletAnalyzer").classList.remove("hidden");
    document.getElementById("encryptSection").classList.add("hidden");
    document.getElementById("decryptSection").classList.add("hidden");
    document.getElementById("pagetitle").classList.add("hidden");

    document.getElementById("encryptTab").classList.remove("active");
    document.getElementById("decryptTab").classList.remove("active");
    document.getElementById("TransactionsTab").classList.add("active");
}

function resetEventListeners() {
    let buttons = [
        { id: "encryptButton", handler: encryptText },
        { id: "decryptButton", handler: decryptText },
        { id: "copyEncrypt", handler: () => copyText('encryptOutput') },
        { id: "copyDecrypt", handler: () => copyText('decryptOutput') }
    ];

    buttons.forEach(({ id, handler }) => {
        let button = document.getElementById(id);
        let newButton = button.cloneNode(true);
        
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener("click", () => {
            handler();
            resetEventListeners();
        });
    });
}


function clearFields(container) {
    container.querySelectorAll("input, textarea").forEach(field => field.value = "");
}

function showEncrypt() {
    document.getElementById("ipTab").classList.remove("active");
    document.getElementById("ipSection").classList.add("hidden");

    document.getElementById("encryptSection").classList.remove("hidden");
    document.getElementById("pagetitle").classList.remove("hidden");
    document.getElementById("decryptSection").classList.add("hidden");
    document.getElementById("WalletAnalyzer").classList.add("hidden");
    document.getElementById("TransactionsTab").classList.remove("active");
    document.getElementById("encryptTab").classList.add("active");
    document.getElementById("decryptTab").classList.remove("active");
    clearFields(document.getElementById("decryptSection"));
}

function showDecrypt() {
    document.getElementById("ipTab").classList.remove("active");
    document.getElementById("ipSection").classList.add("hidden");

    document.getElementById("decryptSection").classList.remove("hidden");
    document.getElementById("pagetitle").classList.remove("hidden");
    document.getElementById("WalletAnalyzer").classList.add("hidden");
    document.getElementById("encryptSection").classList.add("hidden");
    document.getElementById("TransactionsTab").classList.remove("active");
    document.getElementById("decryptTab").classList.add("active");
    document.getElementById("encryptTab").classList.remove("active");
    clearFields(document.getElementById("encryptSection"));
}

function showNotification(message, type = "success") {
    let notification = document.getElementById("notification");
    
    notification.style.opacity = "1";
    notification.style.display = "block";
    
    notification.textContent = message;
    notification.className = `notification-${type}`;

    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.style.display = "none", 500);
    }, 2500);
}

const DEFAULT_KEY = "7x!Q@z#L$9%P^3&K*8(Y)0_+=-A|B{C}D[E]F\\G/H<I>J?K:L;MN,O.P/Q1R2S3T4U5V6W7X8Y9Z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2";

function encryptText() {
    
    let text = document.getElementById("encryptInput").value.trim();
    let key = document.getElementById("encryptKey").value.trim() || DEFAULT_KEY;

    if (!text) {
        showNotification("⚠️ Enter text to encrypt.", "warning");
        return;
    }

    try {
        let encrypted = CryptoJS.AES.encrypt(text, key).toString();
        document.getElementById("encryptOutput").value = encrypted;
        showNotification("✅ Encryption completed successfully", "success");
    } catch (error) {
        console.error("Encryption error:", error);
        showNotification("❌ Failed to encrypt text.", "error");
    }
}

function decryptText() {
    let encryptedText = document.getElementById("decryptInput").value.trim();
    let key = document.getElementById("decryptKey").value.trim() || DEFAULT_KEY;

    if (!encryptedText) {
        showNotification("⚠️ Enter the encrypted text to decrypt.", "warning");
        return;
    }

    try {
        let bytes = CryptoJS.AES.decrypt(encryptedText, key);
        let originalText = bytes.toString(CryptoJS.enc.Utf8);

        if (!originalText) throw new Error("Decryption failed.");

        document.getElementById("decryptOutput").value = originalText;
        showNotification("✅ Decrypted successfully", "success");
    } catch (error) {  
        console.error("Decryption error:", error);
        document.getElementById("decryptKey").value = "";
        document.getElementById("decryptInput").value = "";
        document.getElementById("decryptOutput").value = "";
        showNotification("❌ Invalid key or encrypted text.", "error");
    }
}

function copyText(elementId) {
    let textElement = document.getElementById(elementId);
    if (textElement.value.trim() === "") {
        showNotification("⚠️ No text to copy!", "warning");
        return;
    }
    navigator.clipboard.writeText(textElement.value);
    showNotification("✅ Text copied!", "success");
}


async function fetchTONData(address) {
    const BALANCE_API = `https://tonapi.io/v2/accounts/${address}`;
    const TOKENS_API = `https://tonapi.io/v2/accounts/${address}/jettons`;
    
    try {
        console.log("Fetching balance for:", address);
        let balanceResponse = await fetch(BALANCE_API);
        if (!balanceResponse.ok) throw new Error(`Balance API Error: ${balanceResponse.status}`);
        let balanceData = await balanceResponse.json();
        let totalBalance = parseFloat(balanceData.balance) / 1e9;
        console.log("Balance data:", balanceData);

        let tokensResponse = await fetch(TOKENS_API);
        if (!tokensResponse.ok) throw new Error(`Tokens API Error: ${tokensResponse.status}`);
        let tokensData = await tokensResponse.json();
        console.log("Tokens data:", tokensData);

        let todayTransactions = await fetchTodayTransactions(address);
        analyzeTodayData(todayTransactions, totalBalance, tokensData);
    } catch (error) {
        console.error("Error fetching TON data:", error);
        showNotification("❌ Failed to fetch data: " + error.message, "error"); 
    }
}

async function fetchTodayTransactions(address) {
    let today = new Date().toISOString().split('T')[0];
    let transactions = [];
    let lastLt = null;
    let hasMore = true;
    let requestCount = 0;

    while (hasMore) {
        if (requestCount >= 10) {
            console.warn("Rate limit reached, waiting before retrying...");
            await delay(5000);
            requestCount = 0;
        }

        let url = `https://tonapi.io/v2/blockchain/accounts/${address}/transactions?limit=100`;
        if (lastLt) {
            url += `&before_lt=${lastLt}`;
        }
        console.log("Fetching transactions from:", url);
        try {
            let response = await fetch(url);
            if (response.status === 429) {
                console.warn("Too many requests, waiting...");
                await delay(5000);
                continue;
            }
            if (!response.ok) throw new Error(`Transactions API Error: ${response.status}`);
            let data = await response.json();

            let filteredTransactions = data.transactions.filter(tx => 
                new Date(tx.utime * 1000).toISOString().split('T')[0] === today
            );
            transactions.push(...filteredTransactions);
            
            if (filteredTransactions.length > 0) {
                let newLastLt = filteredTransactions[filteredTransactions.length - 1]?.transaction_id?.lt || null;
                if (newLastLt === lastLt) {
                    console.log("Duplicate lastLt detected, stopping fetch.");
                    hasMore = false;
                } else {
                    lastLt = newLastLt;
                    console.log(`Fetched ${filteredTransactions.length} today's transactions, total: ${transactions.length}`);
                    requestCount++;
                    await delay(1000);
                }
            } else {
                hasMore = false;
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            break;
        }
    }
    return transactions;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function analyzeTodayData(transactions, totalBalance, tokensData) {
    let todaySent = 0, todayReceived = 0, todayComments = 0, todayBalance = 0;
    
    let tokenDetails = tokensData.balances.map(token => {
        return {
            symbol: token.jetton.symbol || "N/A",
            balance: token.balance / Math.pow(10, token.jetton.decimals),
            image: token.jetton.image || "https://via.placeholder.com/40"
        };
    });

    transactions.forEach(tx => {
        if (tx.in_msg) {
            todayReceived++;
            todayBalance += parseInt(tx.in_msg.value) / 1e9;
            if (tx.in_msg.msg_data && tx.in_msg.msg_data.body) todayComments++;
        }
        if (tx.out_msgs && tx.out_msgs.length > 0) {
            todaySent++;
            tx.out_msgs.forEach(msg => {
                if (msg.msg_data && msg.msg_data.body) todayComments++;
            });
        }
    });

    displayTodayData(todaySent, todayReceived, todayComments, todayBalance, totalBalance, tokenDetails);
}


function displayTodayData(todaySent, todayReceived, todayComments, todayBalance, totalBalance, tokenDetails) {
    document.getElementById("todaySent").textContent = todaySent >= 100 ? "100+" : todaySent;
    document.getElementById("todayReceived").textContent = todayReceived >= 100 ? "100+" : todayReceived;
    document.getElementById("todayComments").textContent = todayComments >= 100 ? "100+" : todayComments;
    document.getElementById("todayBalance").textContent = todayBalance.toFixed(6) + " TON";
    document.getElementById("totalBalance").textContent = totalBalance.toFixed(6) + " TON";

    let tokenList = document.getElementById("tokenList");
    let modalTokenList = document.getElementById("modalTokenList");
    let noTokensMessage = document.getElementById("noTokensMessage");

    tokenList.innerHTML = "";
    modalTokenList.innerHTML = "";

    if (tokenDetails.length === 0) {
        noTokensMessage.style.display = "block";
    } else {
        noTokensMessage.style.display = "none";
        tokenDetails.forEach(token => {
            let listItem = document.createElement("li");
            listItem.className = "token-item";

            let tokenImg = document.createElement("img");
            tokenImg.src = token.image;
            tokenImg.alt = token.name;
            tokenImg.className = "token-img";

            let tokenInfo = document.createElement("div");
            tokenInfo.className = "token-info";
            tokenInfo.innerHTML = `<small>${token.symbol}</small>`;

            let tokenBalance = document.createElement("span");
            tokenBalance.textContent = token.balance.toFixed(6);

            listItem.appendChild(tokenImg);
            listItem.appendChild(tokenInfo);
            listItem.appendChild(tokenBalance);
            if (tokenList.children.length < 1) {
                tokenList.appendChild(listItem.cloneNode(true));
            }
            modalTokenList.appendChild(listItem);
        });
    }
}

document.getElementById("showTokensButton").addEventListener("click", function () {
    document.getElementById("tokenModal").style.display = "block";
});

document.querySelector(".close-button").addEventListener("click", function () {
    document.getElementById("tokenModal").style.display = "none";
});

window.addEventListener("click", function (event) {
    let modal = document.getElementById("tokenModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});


document.getElementById("checkButton").addEventListener("click", () => {
    let address = document.getElementById("walletAddress").value.trim();
    if (address) {
        fetchTONData(address);
    } else {
        showNotification("⚠️ Please enter a valid TON wallet address", "warning");
    }
});




document.addEventListener("DOMContentLoaded", () => {
    getUserIP();
});

let map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 20
}).addTo(map);

async function getUserIP() {
    try {
        const res = await fetch("https://api64.ipify.org?format=json");
        const data = await res.json();
        document.getElementById("ipInput").value = data.ip;
        getIPDetails();
    } catch (error) {
        console.error("Error fetching user IP:", error);
    }
}

async function getIPDetails() {
    let ip = document.getElementById("ipInput").value;
    if (!ip) {
        showNotification("Please enter an IP address.");
        return;
    }

    try {
        const res = await fetch(`https://ipwhois.app/json/${ip}`);
        const data = await res.json();

        let details = `
            <div class="ip-row"><span class="ip-label">IP</span> <span class="ip-value">${data.ip}</span></div>
            <div class="ip-row"><span class="ip-label">Continent</span> <span class="ip-value">${data.continent}</span></div>
            <div class="ip-row"><span class="ip-label">Country</span> <span class="ip-value">${data.country} (${data.country_code})</span></div>
            <div class="ip-row"><span class="ip-label">Capital</span> <span class="ip-value">${data.country_capital}</span></div>
            <div class="ip-row"><span class="ip-label">City</span> <span class="ip-value">${data.city}</span></div>
            <div class="ip-row"><span class="ip-label">Region</span> <span class="ip-value">${data.region}</span></div>
            <div class="ip-row"><span class="ip-label">Latitude</span> <span class="ip-value">${data.latitude}</span></div>
            <div class="ip-row"><span class="ip-label">Longitude</span> <span class="ip-value">${data.longitude}</span></div>
            <div class="ip-row"><span class="ip-label">ISP</span> <span class="ip-value">${data.isp}</span></div>
            <div class="ip-row"><span class="ip-label">Organization</span> <span class="ip-value">${data.org}</span></div>
            <div class="ip-row"><span class="ip-label">Timezone</span> <span class="ip-value">${data.timezone}</span></div>
            <div class="ip-row"><span class="ip-label">Currency</span> <span class="ip-value">${data.currency} (${data.currency_code})</span></div>
            <div class="ip-row"><span class="ip-label">Calling Code</span> <span class="ip-value">+${data.calling_code}</span></div>
        `;

        document.getElementById("ipDetails").innerHTML = details;
        updateMap(data.latitude, data.longitude, `${data.city}, ${data.country}`);

    } catch (error) {
        console.error("Error fetching IP data:", error);
    }
}

function updateMap(lat, lon, label) {
    map.setView([lat, lon], 12);
    L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>${label}</b>`).openPopup();
}
