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
        
        if (!inputText) return alert("يرجى إدخال نص للتشفير!");

        // تشفير النص باستخدام CryptoJS
        let encryptedText = CryptoJS.AES.encrypt(inputText, password).toString();
        let binaryData = new TextEncoder().encode(encryptedText);

        // تحويل البيانات المشفرة إلى صوت MP3
        let mp3Blob = await encodeToMP3(binaryData);
        playAndDownloadAudio(mp3Blob);

        alert("✅ تم تشفير النص وتحويله إلى صوت بنجاح!");
    } catch (error) {
        console.error("❌ خطأ أثناء التشفير:", error);
        alert("❌ حدث خطأ أثناء التشفير. يرجى المحاولة مرة أخرى.");
    }
}

async function decryptAudioToText() {
    try {
        let file = document.getElementById("audioFile").files[0];
        let password = document.getElementById("decryptionPassword").value.trim() || DEFAULT_PASSWORD;
        
        if (!file) return alert("يرجى اختيار ملف صوتي لفك التشفير!");

        // استخراج البيانات من الملف الصوتي
        let binaryData = await decodeFromMP3(file);
        let encryptedText = new TextDecoder().decode(binaryData);

        // التحقق من أن النص المشفر هو ترميز Base64 صالح
        if (!isValidBase64(encryptedText)) {
            throw new Error("النص المستخرج ليس ترميز Base64 صالح.");
        }

        // فك تشفير النص باستخدام CryptoJS
        let decryptedBytes = CryptoJS.AES.decrypt(encryptedText, password);
        let decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedText) {
            throw new Error("فشل فك التشفير. تحقق من كلمة السر أو صحة الملف.");
        }

        document.getElementById("outputText-voice").textContent = decryptedText;
        alert("✅ تم فك التشفير بنجاح!");
    } catch (error) {
        console.error("❌ خطأ أثناء فك التشفير:", error);
        alert("❌ حدث خطأ أثناء فك التشفير: " + error.message);
    }
}

async function encodeToMP3(data) {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let buffer = audioContext.createBuffer(1, data.length, audioContext.sampleRate);
    let channelData = buffer.getChannelData(0);

    // تحويل البيانات إلى موجات صوتية
    for (let i = 0; i < data.length; i++) {
        channelData[i] = (data[i] - 128) / 128;
    }

    // استخدام مكتبة lamejs لتحويل الصوت إلى MP3
    let mp3Encoder = new lamejs.Mp3Encoder(1, audioContext.sampleRate, 128);
    let samples = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
        samples[i] = buffer.getChannelData(0)[i] * 32767; // تحويل إلى 16-bit
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

function playAndDownloadAudio(blob) {
    let url = URL.createObjectURL(blob);

    let audioPlayer = document.getElementById("audioPlayer");
    let downloadAudio = document.getElementById("downloadAudio");
    let randomFileName = generateRandomFileName();

    audioPlayer.src = url;
    downloadAudio.href = url;
    downloadAudio.download = randomFileName;
    downloadAudio.style.display = "block";
    downloadAudio.textContent = "تحميل الصوت المشفر";
}

function generateRandomFileName() {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < 5; i++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomString + ".mp3";
}

async function decodeFromMP3(file) {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let arrayBuffer = await file.arrayBuffer();
    let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    let channelData = audioBuffer.getChannelData(0);
    let binaryData = new Uint8Array(channelData.length);

    // تحويل الصوت إلى بيانات ثنائية
    for (let i = 0; i < channelData.length; i++) {
        binaryData[i] = Math.round(channelData[i] * 128 + 128);
    }

    return binaryData;
}

function isValidBase64(str) {
    try {
        // محاولة فك ترميز النص
        return btoa(atob(str)) === str;
    } catch (e) {
        return false;
    }
}
