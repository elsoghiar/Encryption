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


// تحويل الصورة إلى Base64
function imageToBase64(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]); // بدون "data:image"
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
}

// مشاركة الملف عبر Telegram
async function shareFile(file) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: "ملف مشفر",
                text: "هذا هو الملف المشفر الخاص بك.",
                files: [file]
            });
            alert("تمت مشاركة الملف بنجاح!");
        } catch (error) {
            console.error("فشل في مشاركة الملف:", error);
        }
    } else {
        alert("المشاركة غير مدعومة على هذا الجهاز.");
    }
}

// تشفير الصورة وتحويلها إلى ملف TXT
async function encryptImage() {
    const imageFile = document.getElementById("imageInput").files[0];
    const description = document.getElementById("description").value;
    const password = document.getElementById("password").value;

    if (!imageFile || !password) {
        alert("يرجى اختيار صورة وإدخال كلمة السر.");
        return;
    }

    try {
        // 1. تحويل الصورة إلى Base64
        const base64Image = await imageToBase64(imageFile);

        // 2. دمج الصورة والوصف
        const dataToEncrypt = JSON.stringify({
            image: base64Image,
            description: description
        });

        // 3. ضغط النص
        const compressedData = LZString.compressToBase64(dataToEncrypt);

        // 4. تشفير البيانات
        const encrypted = CryptoJS.AES.encrypt(compressedData, password).toString();

        // 5. إنشاء ملف TXT
        const blob = new Blob([encrypted], { type: "text/plain" });
        const file = new File([blob], "encrypted_image.txt", { type: "text/plain" });

        // 6. مشاركة الملف مع Telegram
        shareFile(file);
    } catch (error) {
        console.error("خطأ في التشفير:", error);
        alert("حدث خطأ أثناء التشفير.");
    }
}

// فك تشفير ملف TXT واستعادة الصورة
function decryptImage() {
    const fileInput = document.getElementById("encryptedFile").files[0];
    const password = document.getElementById("decryptPassword").value;

    if (!fileInput || !password) {
        alert("يرجى رفع ملف TXT وإدخال كلمة السر.");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        try {
            // 1. قراءة النص المشفر
            const encryptedText = reader.result;

            // 2. فك التشفير
            const decrypted = CryptoJS.AES.decrypt(encryptedText, password).toString(CryptoJS.enc.Utf8);
            if (!decrypted) throw new Error("كلمة السر غير صحيحة أو البيانات تالفة.");

            // 3. فك الضغط
            const decompressedData = LZString.decompressFromBase64(decrypted);
            const { image, description } = JSON.parse(decompressedData);

            // 4. عرض الصورة والوصف
            const imageDataUrl = "data:image/png;base64," + image;
            document.getElementById("outputImage").src = imageDataUrl;
            document.getElementById("outputDescription").innerText = "الوصف: " + description;
            document.getElementById("downloadImageButton").style.display = "block";

            // 5. تخزين الصورة للتنزيل
            window.recoveredImage = imageDataUrl;

            alert("تم فك التشفير بنجاح!");
        } catch (error) {
            console.error("خطأ في فك التشفير:", error);
            alert("حدث خطأ أثناء فك التشفير.");
        }
    };

    reader.onerror = () => {
        alert("حدث خطأ أثناء قراءة الملف.");
    };

    reader.readAsText(fileInput);
}

// تنزيل الصورة المستعادة
function downloadImage() {
    const link = document.createElement("a");
    link.href = window.recoveredImage;
    link.download = "recovered_image.png";
    link.click();
}
