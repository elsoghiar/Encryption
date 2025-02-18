function showEncrypt() {
    document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
    document.getElementById("encryptSection").classList.remove("hidden");
    hideAllOutputs();
    updateActiveButton("showEncryptBtn");
}

function showDecrypt() {
    document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));
    document.getElementById("decryptSection").classList.remove("hidden");
    hideAllOutputs();
    updateActiveButton("showDecryptBtn");
}

function updateActiveButton(activeId) {
    document.querySelector(".toggle-buttons .active")?.classList.remove("active");
    document.getElementById(activeId).classList.add("active");
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
    hideAllOutputs();
    document.getElementById("outputEncryptSection").classList.remove("hidden");
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

        if (originalText.trim() === "") {
            showNotification("❌ المفتاح غير صحيح أو النص غير صالح!");
            return;
        }

        document.getElementById("outputDecrypt").value = originalText;
        hideAllOutputs();
        document.getElementById("outputDecryptSection").classList.remove("hidden");
    } catch {
        showNotification("❌ المفتاح غير صحيح أو النص غير صالح!");
    }
}

function copyText(elementId) {
    let textElement = document.getElementById(elementId);
    navigator.clipboard.writeText(textElement.value);
    showNotification("✅ تم النسخ!");
}

function showNotification(message) {
    let notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.remove("hidden");
    setTimeout(() => notification.classList.add("hidden"), 2000);
}

function hideAllOutputs() {
    document.querySelectorAll(".output-section").forEach(section => section.classList.add("hidden"));
}

document.addEventListener("DOMContentLoaded", function() {
    hideAllOutputs();
    showEncrypt();
});
