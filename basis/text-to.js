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

 // التحقق من بيئة Telegram WebApp
const isTelegram = window.Telegram && window.Telegram.WebApp.initData !== '';

// كلمة السر الافتراضية
const DEFAULT_PASSWORD = 'StrongDefaultPassword123!';

// توليد اسم عشوائي من 6 أحرف
function generateRandomFilename(extension) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let filename = '';
    for (let i = 0; i < 6; i++) {
        filename += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return filename + '.' + extension;
}

// تشفير الصورة
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

// فك تشفير الصورة
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

// تنزيل ملف نصي
function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    URL.revokeObjectURL(url);
}

// إرسال الملف عبر Telegram
async function sendFileViaTelegram(encryptedText, filename) {
    const botToken = 'YOUR_BOT_TOKEN'; // استبدل بالمعرف الفعلي للبوت
    const chatId = window.Telegram.WebApp.initDataUnsafe.user.id;
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

// عرض الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// التعامل مع زر التشفير
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

// التعامل مع فك التشفير
let lastEncryptedText = null; // الاحتفاظ بالنص المشفر الحالي
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

// التعامل مع رفع الملف المشفر
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

// التعامل مع زر تنزيل الصورة المستعادة
document.getElementById('downloadImageButton').addEventListener('click', () => {
    const outputImage = document.getElementById('outputImage');
    const filename = generateRandomFilename('png');
    
    if (isTelegram) {
        showNotification('لا يمكن تنزيل الصور مباشرة داخل Telegram.', 'error');
    } else {
        const link = document.createElement('a');
        link.href = outputImage.src;
        link.download = filename;
        link.click();
        showNotification('تم تنزيل الصورة المستعادة بنجاح!', 'success');
    }
});

