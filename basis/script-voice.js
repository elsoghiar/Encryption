document.addEventListener("DOMContentLoaded", function () {
    initializeEventListeners();
});

const DEFAULT_PASSWORD = "MyDefaultSecret"; // كلمة سر افتراضية

function initializeEventListeners() {
    document.getElementById("encrypt-vo").addEventListener("click", showEncryptSection);
    document.getElementById("decrypt-vo").addEventListener("click", showDecryptSection);
    document.getElementById("encryptvoButton").addEventListener("click", encryptTextToAudio);
    document.getElementById("decryptvoButton").addEventListener("click", decryptAudioToText);
}

function showEncryptSection() {
    document.getElementById("encrypt-vo").classList.add("active");
    document.getElementById("decrypt-vo").classList.remove("active");
    document.getElementById("section-vo-en").classList.remove("hidden");
    document.getElementById("section-vo-de").classList.add("hidden");
}

function showDecryptSection() {
    document.getElementById("decrypt-vo").classList.add("active");
    document.getElementById("encrypt-vo").classList.remove("active");
    document.getElementById("section-vo-de").classList.remove("hidden");
    document.getElementById("section-vo-en").classList.add("hidden");
}

async function encryptTextToAudio() {
    try {
        let inputText = document.getElementById("inputText").value.trim();
        let password = document.getElementById("encryptionPassword").value.trim() || DEFAULT_PASSWORD;
        
        if (!inputText) {
            showNotification("يرجى إدخال نص للتشفير!", "error");
            return;
        }

        // تشفير النص باستخدام CryptoJS
        let encryptedText = CryptoJS.AES.encrypt(inputText, password).toString();

        // إنشاء ملف نصي يحتوي على النص المشفر
        let textBlob = new Blob([encryptedText], { type: "text/plain" });

        // إنشاء ملف صوتي متغير
        let audioBlob = await generateRandomAudio();

        // إخفاء الملف النصي داخل الملف الصوتي
        let hiddenAudioBlob = await hideTextInAudio(textBlob, audioBlob);

        // عرض الصوت وتوفير رابط للتحميل
        let url = URL.createObjectURL(hiddenAudioBlob);

        let audioPlayer = document.getElementById("audioPlayer");
        let downloadAudio = document.getElementById("downloadAudio");
        let randomFileName = generateRandomFileName();

        audioPlayer.src = url;
        downloadAudio.href = url;
        downloadAudio.download = randomFileName;
        downloadAudio.style.display = "block";
        downloadAudio.textContent = "تحميل الصوت المشفر";

        showNotification("✅ تم تشفير النص وإخفائه في الصوت بنجاح!", "success");
    } catch (error) {
        console.error("❌ خطأ أثناء التشفير:", error);
        showNotification("❌ حدث خطأ أثناء التشفير: " + error.message, "error");
    }
}

async function decryptAudioToText() {
    try {
        let file = document.getElementById("audioFile").files[0];
        let password = document.getElementById("decryptionPassword").value.trim() || DEFAULT_PASSWORD;
        
        if (!file) {
            showNotification("يرجى اختيار ملف صوتي لفك التشفير!", "error");
            return;
        }

        // استخراج الملف النصي المخفي من الملف الصوتي
        let textBlob = await extractTextFromAudio(file);

        // قراءة الملف النصي كـ نص
        let encryptedText = await textBlob.text();

        // فك تشفير النص باستخدام CryptoJS
        let decryptedBytes = CryptoJS.AES.decrypt(encryptedText, password);
        let decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedText) {
            throw new Error("فشل فك التشفير. تحقق من كلمة السر أو صحة الملف.");
        }

        document.getElementById("outputText-voice").textContent = decryptedText;
        showNotification("✅ تم فك التشفير بنجاح!", "success");
    } catch (error) {
        console.error("❌ خطأ أثناء فك التشفير:", error);
        showNotification("❌ حدث خطأ أثناء فك التشفير: " + error.message, "error");
    }
}

async function generateRandomAudio() {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let sampleRate = 44100;
    let duration = 2; // مدة الصوت بالثواني
    let frameCount = sampleRate * duration;

    let buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    let channelData = buffer.getChannelData(0);

    // إنشاء موجات صوتية عشوائية
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = Math.random() * 2 - 1; // قيم عشوائية بين -1 و 1
    }

    // تحويل الصوت إلى MP3 باستخدام lamejs
    let mp3Encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
    let samples = new Int16Array(frameCount);
    for (let i = 0; i < frameCount; i++) {
        samples[i] = channelData[i] * 32767; // تحويل إلى 16-bit
    }

    let mp3Data = [];
    let sampleBlockSize = 1152; // حجم البلوك المناسب لـ MP3
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
        let sampleChunk = samples.subarray(i, i + sampleBlockSize);
        let mp3Chunk = mp3Encoder.encodeBuffer(sampleChunk);
        if (mp3Chunk.length > 0) {
            mp3Data.push(mp3Chunk);
        }
    }

    let mp3Chunk = mp3Encoder.flush(); // إنهاء التشفير
    if (mp3Chunk.length > 0) {
        mp3Data.push(mp3Chunk);
    }

    return new Blob(mp3Data, { type: "audio/mp3" });
}

async function hideTextInAudio(textBlob, audioBlob) {
    // قراءة الملف النصي كـ ArrayBuffer
    let textBuffer = await textBlob.arrayBuffer();

    // قراءة الملف الصوتي كـ ArrayBuffer
    let audioBuffer = await audioBlob.arrayBuffer();

    // دمج الملف النصي داخل الملف الصوتي
    let combinedBuffer = new Uint8Array(audioBuffer.byteLength + textBuffer.byteLength + 4); // 4 بايت لحجم الملف النصي
    combinedBuffer.set(new Uint8Array(audioBuffer), 0);
    combinedBuffer.set(new Uint8Array(textBuffer), audioBuffer.byteLength);

    // إضافة حجم الملف النصي في نهاية الملف الصوتي (4 بايت)
    let textSize = new Uint32Array([textBuffer.byteLength]);
    combinedBuffer.set(new Uint8Array(textSize.buffer), audioBuffer.byteLength + textBuffer.byteLength);

    // إنشاء ملف صوتي جديد يحتوي على الملف النصي المخفي
    return new Blob([combinedBuffer], { type: "audio/mp3" });
}

async function extractTextFromAudio(audioBlob) {
    // قراءة الملف الصوتي كـ ArrayBuffer
    let audioBuffer = await audioBlob.arrayBuffer();

    // استخراج حجم الملف النصي من نهاية الملف الصوتي (4 بايت)
    let textSize = new Uint32Array(audioBuffer.slice(-4))[0];

    // استخراج الملف النصي من الملف الصوتي
    let textBuffer = audioBuffer.slice(-4 - textSize, -4);

    // إنشاء ملف نصي من البيانات المستخرجة
    return new Blob([textBuffer], { type: "text/plain" });
}

function generateRandomFileName() {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < 5; i++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomString + ".mp3";
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
