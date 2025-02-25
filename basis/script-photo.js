async function sendImageToUser(imageDataUrl) {
    const TELEGRAM_BOT_TOKEN = "8020137021:AAEObbgT1s8929ztZG2_JBPvMCMevXn6Egk"; // ضع توكن البوت
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    // محاولة جلب معرف المستخدم من Telegram Web App
    let userId;
    try {
        userId = window.Telegram.WebApp.initDataUnsafe?.user?.id;
        if (!userId) throw new Error("معرف المستخدم غير متاح.");
    } catch (error) {
        console.error("❌ فشل في جلب معرف المستخدم:", error);
        return;
    }

    // تحويل Data URL إلى Blob
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();

    // إنشاء FormData لإرسال الصورة
    let formData = new FormData();
    formData.append("chat_id", userId);
    formData.append("photo", blob, "encrypted_image.png");

    // إرسال الطلب إلى API تليجرام
    try {
        let res = await fetch(TELEGRAM_API_URL, {
            method: "POST",
            body: formData,
        });
        let data = await res.json();
        if (data.ok) {
            console.log("✅ تم إرسال الصورة بنجاح");
            showNotification("✅ تم إرسال الصورة إلى حسابك في تليجرام.");
        } else {
            console.error("❌ فشل في إرسال الصورة:", data);
            showNotification("⚠️ فشل في إرسال الصورة إلى تليجرام.");
        }
    } catch (error) {
        console.error("❌ خطأ في الإرسال:", error);
        showNotification("⚠️ حدث خطأ أثناء الإرسال.");
    }
}



function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
}

document.addEventListener("DOMContentLoaded", initializeEventListeners);

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


document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_KEY = "SuperSecureKey123!@#";

    const uploadImage = document.getElementById('uploadImage');
    const inputText = document.getElementById('inputTe');
    const encryptionPassword = document.getElementById('encryptionPassword');
    const encryptButton = document.getElementById('cryptButton');
    const downloadEncryptedImage = document.getElementById('downloadEncryptedImage');

    const decodeImage = document.getElementById('decodeImage');
    const decryptionPassword = document.getElementById('decryptionPassword');
    const decryptButton = document.getElementById('dcryptButton');
    const outputText = document.getElementById('outputText');

    const canvas = document.getElementById('hiddenCanvas');
    const ctx = canvas.getContext('2d');

    encryptButton.addEventListener('click', () => {
    const file = uploadImage.files[0];
    const text = inputText.value;
    const key = encryptionPassword.value || DEFAULT_KEY;

    if (!file || !text) {
        showNotification("⚠️ الرجاء رفع صورة وكتابة نص للتشفير.");
        return;
    }

    showLoading(); // عرض شاشة التحميل

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            const encryptedText = CryptoJS.AES.encrypt(text, key).toString();
            let binaryText = '';
            for (let i = 0; i < encryptedText.length; i++) {
                binaryText += encryptedText.charCodeAt(i).toString(2).padStart(8, '0');
            }

            if (binaryText.length > pixels.length / 4) {
                showNotification("⚠️ النص طويل جدًا لهذه الصورة.");
                hideLoading();
                return;
            }

            let index = 0;
            for (let i = 0; i < pixels.length && index < binaryText.length; i += 4) {
                pixels[i] = (pixels[i] & 0xFE) | parseInt(binaryText[index] || '0');
                pixels[i + 1] = (pixels[i + 1] & 0xFE) | parseInt(binaryText[index + 1] || '0');
                pixels[i + 2] = (pixels[i + 2] & 0xFE) | parseInt(binaryText[index + 2] || '0');
                index += 3;
            }

            ctx.putImageData(imageData, 0, 0);
            const encryptedImage = canvas.toDataURL("image/png");

            // 1️⃣ محاولة التنزيل مباشرة
            let downloadLink = document.createElement("a");
            downloadLink.href = encryptedImage;
            downloadLink.download = "encrypted_image.png";

            try {
                downloadLink.click();
                showNotification("✅ تم تنزيل الصورة المشفرة بنجاح.");
            } catch (error) {
                console.warn("⚠️ فشل التنزيل المباشر، يتم إرسال الصورة عبر تليجرام...");
                sendImageToUser(encryptedImage);
            }

            hideLoading(); // إخفاء شاشة التحميل

            uploadImage.value = '';
            inputText.value = '';
            encryptionPassword.value = '';
        };
    };
    reader.readAsDataURL(file);
});

decryptButton.addEventListener('click', () => {
    const file = decodeImage.files[0];
    const key = decryptionPassword.value || DEFAULT_KEY;

    if (!file) {
        showNotification("⚠️ الرجاء اختيار صورة لفك التشفير.");
        return;
    }

    showLoading(); // عرض شاشة التحميل

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            let binaryText = '';
            for (let i = 0; i < pixels.length; i += 4) {
                binaryText += (pixels[i] & 1).toString();
                binaryText += (pixels[i + 1] & 1).toString();
                binaryText += (pixels[i + 2] & 1).toString();
            }

            let extractedText = '';
            for (let i = 0; i < binaryText.length; i += 8) {
                extractedText += String.fromCharCode(parseInt(binaryText.substr(i, 8), 2));
            }

            try {
                outputText.innerText = CryptoJS.AES.decrypt(extractedText, key).toString(CryptoJS.enc.Utf8) || "لا يوجد نص مشفر";
            } catch (error) {
                showNotification("⚠️ فشل فك التشفير.");
            }

            hideLoading(); // إخفاء شاشة التحميل
        };
    };
    reader.readAsDataURL(file);
});
