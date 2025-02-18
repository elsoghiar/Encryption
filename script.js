// التنقل بين حاويتي التشفير وفك التشفير
function showEncrypt() {
    document.getElementById("encryptSection").classList.remove("hidden");
    document.getElementById("decryptSection").classList.add("hidden");
    hideAllOutputs();
    updateActiveButton("showEncryptBtn");
}

function showDecrypt() {
    document.getElementById("decryptSection").classList.remove("hidden");
    document.getElementById("encryptSection").classList.add("hidden");
    hideAllOutputs();
    updateActiveButton("showDecryptBtn");
}

// تحديث حالة الزر النشط
function updateActiveButton(activeId) {
    document.querySelectorAll('.toggle-buttons button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(activeId).classList.add('active');
}

// تشفير النص
function encryptText() {
    let text = document.getElementById("inputEncrypt").value;
    let key = document.getElementById("encryptionKey").value;

    if (!text || !key) {
        showNotification("⚠️ أدخل النص ومفتاح التشفير!");
        return;
    }

    let encrypted = CryptoJS.AES.encrypt(text, key).toString();
    document.getElementById("outputEncrypt").value = encrypted;

    // إظهار حاوية الإخراج للتشفير
    document.getElementById("outputEncrypt").parentElement.classList.remove("hidden");
    document.getElementById("outputDecrypt").parentElement.classList.add("hidden");
}

// فك تشفير النص
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

        // إظهار حاوية الإخراج لفك التشفير
        document.getElementById("outputDecrypt").parentElement.classList.remove("hidden");
        document.getElementById("outputEncrypt").parentElement.classList.add("hidden");
    } catch (error) {
        showNotification("❌ المفتاح غير صحيح أو النص غير صالح!");
    }
}

// نسخ النص من حاوية الإخراج
function copyText(elementId) {
    let textElement = document.getElementById(elementId);

    if (!textElement.value) {
        showNotification("⚠️ لا يوجد نص للنسخ!");
        return;
    }

    textElement.select();
    document.execCommand("copy");
    showNotification("✅ تم النسخ!");
}

// عرض رسائل الإشعارات
function showNotification(message) {
    let notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.remove("hidden");

    setTimeout(() => {
        notification.classList.add("hidden");
    }, 2000);
}

// إخفاء جميع حاويات الإخراج
function hideAllOutputs() {
    document.querySelectorAll(".output-section").forEach(section => {
        section.classList.add("hidden");
    });
}

// التأكد من تنفيذ الكود بعد تحميل الصفحة بالكامل
document.addEventListener("DOMContentLoaded", function() {
    hideAllOutputs();
    // جعل حاوية التشفير هي الظاهرة افتراضيًا
    document.getElementById("encryptSection").classList.remove("hidden");
    document.getElementById("decryptSection").classList.add("hidden");
});
