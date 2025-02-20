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
    const notification = document.getElementById("notification");
    
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
        const text = inputText.value.trim();
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

                try {
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
                    downloadEncryptedImage.href = encryptedImage;
                    downloadEncryptedImage.style.display = 'block';

                    // Reset fields after successful encryption
                    uploadImage.value = '';
                    inputText.value = '';
                    encryptionPassword.value = '';

                    showNotification("✅ Encryption successful!");
                } catch (error) {
                    showNotification("❌ Error during encryption: " + error.message);
                }
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
                    if (decryptedText) {
                        outputText.innerText = `🔑 Decrypted Message: ${decryptedText}`;
                        showNotification("✅ Decryption successful!");
                    } else {
                        showNotification("❌ No valid text found or incorrect key.");
                    }
                } catch (error) {
                    showNotification("⚠️ Error during decryption: " + error.message);
                }
            };
        };
        reader.readAsDataURL(file);
    });
});


document.getElementById('uploadImage').addEventListener('change', function () {
    const file = this.files[0];
    const imagePreview = document.getElementById('imagePreview');
    const fileName = document.getElementById('fileName');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);

        fileName.textContent = `File Name: ${file.name}`;
    } else {
        imagePreview.style.display = 'none';
        fileName.textContent = '';
    }
});

document.getElementById('decodeImage').addEventListener('change', function () {
    const file = this.files[0];
    const imagePreviewDe = document.getElementById('imagePreview-de');
    const fileNameDe = document.getElementById('fileName-de');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreviewDe.src = e.target.result;
            imagePreviewDe.style.display = 'block';
        };
        reader.readAsDataURL(file);

        fileNameDe.textContent = `File Name: ${file.name}`;
    } else {
        imagePreviewDe.style.display = 'none';
        fileNameDe.textContent = '';
    }
});
