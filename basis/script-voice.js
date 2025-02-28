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
    const inputText = document.getElementById('inputText').value.trim();
    const password = document.getElementById('encryptionPassword').value.trim();

    if (!inputText) {
        alert("الرجاء إدخال نص للتشفير.");
        return;
    }

    let encryptedText = password 
        ? CryptoJS.AES.encrypt(inputText, password).toString() 
        : inputText;

    const sampleRate = 44100;
    const duration = 3;
    const numSamples = sampleRate * duration;
    const audioData = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
        const charCode = encryptedText.charCodeAt(i % encryptedText.length);
        audioData[i] = Math.sin(2 * Math.PI * (300 + charCode) * (i / sampleRate));
    }

    const wavData = await WavEncoder.encode({
        sampleRate: sampleRate,
        channelData: [audioData]
    });

    const audioBlob = new Blob([wavData], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);

    document.getElementById('audioPlayer').src = audioUrl;
    
    const downloadLink = document.getElementById('downloadAudio');
    downloadLink.href = audioUrl;
    downloadLink.download = 'encrypted_audio.wav';
    downloadLink.style.display = 'block';
}

function decryptAudioToText() {
    const fileInput = document.getElementById('audioFile').files[0];
    const password = document.getElementById('decryptionPassword').value.trim();

    if (!fileInput) {
        alert("الرجاء تحميل ملف صوتي لفك التشفير.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        try {
            const audioBuffer = await audioContext.decodeAudioData(event.target.result);
            const channelData = audioBuffer.getChannelData(0);

            let extractedText = "";
            for (let i = 0; i < channelData.length; i += 100) {
                const charCode = Math.round(Math.abs(channelData[i]) * 1000) - 300;
                if (charCode > 0 && charCode < 65536) {
                    extractedText += String.fromCharCode(charCode);
                }
            }

            let decryptedText = password 
                ? CryptoJS.AES.decrypt(extractedText, password).toString(CryptoJS.enc.Utf8) 
                : extractedText;

            if (!decryptedText) {
                decryptedText = "كلمة المرور غير صحيحة أو الملف الصوتي تالف.";
            }

            document.getElementById('outputText-voice').textContent = decryptedText;
        } catch (error) {
            console.error("خطأ في فك تشفير الملف الصوتي:", error);
            alert("تعذر فك تشفير الملف الصوتي. يرجى التحقق من صحة الملف.");
        }
    };

    reader.readAsArrayBuffer(fileInput);
}
