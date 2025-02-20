document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_KEY = "SuperSecureKey123!@#";

    const uploadImage = document.getElementById('uploadImage');
    const inputText = document.getElementById('inputTe');
    const encryptionPassword = document.getElementById('encryptionPassword');
    const encryptButton = document.getElementById('cryptButton');
    const downloadEncryptedImage = document.getElementById('downloadEncryptedImage');

    const decodeImage = document.getElementById('decodeImage');
    const decryptionPassword = document.getElementById('decryptionPassword');
    const decryptButton = document.getElementById('cryptButton');
    const outputText = document.getElementById('outputText');

    const canvas = document.getElementById('hiddenCanvas');
    const ctx = canvas.getContext('2d');

    encryptButton.addEventListener('click', () => {
        const file = uploadImage.files[0];
        const text = inputText.value;
        const key = encryptionPassword.value || DEFAULT_KEY;

        if (!file || !text) {
            alert("⚠️ يرجى اختيار صورة وإدخال نص.");
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
                    alert("⚠️ النص طويل جدًا بالنسبة لهذه الصورة.");
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
            alert("⚠️ يرجى اختيار صورة لفك التشفير.");
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
                    outputText.innerText = decryptedText ? `🔓 النص المستخرج: ${decryptedText}` : "⚠️ لا يوجد نص مستخرج أو المفتاح غير صحيح.";
                } catch (error) {
                    alert("⚠️ لم يتم العثور على نص صالح أو المفتاح غير صحيح.");
                }
            };
        };
        reader.readAsDataURL(file);
    });
});
