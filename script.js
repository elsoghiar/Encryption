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
    const TRANSACTIONS_API = `https://tonapi.io/v2/blockchain/accounts/${address}/transactions`;

    try {
        console.log("Fetching balance for:", address);
        let balanceResponse = await fetch(BALANCE_API);
        if (!balanceResponse.ok) throw new Error(`Balance API Error: ${balanceResponse.status}`);
        let balanceData = await balanceResponse.json();
        let totalBalance = parseFloat(balanceData.balance) / 1e9;
        console.log("Balance data:", balanceData);

        console.log("Fetching transactions for:", address);
        let transactionsResponse = await fetch(TRANSACTIONS_API);
        if (!transactionsResponse.ok) throw new Error(`Transactions API Error: ${transactionsResponse.status}`);
        let transactionsData = await transactionsResponse.json();
        console.log("Transactions data:", transactionsData);

        if (!transactionsData.transactions || transactionsData.transactions.length === 0) {
            throw new Error("No transactions found for this address.");
        }

        analyzeTONData(transactionsData.transactions, totalBalance);
    } catch (error) {
        console.error("Error fetching TON data:", error);
        showNotification("Failed to fetch data: " + error.message , "error");
    }
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
        showNotification("Please enter a valid TON wallet address", "warning");
    }
});
