document.getElementById("encryptButton").addEventListener("click", generateEncryptedAudio);
document.getElementById("decryptButton").addEventListener("click", decryptAudio);

function generateEncryptedAudio() {
    const text = document.getElementById("inputText").value.trim();
    const password = document.getElementById("encryptionPassword").value;

    if (!text) {
        alert("⚠️ الرجاء إدخال نص للتشفير.");
        return;
    }

    // تشفير النص باستخدام CryptoJS
    const encryptedText = CryptoJS.AES.encrypt(text, password || "default-key").toString();

    // تحويل النص المشفر إلى بيانات صوتية
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = 2; // ثانيتان
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < encryptedText.length; i++) {
        let charCode = encryptedText.charCodeAt(i) % 256;
        for (let j = 0; j < 256; j++) {
            channelData[i * 256 + j] = (j === charCode) ? 0.5 : 0;
        }
    }

    // إنشاء ملف صوتي
    const audioBlob = bufferToWav(buffer);
    const audioUrl = URL.createObjectURL(audioBlob);
    const downloadLink = document.getElementById("downloadAudio");
    downloadLink.href = audioUrl;
    downloadLink.download = "encrypted_audio.wav";
    downloadLink.style.display = "block";
}

function bufferToWav(buffer) {
    const length = buffer.length * 2;
    const wavBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(wavBuffer);

    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length, true);

    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
        view.setInt16(offset, channelData[i] * 0x7FFF, true);
        offset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
}

function decryptAudio() {
    const file = document.getElementById("audioFile").files[0];
    const password = document.getElementById("decryptionPassword").value;

    if (!file) {
        alert("⚠️ الرجاء اختيار ملف صوتي لفك التشفير.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(event) {
        const arrayBuffer = event.target.result;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0);
        let extractedBinary = "";
        for (let i = 0; i < channelData.length; i += 256) {
            let maxIndex = 0;
            for (let j = 0; j < 256; j++) {
                if (channelData[i + j] > channelData[i + maxIndex]) {
                    maxIndex = j;
                }
            }
            extractedBinary += String.fromCharCode(maxIndex);
        }

        try {
            const decryptedText = CryptoJS.AES.decrypt(extractedBinary, password || "default-key").toString(CryptoJS.enc.Utf8);
            document.getElementById("outputText").textContent = decryptedText || "⚠️ لم يتم العثور على نص.";
        } catch {
            alert("⚠️ فشل فك التشفير، تحقق من كلمة السر.");
        }
    };
    reader.readAsArrayBuffer(file);
}
