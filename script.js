document.addEventListener("DOMContentLoaded", () => {
    initializeEventListeners();
    showEncrypt();

    try {
        Telegram.WebApp.requestFullscreen();
    } catch {
        console.warn("Fullscreen mode is not supported. Running in normal mode.");
    }
});

function initializeEventListeners() {
    document.getElementById("encryptTab").addEventListener("click", showEncrypt);
    document.getElementById("decryptTab").addEventListener("click", showDecrypt);
    document.getElementById("TransactionsTab").addEventListener("click", showWallet); // إضافة المستمع هنا

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

function showWallet() {
    document.getElementById("WalletAnalyzer").classList.remove("hidden");
    document.getElementById("encryptSection").classList.add("hidden");
    document.getElementById("decryptSection").classList.add("hidden");
    document.getElementById("pagetitle").classList.add("hidden");

    document.getElementById("encryptTab").classList.remove("active");
    document.getElementById("decryptTab").classList.remove("active");
    document.getElementById("TransactionsTab").classList.add("active");
}

function resetEventListeners() {
    let buttons = ["encryptButton", "decryptButton", "copyEncrypt", "copyDecrypt"];
    buttons.forEach(id => {
        let button = document.getElementById(id);
        let newButton = button.cloneNode(true);
        button.replaceWith(newButton); 
    });

    initializeEventListeners();
}


function clearFields(container) {
    container.querySelectorAll("input, textarea").forEach(field => field.value = "");
}

function showEncrypt() {
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


function encryptText() {
    let text = document.getElementById("encryptInput").value.trim();
    let key = document.getElementById("encryptKey").value.trim();

    if (!text || !key) {
        showNotification("⚠️ Enter text and key!", "warning");
        return;
    }

    let encrypted = CryptoJS.AES.encrypt(text, key).toString();
    document.getElementById("encryptOutput").value = encrypted;
    showNotification("✅ Encryption successful!", "success");
}

function decryptText() {
    let encryptedText = document.getElementById("decryptInput").value.trim();
    let key = document.getElementById("decryptKey").value.trim();

    if (!encryptedText || !key) {
        showNotification("⚠️ Enter encrypted text and key!", "warning");
        return;
    }

    try {
        let bytes = CryptoJS.AES.decrypt(encryptedText, key);
        let originalText = bytes.toString(CryptoJS.enc.Utf8);

        if (!originalText) throw new Error();

        document.getElementById("decryptOutput").value = originalText;
        showNotification("✅ Decryption successful!", "success");
    } catch {
        document.getElementById("decryptKey").value = "";
        document.getElementById("decryptInput").value = "";
        document.getElementById("decryptOutput").value = "";
        
        showNotification("❌ Incorrect key or invalid text!", "error");
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
    
    try {
        console.log("Fetching balance for:", address);
        let balanceResponse = await fetch(BALANCE_API);
        if (!balanceResponse.ok) throw new Error(`Balance API Error: ${balanceResponse.status}`);
        let balanceData = await balanceResponse.json();
        let totalBalance = parseFloat(balanceData.balance) / 1e9;
        console.log("Balance data:", balanceData);

        let allTransactions = await fetchAllTransactions(address);
        analyzeTONData(allTransactions, totalBalance);
    } catch (error) {
        console.error("Error fetching TON data:", error);
        alert("Failed to fetch data: " + error.message);
    }
}

async function fetchAllTransactions(address) {
    let transactions = [];
    let lastLt = null;
    let hasMore = true;
    let requestCount = 0;

    while (hasMore) {
        if (requestCount >= 10) { // تجنب الحظر بعد عدد معين من الطلبات
            console.warn("Rate limit reached, waiting before retrying...");
            await delay(5000); // انتظر 5 ثوانٍ قبل المتابعة
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
                await delay(5000); // انتظر 5 ثوانٍ ثم أعد المحاولة
                continue;
            }
            if (!response.ok) throw new Error(`Transactions API Error: ${response.status}`);
            let data = await response.json();

            if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
                transactions.push(...data.transactions);
                lastLt = data.transactions[data.transactions.length - 1].transaction_id.lt; // تحديث lastLt
                console.log(`Fetched ${data.transactions.length} transactions, total: ${transactions.length}`);
                requestCount++;
                await delay(1000); // إضافة تأخير زمني بسيط (1 ثانية) بين الطلبات
            } else {
                hasMore = false;
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            break; // أوقف التكرار عند حدوث خطأ
        }
    }
    return transactions;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function analyzeTONData(transactions, totalBalance) {
    let sentCount = 0, receivedCount = 0, totalComments = 0;
    let todaySent = 0, todayReceived = 0, todayBalance = 0;
    const today = new Date().toISOString().split('T')[0];

    transactions.forEach(tx => {
        let timestamp = new Date(tx.utime * 1000).toISOString().split('T')[0];

        if (tx.in_msg) {
            receivedCount++;
            if (timestamp === today) {
                todayReceived++;
                todayBalance += parseInt(tx.in_msg.value) / 1e9;
            }
            if (tx.in_msg.msg_data && tx.in_msg.msg_data.body) totalComments++;
        }

        if (tx.out_msgs && tx.out_msgs.length > 0) {
            sentCount++;
            if (timestamp === today) todaySent++;
            tx.out_msgs.forEach(msg => {
                if (msg.msg_data && msg.msg_data.body) totalComments++;
            });
        }
    });
    
    displayTONData(sentCount, receivedCount, totalComments, todaySent, todayReceived, todayBalance, totalBalance);
}

function displayTONData(sent, received, comments, todaySent, todayReceived, todayBalance, totalBalance) {
    document.getElementById("totalSent").textContent = sent;
    document.getElementById("totalReceived").textContent = received;
    document.getElementById("totalComments").textContent = comments;
    document.getElementById("todaySent").textContent = todaySent;
    document.getElementById("todayReceived").textContent = todayReceived;
    document.getElementById("todayBalance").textContent = todayBalance.toFixed(6) + " TON";
    document.getElementById("totalBalance").textContent = totalBalance.toFixed(6) + " TON";
}

document.getElementById("checkButton").addEventListener("click", () => {
    let address = document.getElementById("walletAddress").value.trim();
    if (address) {
        fetchTONData(address);
    } else {
        alert("Please enter a valid TON wallet address");
    }
});
