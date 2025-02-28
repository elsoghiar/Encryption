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


document.getElementById('encryptvoButton').addEventListener('click', function() {
    const inputText = document.getElementById('inputText').value;
    const password = document.getElementById('encryptionPassword').value;

    // تشفير النص باستخدام كلمة المرور (إذا وجدت)
    let encryptedText = inputText;
    if (password) {
        encryptedText = CryptoJS.AES.encrypt(inputText, password).toString();
    }

    // تحويل النص المشفر إلى ترددات صوتية
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // تردد أساسي
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // إنشاء ملف صوتي
    const audioBuffer = audioContext.createBuffer(1, 44100, 44100); // 1 ثانية من الصوت
    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = audioBuffer;

    // تحويل النص المشفر إلى ترددات
    const data = new Float32Array(audioBuffer.length);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.sin(2 * Math.PI * i / audioBuffer.length * (1000 + encryptedText.charCodeAt(i % encryptedText.length)));
    }
    audioBuffer.getChannelData(0).set(data);

    // تشغيل الصوت
    bufferSource.start();

    // عرض الملف الصوتي وتوفير زر التنزيل
    const audioPlayer = document.getElementById('audioPlayer');
    const downloadLink = document.getElementById('downloadAudio');
    const blob = new Blob([data], { type: 'audio/wav' });
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
    reader.onload = function(event) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = event.target.result;

        audioContext.decodeAudioData(arrayBuffer, function(buffer) {
            const channelData = buffer.getChannelData(0);
            let encryptedText = '';

            // تحويل الترددات إلى نص مشفر
            for (let i = 0; i < channelData.length; i++) {
                const charCode = Math.round(channelData[i] * 1000);
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
        });
    };

    reader.readAsArrayBuffer(audioFile);
});
