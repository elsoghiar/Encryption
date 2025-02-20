document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_KEY = "SuperSecureKey123!@#";

    const uploadImage = document.getElementById('uploadImage');
    const inputText = document.getElementById('inputText');
    const encryptionPassword = document.getElementById('encryptionPassword');
    const encryptButton = document.getElementById('encryptButton');
    const downloadEncryptedImage = document.getElementById('downloadEncryptedImage');

    const decodeImage = document.getElementById('decodeImage');
    const decryptionPassword = document.getElementById('decryptionPassword');
    const decryptButton = document.getElementById('decryptButton');
    const outputText = document.getElementById('outputText');

    const canvas = document.getElementById('hiddenCanvas');
    const ctx = canvas.getContext('2d');

    function showMessage(message) {
        console.log(message);
        outputText.innerText = message;
    }

    encryptButton.addEventListener('click', () => {
        const file = uploadImage.files[0];
        const text = inputText.value.trim();
        const key = encryptionPassword.value || DEFAULT_KEY;

        if (!file || !text) {
            showMessage("⚠️ يرجى اختيار صورة وإدخال نص.");
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
                        showMessage("⚠️ النص طويل جدًا بالنسبة لهذه الصورة.");
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

                    canvas.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        downloadEncryptedImage.href = url;
                        downloadEncryptedImage.style.display = 'block';
                        downloadEncryptedImage.innerText = "⬇️ تحميل الصورة المشفرة";
                    }, 'image/png');
                } catch (error) {
                    showMessage("❌ حدث خطأ أثناء التشفير.");
                    console.error(error);
                }
            };

            img.onerror = () => {
                showMessage("⚠️ تعذر تحميل الصورة.");
            };
        };

        reader.onerror = () => {
            showMessage("⚠️ حدث خطأ أثناء قراءة الملف.");
        };

        reader.readAsDataURL(file);
    });

    decryptButton.addEventListener('click', () => {
        const file = decodeImage.files[0];
        const key = decryptionPassword.value || DEFAULT_KEY;

        if (!file) {
            showMessage("⚠️ يرجى اختيار صورة لفك التشفير.");
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
                    showMessage("⚠️ فشل فك التشفير.");
                    console.error(error);
                }
            };

            img.onerror = () => {
                showMessage("⚠️ تعذر تحميل الصورة.");
            };
        };

        reader.onerror = () => {
            showMessage("⚠️ حدث خطأ أثناء قراءة الملف.");
        };

        reader.readAsDataURL(file);
    });
});
