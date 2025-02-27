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

// تهيئة Telegram Web App إذا كان المستخدم داخل Telegram
const isTelegram = window.Telegram && window.Telegram.WebApp.initData !== '';

// كلمة السر الافتراضية القوية
const DEFAULT_PASSWORD = 'StrongDefaultPassword123!';

// وظيفة لتشفير الصورة
async function encryptImage(imageFile, password, description) {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    return new Promise((resolve) => {
        reader.onload = () => {
            const base64Image = reader.result.split(',')[1]; // استخراج Base64 من الصورة
            const dataToEncrypt = JSON.stringify({ image: base64Image, description }); // تضمين الوصف مع الصورة
            const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, password || DEFAULT_PASSWORD); // تشفير النص
            const compressed = LZString.compressToUTF16(encrypted.toString()); // ضغط النص المشفر
            resolve(compressed);
        };
    });
}

// وظيفة لفك تشفير الصورة
async function decryptImage(encryptedText, password) {
    const decompressed = LZString.decompressFromUTF16(encryptedText); // فك ضغط النص
    const decrypted = CryptoJS.AES.decrypt(decompressed, password || DEFAULT_PASSWORD).toString(CryptoJS.enc.Utf8); // فك تشفير النص
    if (!decrypted) throw new Error('فشل فك التشفير. تأكد من كلمة السر.');
    const { image, description } = JSON.parse(decrypted); // استخراج الصورة والوصف
    return { imageSrc: `data:image/png;base64,${image}`, description }; // إرجاع الصورة والوصف
}

// وظيفة لتنزيل الملف النصي
function downloadTextFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    URL.revokeObjectURL(url);
}

// وظيفة لإرسال الملف عبر Telegram Bot API
async function sendFileViaTelegram(encryptedText, filename) {
    const botToken = 'YOUR_BOT_TOKEN'; // استبدل بمعرف البوت الخاص بك
    const chatId = window.Telegram.WebApp.initDataUnsafe.user.id; // معرف المستخدم في Telegram
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
            alert('تم إرسال الملف إلى Telegram بنجاح!');
        } else {
            alert('فشل في إرسال الملف عبر Telegram.');
        }
    } catch (error) {
        console.error('Error sending file via Telegram:', error);
        alert('حدث خطأ أثناء إرسال الملف.');
    }
}

// التعامل مع زر التشفير
document.getElementById('e-im').addEventListener('click', async () => {
    const imageFile = document.getElementById('imageInput').files[0];
    const password = document.getElementById('password').value;
    const description = document.getElementById('description-im').value;

    if (!imageFile) {
        alert('الرجاء اختيار صورة.');
        return;
    }

    const encryptedText = await encryptImage(imageFile, password, description);

    if (isTelegram) {
        // إرسال الملف عبر Telegram
        await sendFileViaTelegram(encryptedText, 'encrypted_image.txt');
    } else {
        // تنزيل الملف في المتصفح العادي
        downloadTextFile(encryptedText, 'encrypted_image.txt');
    }
});

// التعامل مع زر فك التشفير
document.getElementById('d-im').addEventListener('click', async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt';
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        const password = document.getElementById('decryptPassword').value;
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async () => {
            try {
                const encryptedText = reader.result;
                const { imageSrc, description } = await decryptImage(encryptedText, password);
                const outputImage = document.getElementById('outputImage');
                const outputDescription = document.getElementById('outputDescription');
                outputImage.src = imageSrc;
                outputImage.style.display = 'block';
                outputDescription.textContent = description || 'لا يوجد وصف.';
                document.getElementById('downloadImageButton').style.display = 'block';
            } catch (error) {
                alert(error.message);
            }
        };
    };
    fileInput.click();
});

// التعامل مع زر تنزيل الصورة المستعادة
document.getElementById('downloadImageButton').addEventListener('click', () => {
    const outputImage = document.getElementById('outputImage');
    const link = document.createElement('a');
    link.href = outputImage.src;
    link.download = 'restored_image.png';
    link.click();
});
