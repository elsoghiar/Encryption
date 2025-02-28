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
    let encodedText = btoa(unescape(encodeURIComponent(encryptedText)));

    let binaryData = new TextEncoder().encode(encodedText);
    let audioBuffer = await generateAudio(binaryData);
    
    let mp3Blob = await convertAudioToMP3(audioBuffer);
    let randomFileName = generateRandomFileName();
    
    let url = URL.createObjectURL(mp3Blob);
    document.getElementById("audioPlayer").src = url;
    
    let downloadAudio = document.getElementById("downloadAudio");
    downloadAudio.href = url;
    downloadAudio.download = randomFileName;
    downloadAudio.style.display = "block";
    downloadAudio.textContent = "تحميل الصوت المشفر";
}

async function decryptAudioToText() {
    let file = document.getElementById("audioFile").files[0];
    let password = document.getElementById("decryptionPassword").value.trim() || DEFAULT_PASSWORD;
    if (!file) return alert("يرجى اختيار ملف صوتي لفك التشفير!");

    let binaryData = await decodeFromAudio(file);

    try {
        let decodedBase64 = decodeURIComponent(escape(atob(new TextDecoder().decode(binaryData))));
        let decryptedText = CryptoJS.AES.decrypt(decodedBase64, password).toString(CryptoJS.enc.Utf8);

        if (!decryptedText) {
            alert("فشل فك التشفير. تحقق من كلمة السر أو صحة الملف.");
            return;
        }

        document.getElementById("outputText-voice").textContent = decryptedText;
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

async function convertAudioToMP3(audioBuffer) {
    return new Promise((resolve) => {
        let samples = audioBuffer.getChannelData(0);
        let wavBlob = encodeWAV(samples);
        let reader = new FileReader();

        reader.readAsArrayBuffer(wavBlob);
        reader.onloadend = function () {
            let wavData = new Uint8Array(reader.result);
            let mp3Encoder = new lamejs.Mp3Encoder(1, 44100, 128);
            let mp3Data = [];

            for (let i = 0; i < samples.length; i += 1152) {
                let mp3Chunk = mp3Encoder.encodeBuffer(samples.subarray(i, i + 1152));
                if (mp3Chunk.length > 0) {
                    mp3Data.push(mp3Chunk);
                }
            }

            let finalChunk = mp3Encoder.flush();
            if (finalChunk.length > 0) {
                mp3Data.push(finalChunk);
            }

            let mp3Blob = new Blob(mp3Data, { type: "audio/mp3" });
            resolve(mp3Blob);
        };
    });
}

function encodeWAV(samples) {
    let buffer = new ArrayBuffer(44 + samples.length * 2);
    let view = new DataView(buffer);

    function writeString(offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function writeInt16(offset, data) {
        view.setInt16(offset, data, true);
    }

    function writeInt32(offset, data) {
        view.setInt32(offset, data, true);
    }

    writeString(0, "RIFF");
    writeInt32(4, 36 + samples.length * 2);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    writeInt32(16, 16);
    writeInt16(20, 1);
    writeInt16(22, 1);
    writeInt32(24, 44100);
    writeInt32(28, 44100 * 2);
    writeInt16(32, 2);
    writeInt16(34, 16);
    writeString(36, "data");
    writeInt32(40, samples.length * 2);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        view.setInt16(offset, samples[i] * 32767, true);
        offset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
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

function generateRandomFileName() {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < 5; i++) {
        randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomString + ".mp3";
}
