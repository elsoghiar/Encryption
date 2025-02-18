function showEncrypt() {
    document.getElementById("encryptSection").classList.remove("hidden");
    document.getElementById("decryptSection").classList.add("hidden");
    updateActiveButton("showEncryptBtn");
}

function showDecrypt() {
    document.getElementById("decryptSection").classList.remove("hidden");
    document.getElementById("encryptSection").classList.add("hidden");
    updateActiveButton("showDecryptBtn");
}

function updateActiveButton(activeId) {
    document.querySelectorAll('.toggle-buttons button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(activeId).classList.add('active');
}

function encryptText() {
    let text = document.getElementById("inputEncrypt").value;
    let key = document.getElementById("encryptionKey").value;

    if (!text || !key) {
        showNotification("⚠️ أدخل النص ومفتاح التشفير!");
        return;
    }

    let encrypted = CryptoJS.AES.encrypt(text, key).toString();
    document.getElementById("outputEncrypt").value = encrypted;
}

function decryptText() {
    let encryptedText = document.getElementById("inputDecrypt").value;
    let key = document.getElementById("decryptionKey").value;

    if (!encryptedText || !key) {
        showNotification("⚠️ أدخل النص المشفر ومفتاح فك التشفير!");
        return;
    }

    try {
        let decryptedBytes = CryptoJS.AES.decrypt(encryptedText, key);
        let originalText = decryptedBytes.toString(CryptoJS.enc.Utf8);

        if (!originalText) {
            throw new Error("Invalid decryption");
        }

        document.getElementById("outputDecrypt").value = originalText;
    } catch (error) {
        showNotification("❌ المفتاح غير صحيح أو النص غير صالح!");
    }
}

function copyText(elementId) {
    let textElement = document.getElementById(elementId);
    textElement.select();
    document.execCommand("copy");
    showNotification("✅ تم النسخ!");
}

function showNotification(message) {
    let notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.remove("hidden");

    setTimeout(() => {
        notification.classList.add("hidden");
    }, 2000);
}
