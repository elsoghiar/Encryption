function showEncrypt() {
    document.getElementById("encryptSection").classList.remove("hidden");
    document.getElementById("decryptSection").classList.add("hidden");
    document.getElementById("encryptTab").classList.add("active");
    document.getElementById("decryptTab").classList.remove("active");
}

function showDecrypt() {
    document.getElementById("decryptSection").classList.remove("hidden");
    document.getElementById("encryptSection").classList.add("hidden");
    document.getElementById("decryptTab").classList.add("active");
    document.getElementById("encryptTab").classList.remove("active");
}

// عرض الإشعارات
function showNotification(message, type = "success") {
    let notification = document.getElementById("notification");
    notification.textContent = message;
    notification.className = `notification-${type}`;
    notification.style.display = "block";

    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.style.display = "none", 500);
    }, 2000);
}

function encryptText() {
    let text = document.getElementById("encryptInput").value;
    let key = document.getElementById("encryptKey").value;

    if (!text || !key) {
        showNotification("⚠️ أدخل النص والمفتاح!", "warning");
        return;
    }

    let encrypted = CryptoJS.AES.encrypt(text, key).toString();
    document.getElementById("encryptOutput").value = encrypted;
    showNotification("✅ تم التشفير بنجاح!", "success");
}

function decryptText() {
    let encryptedText = document.getElementById("decryptInput").value;
    let key = document.getElementById("decryptKey").value;

    if (!encryptedText || !key) {
        showNotification("⚠️ أدخل النص المشفر والمفتاح!", "warning");
        return;
    }

    try {
        let bytes = CryptoJS.AES.decrypt(encryptedText, key);
        let originalText = bytes.toString(CryptoJS.enc.Utf8);

        if (!originalText) throw new Error();

        document.getElementById("decryptOutput").value = originalText;
        showNotification("✅ تم فك التشفير بنجاح!", "success");
    } catch {
        showNotification("❌ مفتاح خاطئ أو نص غير صالح!", "error");
    }
}

function copyText(elementId) {
    let textElement = document.getElementById(elementId);
    navigator.clipboard.writeText(textElement.value);
    showNotification("✅ تم النسخ!", "success");
}

document.addEventListener("DOMContentLoaded", showEncrypt);
