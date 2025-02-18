const SECRET_KEY = "ve4http/#181818rys500348751156trvsjssb}{}÷×<>zkzzbongkey-0120089Mm6522Bdshzgxb@#((_-+xosbsjzbzjzbzz";
const translations = {
    en: {
        title: "🔒 Secure Text Encryptor",
        description: "Encrypt and decrypt text securely using advanced encryption.",
        encryptTitle: "🔐 Encrypt Text",
        encryptBtn: "Encrypt 🔐",
        copyEncryptBtn: "Copy Encrypted Text 📋",
        decryptTitle: "🔓 Decrypt Text",
        decryptBtn: "Decrypt 🔓",
        copyDecryptBtn: "Copy Decrypted Text 📋",
        enterText: "⚠️ Please enter text!",
        enterEncryptedText: "⚠️ Please enter encrypted text!",
        invalidText: "❌ Invalid encrypted text!",
        copied: "✅ Text copied!"
    },
    ar: {
        title: "🔒 مشفر النصوص الآمن",
        description: "قم بتشفير وفك تشفير النصوص بأمان باستخدام تشفير متقدم.",
        encryptTitle: "🔐 تشفير النص",
        encryptBtn: "تشفير",
        copyEncryptBtn: "📋 نسخ النص المشفر",
        decryptTitle: "🔓 فك تشفير النص",
        decryptBtn: "فك التشفير",
        copyDecryptBtn: "📋 نسخ النص الأصلي",
        enterText: "⚠️ الرجاء إدخال نص!",
        enterEncryptedText: "⚠️ الرجاء إدخال النص المشفر!",
        invalidText: "❌ النص المشفر غير صالح!",
        copied: "✅ تم النسخ!"
    }
};

function encryptText() {
    let text = document.getElementById("inputEncrypt").value;

    if (!text) {
        showNotification(translations[currentLang].enterText);
        return;
    }

    let encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    document.getElementById("outputEncrypt").value = encrypted;
}

function decryptText() {
    let encryptedText = document.getElementById("inputDecrypt").value;

    if (!encryptedText) {
        showNotification(translations[currentLang].enterEncryptedText);
        return;
    }

    try {
        let decryptedBytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
        let originalText = decryptedBytes.toString(CryptoJS.enc.Utf8);

        if (!originalText) {
            throw new Error("Invalid decryption");
        }

        document.getElementById("outputDecrypt").value = originalText;
    } catch (error) {
        showNotification(translations[currentLang].invalidText);
    }
}

function copyText(elementId) {
    let textElement = document.getElementById(elementId);
    textElement.select();
    document.execCommand("copy");
    showNotification(translations[currentLang].copied);
}

function showNotification(message) {
    let notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.remove("hidden");

    setTimeout(() => {
        notification.classList.add("hidden");
    }, 2000);
}

let currentLang = "en";

function changeLanguage() {
    currentLang = document.getElementById("langSelect").value;
    document.getElementById("title").textContent = translations[currentLang].title;
    document.getElementById("description").textContent = translations[currentLang].description;
    document.getElementById("encryptTitle").textContent = translations[currentLang].encryptTitle;
    document.getElementById("encryptBtn").textContent = translations[currentLang].encryptBtn;
    document.getElementById("copyEncryptBtn").textContent = translations[currentLang].copyEncryptBtn;
    document.getElementById("decryptTitle").textContent = translations[currentLang].decryptTitle;
    document.getElementById("decryptBtn").textContent = translations[currentLang].decryptBtn;
    document.getElementById("copyDecryptBtn").textContent = translations[currentLang].copyDecryptBtn;
}

