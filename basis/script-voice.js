document.addEventListener("DOMContentLoaded", function () {
    initializeEventListeners();
});

function initializeEventListeners() {
    document.getElementById("encrypt-vo").addEventListener("click", showImageEncrypt);
    document.getElementById("decrypt-vo").addEventListener("click", showImageDecrypt);
}

function showImageEncrypt() {
    document.getElementById("encrypt-vo").classList.add("active");
    document.getElementById("decrypt-vo").classList.remove("active");
    
    document.getElementById("section-vo-en").classList.remove("hidden");
    document.getElementById("section-vo-de").classList.add("hidden");
}

function showImageDecrypt() {
    document.getElementById("decrypt-vo").classList.add("active");
    document.getElementById("encrypt-vo").classList.remove("active");
    
    document.getElementById("section-vo-de").classList.remove("hidden");
    document.getElementById("section-vo-en").classList.add("hidden");
}



document.getElementById('encryptvoButton').addEventListener('click', async function() {
    const inputText = document.getElementById('inputText').value;
    const password = document.getElementById('encryptionPassword').value;

    // تشفير النص باستخدام كلمة المرور (إذا وجدت)
    let encryptedText = inputText;
    if (password) {
        encryptedText = CryptoJS.AES.encrypt(inputText, password).toString();
    }

    // إنشاء ترددات صوتية من النص المشفر
    const sampleRate = 44100; // معدل العينات
    const duration = 2; // مدة الملف الصوتي (بالثواني)
    const numSamples = sampleRate * duration;
    const audioData = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
        const charCode = encryptedText.charCodeAt(i % encryptedText.length);
        audioData[i] = Math.sin(2 * Math.PI * i / sampleRate * (440 + charCode)); // ترددات معقدة
    }

    // إنشاء ملف WAV
    const wavData = await WavEncoder.encode({
        sampleRate: sampleRate,
        channelData: [audioData]
    });

    // عرض الملف الصوتي وتوفير زر التنزيل
    const audioPlayer = document.getElementById('audioPlayer');
    const downloadLink = document.getElementById('downloadAudio');
    const blob = new Blob([wavData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    audioPlayer.src = url;
    downloadLink.href = url;
    downloadLink.download = 'encrypted_audio.wav';
    downloadLink.style.display = 'block';
});

document.getElementById('decryptvoButton').addEventListener('click', function() {
    const audioFile = document.getElementById('audioFile').files[0];
    const password = document.getElementById('decryptionPassword').value;

    if (!audioFile) {
        alert('Please upload an audio file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(event) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = event.target.result;

        try {
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const channelData = audioBuffer.getChannelData(0);
            let encryptedText = '';

            // تحويل الترددات إلى نص مشفر
            for (let i = 0; i < channelData.length; i++) {
                const charCode = Math.round(Math.abs(channelData[i]) * 1000);
                if (charCode > 0) {
                    encryptedText += String.fromCharCode(charCode);
                }
            }

            // فك تشفير النص باستخدام كلمة المرور (إذا وجدت)
            let decryptedText = encryptedText;
            if (password) {
                decryptedText = CryptoJS.AES.decrypt(encryptedText, password).toString(CryptoJS.enc.Utf8);
            }

            // عرض النص الأصلي
            document.getElementById('outputText-voice').textContent = decryptedText;
        } catch (error) {
            console.error('Error decoding audio data:', error);
            alert('Unable to decode audio file. Please check if the file is valid.');
        }
    };

    reader.readAsArrayBuffer(audioFile);
});
