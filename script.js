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
    document.getElementById("decryptSection").classList.add("hidden");
    document.getElementById("WalletAnalyzer").classList.add("hidden");
    document.getElementById("encryptTab").classList.add("active");
    document.getElementById("decryptTab").classList.remove("active");
    clearFields(document.getElementById("decryptSection"));
}

function showDecrypt() {
    document.getElementById("decryptSection").classList.remove("hidden");
    document.getElementById("WalletAnalyzer").classList.add("hidden");
    document.getElementById("encryptSection").classList.add("hidden");
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
