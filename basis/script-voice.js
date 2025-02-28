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
    let text = document.getElementById("inputText").value.trim();
    let password = document.getElementById("encryptionPassword").value.trim() || DEFAULT_PASSWORD;
    if (!text) return alert("يرجى إدخال نص للتشفير!");

    let encryptedText = CryptoJS.AES.encrypt(text, password).toString();
    let base64EncodedText = btoa(unescape(encodeURIComponent(encryptedText)));

    let binaryData = new TextEncoder().encode(base64EncodedText);
    let audioBuffer = await generateAudio(binaryData);
    
    playAndDownloadAudio(audioBuffer);
}

async function decryptAudioToText() {
    let file = document.getElementById("audioFile").files[0];
    let password = document.getElementById("decryptionPassword").value.trim() || DEFAULT_PASSWORD;
    if (!file) return alert("يرجى اختيار ملف صوتي لفك التشفير!");

    let binaryData = await decodeFromAudio(file);

    try {
        let decodedBase64 = decodeURIComponent(escape(atob(new TextDecoder().decode(binaryData))));
        let decryptedText = CryptoJS.AES.decrypt(decodedBase64, password).toString(CryptoJS.enc.Utf8);

        document.getElementById("outputText-voice").textContent = decryptedText || "فشل فك التشفير. تحقق من كلمة السر أو صحة الملف.";
    } catch (error) {
        alert("خطأ في فك التشفير! تأكد من صحة الملف وكلمة السر.");
    }
}

async function generateAudio(data) {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let sampleRate = 44100;
    let duration = Math.max(1, data.length / 5000); // الحد الأدنى 1 ثانية
    let frameCount = sampleRate * duration;
    
    let buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    let channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
        let index = i % data.length;
        let value = (data[index] / 255) * 2 - 1;
        channelData[i] = value * Math.sin(i / 10);
    }

    return buffer;
}

function playAndDownloadAudio(buffer) {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();

    let mp3Blob = bufferToMp3(buffer);
    let randomFileName = generateRandomFileName();
    let url = URL.createObjectURL(mp3Blob);
    
    document.getElementById("audioPlayer").src = url;
    let downloadAudio = document.getElementById("downloadAudio");
    downloadAudio.href = url;
    downloadAudio.download = randomFileName;
    downloadAudio.style.display = "block";
    downloadAudio.textContent = "تحميل الصوت المشفر";
}

async function decodeFromAudio(file) {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let arrayBuffer = await file.arrayBuffer();
    let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    let channelData = audioBuffer.getChannelData(0);
    let binaryData = new Uint8Array(channelData.length);

    for (let i = 0; i < channelData.length; i++) {
        binaryData[i] = Math.round(((channelData[i] + 1) / 2) * 255);
    }

    return binaryData;
}

function bufferToMp3(audioBuffer) {
    let numOfChannels = audioBuffer.numberOfChannels;
    let sampleRate = audioBuffer.sampleRate;
    let mp3Encoder = new lamejs.Mp3Encoder(numOfChannels, sampleRate, 128);
    let samples = audioBuffer.getChannelData(0);
    let mp3Data = [];

    let sampleBlockSize = 1152;
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
        let sampleChunk = samples.subarray(i, i + sampleBlockSize);
        let mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }

    let mp3End = mp3Encoder.flush();
    if (mp3End.length > 0) mp3Data.push(mp3End);

    return new Blob(mp3Data, { type: "audio/mp3" });
}

function generateRandomFileName() {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < 5; i++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomString + ".mp3";
}
