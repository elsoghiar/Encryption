document.addEventListener("DOMContentLoaded", function () {
    initializeEventListeners();
});

function initializeEventListeners() {
    document.getElementById("encrypt-im").addEventListener("click", showImageEncrypt);
    document.getElementById("decrypt-im").addEventListener("click", showImageDecrypt);
}

function showImageEncrypt() {
    document.getElementById("en-im").classList.remove("hidden");
    document.getElementById("de-im").classList.add("hidden");
    document.getElementById("encrypt-im").classList.add("active");
    document.getElementById("decrypt-im").classList.remove("active");
}

function showImageDecrypt() {
    document.getElementById("de-im").classList.remove("hidden");
    document.getElementById("en-im").classList.add("hidden");
    document.getElementById("decrypt-im").classList.add("active");
    document.getElementById("encrypt-im").classList.remove("active");
}

const isTelegram = window.Telegram && window.Telegram.WebApp.initData !== '';
const botToken = '8020137021:AAEObbgT1s8929ztZG2_JBPvMCMevXn6Egk'; 
const chatId = window.Telegram.WebApp.initDataUnsafe.user.id;
const DEFAULT_PASSWORD = "7x!Q@z#L$9%P^3&K*8(Y)0_+=-A|B{C}D[E]F\\G/H<I>J?K:L;MN,O.P/Q1R2S3T4U5V6W7X8Y9Z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2";

function generateRandomFilename(extension) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let filename = '';
    for (let i = 0; i < 6; i++) {
        filename += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return filename + '.' + extension;
}

async function encryptImage(imageFile, password, description) {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    return new Promise((resolve) => {
        reader.onload = () => {
            const base64Image = reader.result.split(',')[1];
            const dataToEncrypt = JSON.stringify({ image: base64Image, description });
            const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, password || DEFAULT_PASSWORD);
            const compressed = LZString.compressToUTF16(encrypted.toString());
            resolve(compressed);
        };
    });
}

async function decryptImage(encryptedText, password) {
    try {
        const decompressed = LZString.decompressFromUTF16(encryptedText);
        const decrypted = CryptoJS.AES.decrypt(decompressed, password || DEFAULT_PASSWORD).toString(CryptoJS.enc.Utf8);
        if (!decrypted) throw new Error('فشل فك التشفير. تأكد من كلمة السر.');
        return JSON.parse(decrypted);
    } catch (error) {
        throw new Error('فشل فك التشفير. تحقق من الملف وكلمة السر.');
    }
}

function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    URL.revokeObjectURL(url);
}

async function sendFileViaTelegram(encryptedText, filename) {
    const blob = new Blob([encryptedText], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('document', blob, filename);

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument?chat_id=${chatId}`, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        if (data.ok) {
            showNotification('تم إرسال الملف إلى Telegram بنجاح!', 'success');
        } else {
            showNotification('فشل في إرسال الملف عبر Telegram.', 'error');
        }
    } catch (error) {
        console.error('Error sending file via Telegram:', error);
        showNotification('حدث خطأ أثناء إرسال الملف.', 'error');
    }
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

document.getElementById('e-im').addEventListener('click', async () => {
    const imageFile = document.getElementById('imageInput').files[0];
    const password = document.getElementById('password').value;
    const description = document.getElementById('description-im').value;

    if (!imageFile) {
        showNotification('الرجاء اختيار صورة.', 'error');
        return;
    }

    try {
        const encryptedText = await encryptImage(imageFile, password, description);
        const filename = generateRandomFilename('txt');

        if (isTelegram) {
            await sendFileViaTelegram(encryptedText, filename);
        } else {
            downloadTextFile(encryptedText, filename);
            showNotification('تم تنزيل الملف بنجاح!', 'success');
        }
    } catch (error) {
        showNotification('حدث خطأ أثناء التشفير.', 'error');
    }
});

let lastEncryptedText = null; 
document.getElementById('d-im').addEventListener('click', async () => {
    const password = document.getElementById('decryptPassword').value;

    if (!lastEncryptedText) {
        showNotification('الرجاء رفع ملف مشفر أولاً.', 'error');
        return;
    }

    try {
        const { image, description } = await decryptImage(lastEncryptedText, password);
        const outputImage = document.getElementById('outputImage');
        const outputDescription = document.getElementById('outputDescription');
        outputImage.src = `data:image/png;base64,${image}`;
        outputImage.style.display = 'block';
        outputDescription.textContent = description || 'لا يوجد وصف.';
        document.getElementById('downloadImageButton').style.display = 'block';
        showNotification('تم فك التشفير بنجاح!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
        document.getElementById('decryptPassword').value = ''; // إزالة كلمة السر
        document.getElementById('encryptedFile').value = ''; // إزالة الملف المرفوع
        lastEncryptedText = null;
    }
});

document.getElementById('encryptedFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];

    if (!file) {
        showNotification('الرجاء اختيار ملف نصي مشفر.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
        lastEncryptedText = reader.result; // حفظ النص المشفر للمعالجة لاحقًا
        showNotification('تم تحميل الملف المشفر، أدخل كلمة السر وانقر على فك التشفير.', 'info');
    };
});

document.getElementById('downloadImageButton').addEventListener('click', () => {
    const outputImage = document.getElementById('outputImage');
    const filename = generateRandomFilename('png');

    if (isTelegram) {
        sendImageViaTelegram(outputImage.src, filename, document.getElementById('outputDescription').textContent);
    } else {
        const link = document.createElement('a');
        link.href = outputImage.src;
        link.download = filename;
        link.click();
        showNotification('تم تنزيل الصورة المستعادة بنجاح!', 'success');
    }
});

async function sendImageViaTelegram(imageSrc, filename, description) {
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('photo', blob, filename);
    formData.append('caption', description);

    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto?chat_id=${chatId}`, {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        if (data.ok) {
            showNotification('تم إرسال الصورة إلى Telegram بنجاح!', 'success');
        } else {
            showNotification('فشل في إرسال الصورة عبر Telegram.', 'error');
        }
    } catch (error) {
        console.error('Error sending image via Telegram:', error);
        showNotification('حدث خطأ أثناء إرسال الصورة.', 'error');
    }
}

