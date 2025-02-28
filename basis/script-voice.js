document.addEventListener("DOMContentLoaded", function () {
    initializeEventListeners();
});

const DEFAULT_PASSWORD = "7x!Q@z#L$9%P^3&K*8(Y)0_+=-A|B{C}D[E]F\\G/H<I>J?K:L;MN,O.P/Q1R2S3T4U5V6W7X8Y9Z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U7V8W9X0Y1Z2";
const TELEGRAM_BOT_TOKEN = "8020137021:AAEObbgT1s8929ztZG2_JBPvMCMevXn6Egk"; // استبدل هذا ب Token البوت الخاص بك

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
            showNotification("Please enter text to encrypt!", "error");
            return;
        }

        // تشفير النص باستخدام CryptoJS
        let encryptedText = CryptoJS.AES.encrypt(inputText, password).toString();

        // إنشاء ملف نصي يحتوي على النص المشفر
        let textBlob = new Blob([encryptedText], { type: "text/plain" });

        // إنشاء ملف صوتي بنغمات وترددات سحرية
        let audioBlob = await generateMagicalAudio();

        // إخفاء الملف النصي داخل الملف الصوتي
        let hiddenAudioBlob = await hideTextInAudio(textBlob, audioBlob);

        // عرض الصوت وتوفير رابط للتحميل
        let url = URL.createObjectURL(hiddenAudioBlob);

        let audioPlayer = document.getElementById("audioPlayer");
        let downloadAudio = document.getElementById("downloadAudio");
        let sendTelegram = document.getElementById("sendTelegram");
        let randomFileName = generateRandomFileName();

        audioPlayer.src = url;
        downloadAudio.href = url;
        downloadAudio.download = randomFileName;
        downloadAudio.style.display = "block";
        downloadAudio.textContent = "Download Encrypted Audio";

        // التحقق من بيئة Telegram
        if (window.Telegram.WebApp) {
            downloadAudio.style.display = "none";
            sendTelegram.style.display = "block";
            sendTelegram.onclick = () => sendFileToTelegram(hiddenAudioBlob, randomFileName);
        }

        showNotification("✅ Text encrypted and hidden in audio successfully!", "success");
    } catch (error) {
        console.error("❌ Error during encryption:", error);
        showNotification("❌ Error during encryption: " + error.message, "error");
    }
}

async function decryptAudioToText() {
    try {
        let file = document.getElementById("audioFile").files[0];
        let password = document.getElementById("decryptionPassword").value.trim() || DEFAULT_PASSWORD;
        
        if (!file) {
            showNotification("Please select an audio file to decrypt!", "error");
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
            throw new Error("Failed to decrypt. Check the password or file.");
        }

        document.getElementById("outputText-voice").textContent = decryptedText;
        showNotification("✅ Decryption successful!", "success");
    } catch (error) {
        console.error("❌ Error during decryption:", error);
        showNotification("❌ Error during decryption: " + error.message, "error");
    }
}

async function generateMagicalAudio() {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let sampleRate = 44100;
    let duration = 2; // مدة الصوت بالثواني
    let frameCount = sampleRate * duration;

    let buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    let channelData = buffer.getChannelData(0);

    // إنشاء نغمات وترددات سحرية
    for (let i = 0; i < frameCount; i++) {
        let frequency = 440 + Math.sin(i / 100) * 220; // تردد متغير
        channelData[i] = Math.sin((i * frequency * Math.PI * 2) / sampleRate); // موجة جيبية
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

async function sendFileToTelegram(fileBlob, fileName) {
    try {
        const userData = Telegram.WebApp.initDataUnsafe.user;
        if (!userData || !userData.id) {
         showNotification("⚠️ Your telegram id was not found", "error");
         return;
       }
        const userId = userData.id;
        let formData = new FormData();
        formData.append("chat_id", userId);
        formData.append("audio", fileBlob, fileName);

        let response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendAudio`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to send file via Telegram.");
        }

        showNotification("✅ File sent via Telegram successfully!", "success");
    } catch (error) {
        console.error("❌ Error sending file via Telegram:", error);
        showNotification("❌ Error sending file via Telegram: " + error.message, "error");
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
