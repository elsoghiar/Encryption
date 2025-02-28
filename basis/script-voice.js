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
        let text = document.getElementById("inputText").value.trim();
        let password = document.getElementById("encryptionPassword").value.trim() || DEFAULT_PASSWORD;
        if (!text) return alert("يرجى إدخال نص للتشفير!");

        // تشفير النص باستخدام CryptoJS
        let encryptedText = CryptoJS.AES.encrypt(text, password).toString();
        let encodedText = btoa(unescape(encodeURIComponent(encryptedText)));

        // تحويل النص المشفر إلى صوت
        let audioBlob = await generateMP3Audio(encodedText);
        let randomFileName = generateRandomFileName();

        // عرض الصوت وتوفير رابط للتحميل
        let url = URL.createObjectURL(audioBlob);
        document.getElementById("audioPlayer").src = url;

        let downloadAudio = document.getElementById("downloadAudio");
        downloadAudio.href = url;
        downloadAudio.download = randomFileName;
        downloadAudio.style.display = "block";
        downloadAudio.textContent = "تحميل الصوت المشفر";

        alert("✅ تم تشفير النص وتحويله إلى صوت بنجاح!");
    } catch (error) {
        console.error("❌ خطأ أثناء التشفير:", error);
        alert("❌ حدث خطأ أثناء التشفير. يرجى المحاولة مرة أخرى.");
    }
}

async function generateMP3Audio(text) {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let sampleRate = 44100;
    let duration = Math.max(1, text.length / 1000); // مدة الصوت حسب طول النص
    let frameCount = sampleRate * duration;

    let buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    let channelData = buffer.getChannelData(0);

    // تحويل النص إلى موجات صوتية
    for (let i = 0; i < text.length; i++) {
        let normalizedValue = (text.charCodeAt(i) / 255) * 2 - 1;
        channelData[i] = normalizedValue;
    }

    // استخدام مكتبة lamejs لتحويل الصوت إلى MP3
    let mp3Encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
    let samples = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
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

    let mp3Blob = new Blob(mp3Data, { type: "audio/mp3" });
    return mp3Blob;
}

function generateRandomFileName() {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < 5; i++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomString + ".mp3";
}

async function decryptAudioToText() {
    try {
        let file = document.getElementById("audioFile").files[0];
        let password = document.getElementById("decryptionPassword").value.trim() || DEFAULT_PASSWORD;

        if (!file) return alert("❌ يرجى اختيار ملف صوتي لفك التشفير!");

        // استخراج النص من الملف الصوتي
        let extractedText = await extractTextFromMP3Audio(file);

        if (!extractedText) {
            alert("⚠️ لم يتم استخراج أي بيانات من الملف الصوتي! تأكد من صحة الملف.");
            return;
        }

        console.log("📌 النص المشفر المستخرج:", extractedText);

        // فك ترميز Base64
        let decodedBase64;
        try {
            decodedBase64 = atob(extractedText);
        } catch (e) {
            alert("❌ فشل في فك ترميز Base64. تأكد من صحة الملف الصوتي!");
            return;
        }

        // فك تشفير النص باستخدام CryptoJS
        let decryptedText = CryptoJS.AES.decrypt(decodedBase64, password).toString(CryptoJS.enc.Utf8);

        if (!decryptedText) {
            alert("⚠️ فشل فك التشفير. تحقق من كلمة السر أو صحة الملف.");
            return;
        }

        // عرض النص الأصلي
        document.getElementById("outputText-voice").textContent = decryptedText;
        alert("✅ تم فك التشفير بنجاح!");
    } catch (error) {
        console.error("❌ خطأ أثناء فك التشفير:", error);
        alert("❌ حدث خطأ أثناء فك التشفير. تأكد من صحة الملف وكلمة السر.");
    }
}

async function extractTextFromMP3Audio(file) {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let arrayBuffer = await file.arrayBuffer();
    let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    let channelData = audioBuffer.getChannelData(0);

    let extractedBytes = [];

    // استخراج النص من البيانات الصوتية
    for (let i = 0; i < channelData.length; i++) {
        let value = Math.round(((channelData[i] + 1) / 2) * 255);
        if (value > 31 && value < 127) {
            extractedBytes.push(value);
        }
    }

    let extractedText = String.fromCharCode(...extractedBytes).trim();
    return extractedText;
}
