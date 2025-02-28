document.addEventListener("DOMContentLoaded", function () {
    initializeEventListeners();
});

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
    let password = document.getElementById("encryptionPassword").value.trim();
    if (!text) return alert("يرجى إدخال نص للتشفير!");

    let encryptedText = password ? CryptoJS.AES.encrypt(text, password).toString() : text;
    
    // **تحويل النص إلى قاعدة 64 للحفاظ على الترميز الصحيح**
    let base64EncodedText = btoa(unescape(encodeURIComponent(encryptedText)));

    let binaryData = new TextEncoder().encode(base64EncodedText);

    let audioBuffer = await encodeToAudio(binaryData);
    playAndDownloadAudio(audioBuffer);
}

async function decryptAudioToText() {
    let file = document.getElementById("audioFile").files[0];
    let password = document.getElementById("decryptionPassword").value.trim();
    if (!file) return alert("يرجى اختيار ملف صوتي لفك التشفير!");

    let binaryData = await decodeFromAudio(file);

    try {
        let decodedBase64 = decodeURIComponent(escape(atob(new TextDecoder().decode(binaryData))));
        let decryptedText = password ? CryptoJS.AES.decrypt(decodedBase64, password).toString(CryptoJS.enc.Utf8) : decodedBase64;

        document.getElementById("outputText-voice").textContent = decryptedText || "فشل فك التشفير. تحقق من كلمة السر.";
    } catch (error) {
        alert("خطأ في فك التشفير! تأكد من صحة الملف وكلمة السر.");
    }
}

async function encodeToAudio(data) {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let buffer = audioContext.createBuffer(1, data.length, audioContext.sampleRate);
    let channelData = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
        channelData[i] = (data[i] - 128) / 128;
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
    let url = URL.createObjectURL(mp3Blob);
    
    document.getElementById("audioPlayer").src = url;
    let downloadAudio = document.getElementById("downloadAudio");
    downloadAudio.href = url;
    downloadAudio.download = "encrypted_audio.mp3";
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
        binaryData[i] = Math.round(channelData[i] * 128 + 128);
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
