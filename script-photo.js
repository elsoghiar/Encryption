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

    encryptButton.addEventListener('click', async () => {
        const file = uploadImage.files[0];
        const text = inputText.value;
        const key = encryptionPassword.value || DEFAULT_KEY;

        if (!file || !text) {
            showNotification("⚠️ Please upload a photo and write a text to encrypt it inside the photo.");
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

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;

                const encryptedText = CryptoJS.AES.encrypt(text, key).toString();
                let binaryText = '';
                for (let i = 0; i < encryptedText.length; i++) {
                    binaryText += encryptedText.charCodeAt(i).toString(2).padStart(8, '0');
                }

                if (binaryText.length > pixels.length / 4) {
                    showNotification("⚠️ The text is too long considering this picture.");
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

                // تنزيل الملف عبر المتصفح
                downloadEncryptedImage.href = encryptedImage;
                downloadEncryptedImage.style.display = 'block';

                // تنزيل الملف باستخدام تحديث تليجرام الجديد
                if (window.Telegram?.WebApp?.showAlert) {
                    const blob = dataURLtoBlob(encryptedImage);
const blobUrl = URL.createObjectURL(blob);

window.Telegram.WebApp.showAlert("هل تريد تنزيل الملف؟", () => {
    window.Telegram.WebApp.downloadFile({
        url: blobUrl,  // استخدم URL بدلاً من الملف المباشر
        fileName: "encrypted-image.png"
    });
});

                }

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
            showNotification("⚠️ Please select an image to decode the text from.");
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
                    const byte = binaryText.substr(i, 8);
                    const charCode = parseInt(byte, 2);
                    if (charCode === 0) break;
                    extractedText += String.fromCharCode(charCode);
                }

                try {
                    const decryptedText = CryptoJS.AES.decrypt(extractedText, key).toString(CryptoJS.enc.Utf8);
                    outputText.innerText = decryptedText ? `${decryptedText}` : "No text extracted from image or incorrect password.";
                } catch (error) {
                    showNotification("⚠️ لم يتم العثور على نص صالح أو المفتاح غير صحيح.");
                }
            };
        };
        reader.readAsDataURL(file);
    });
});

// تحويل DataURL إلى Blob
function dataURLtoBlob(dataURL) {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([uint8Array], { type: mimeString });
}


