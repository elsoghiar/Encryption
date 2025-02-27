document.addEventListener("DOMContentLoaded", function () {
    initializeEventListeners();
    setupEncryptionDecryption();
});

function initializeEventListeners() {
    document.getElementById("encrypt-image").addEventListener("click", showImageEncrypt);
    document.getElementById("decrypt-image").addEventListener("click", showImageDecrypt);
}

function showImageEncrypt() {
    document.getElementById("en-image").classList.remove("hidden");
    document.getElementById("dc-image").classList.add("hidden");
    document.getElementById("encrypt-image").classList.add("active");
    document.getElementById("decrypt-image").classList.remove("active");
}

function showImageDecrypt() {
    document.getElementById("dc-image").classList.remove("hidden");
    document.getElementById("en-image").classList.add("hidden");
    document.getElementById("decrypt-image").classList.add("active");
    document.getElementById("encrypt-image").classList.remove("active");
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

function setupEncryptionDecryption() {
    const DEFAULT_KEY = "SuperSecureKey123!@#";
    const uploadImage = document.getElementById("uploadImage");
    const inputText = document.getElementById("inputTe");
    const encryptionPassword = document.getElementById("encryptionPassword");
    const encryptButton = document.getElementById("cryptButton");
    const downloadEncryptedImage = document.getElementById("downloadEncryptedImage");

    const decodeImage = document.getElementById("decodeImage");
    const decryptionPassword = document.getElementById("decryptionPassword");
    const decryptButton = document.getElementById("dcryptButton");
    const outputText = document.getElementById("outputText");

    const canvas = document.getElementById("hiddenCanvas");
    const ctx = canvas.getContext("2d");

    const isTelegramWebApp = window.Telegram?.WebApp?.initDataUnsafe?.user;

    encryptButton.addEventListener("click", () => {
        const file = uploadImage.files[0];
        const text = inputText.value.trim();
        const key = encryptionPassword.value || DEFAULT_KEY;

        if (!file || !text) {
            showNotification("⚠️ الرجاء تحميل صورة وكتابة نص لتشفيره.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const encryptedText = compressAndEncrypt(text, key);
                embedTextInImage(encryptedText, ctx, canvas);

                canvas.toBlob((blob) => {
                    if (isTelegramWebApp) {
                        sendImageToTelegram(blob);
                    } else {
                        enableDownloadOption(blob);
                    }
                }, "image/png");

                showNotification("✅ تم التشفير بنجاح!", "success");
            };
        };
        reader.readAsDataURL(file);
    });

    decryptButton.addEventListener("click", () => {
        const file = decodeImage.files[0];
        const key = decryptionPassword.value || DEFAULT_KEY;

        if (!file) {
            showNotification("⚠️ الرجاء اختيار صورة لفك التشفير.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const extractedText = extractTextFromImage(ctx, canvas);
                try {
                    const decryptedText = decryptAndDecompress(extractedText, key);
                    outputText.innerText = decryptedText || "⚠️ لم يتم العثور على نص أو المفتاح غير صحيح.";
                } catch (error) {
                    showNotification("⚠️ فشل فك التشفير.", "error");
                }
            };
        };
        reader.readAsDataURL(file);
    });
}

// ضغط النص وتشفيره
function compressAndEncrypt(text, key) {
    const compressedText = btoa(unescape(encodeURIComponent(text))); 
    return CryptoJS.AES.encrypt(compressedText, key).toString();
}

// فك التشفير وإعادة فك الضغط
function decryptAndDecompress(encryptedText, key) {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, key);
    const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return decodeURIComponent(escape(atob(decryptedText)));
}

// تضمين النص المشفر داخل الصورة
function embedTextInImage(text, ctx, canvas) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(255,255,255,0)";
    ctx.fillText(text, 10, 30);
}

// استخراج النص من الصورة
function extractTextFromImage(ctx, canvas) {
    return ctx.getImageData(10, 20, canvas.width, 30).data.toString();
}

// تفعيل زر التحميل
function enableDownloadOption(blob) {
    const url = URL.createObjectURL(blob);
    const downloadButton = document.getElementById("downloadEncryptedImage");
    downloadButton.href = url;
    downloadButton.style.display = "block";
}

// إرسال الصورة إلى Telegram
async function sendImageToTelegram(blob) {
    const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
    const formData = new FormData();
    formData.append("chat_id", userId);
    formData.append("photo", blob, "encrypted.png");

    try {
        const botToken = "8020137021:AAEObbgT1s8929ztZG2_JBPvMCMevXn6Egk"; // استبدل بتوكن البوت
        const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

        const response = await fetch(url, { method: "POST", body: formData });
        const result = await response.json();
        if (result.ok) {
            showNotification("📤 تم إرسال الصورة إلى Telegram!", "success");
        } else {
            showNotification("⚠️ فشل إرسال الصورة إلى Telegram.", "error");
        }
    } catch (error) {
        showNotification("⚠️ حدث خطأ أثناء الإرسال.", "error");
    }
}
