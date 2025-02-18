function showEncrypt() {
    document.getElementById("encryptSection").classList.remove("hidden");
    document.getElementById("decryptSection").classList.add("hidden");
}

function showDecrypt() {
    document.getElementById("decryptSection").classList.remove("hidden");
    document.getElementById("encryptSection").classList.add("hidden");
}


const SECRET_KEY = "ve4http/#181818rys500348751156trvsjssb}{}÷×<>zkzzbongkey-0120089Mm6522Bdshzgxb@#((_-+xosbsjzbzjzbzz";
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

