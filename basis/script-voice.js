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
    let inputText = document.getElementById("inputText").value.trim();
    let password = document.getElementById("encryptionPassword").value.trim();
    
    if (!inputText) return alert("Please enter text to encrypt!");

    let encryptedText = password ? CryptoJS.AES.encrypt(inputText, password).toString() : inputText;
    let binaryData = new TextEncoder().encode(encryptedText);
    let audioBuffer = await encodeToAudio(binaryData);
    playAndDownloadAudio(audioBuffer);
}

async function decryptAudioToText() {
    let file = document.getElementById("audioFile").files[0];
    let password = document.getElementById("decryptionPassword").value.trim();
    
    if (!file) return alert("Please select an audio file to decrypt!");

    let binaryData = await decodeFromAudio(file);
    let decryptedText = password ? CryptoJS.AES.decrypt(new TextDecoder().decode(binaryData), password).toString(CryptoJS.enc.Utf8) : new TextDecoder().decode(binaryData);
    
    document.getElementById("outputText-voice").textContent = decryptedText || "Failed to decrypt. Check the password.";
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

    let wavBlob = bufferToWav(buffer);
    let url = URL.createObjectURL(wavBlob);

    let audioPlayer = document.getElementById("audioPlayer");
    let downloadAudio = document.getElementById("downloadAudio");

    audioPlayer.src = url;
    downloadAudio.href = url;
    downloadAudio.download = "encrypted_audio.wav";
    downloadAudio.style.display = "block";
    downloadAudio.textContent = "Download encrypted audio";
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

function bufferToWav(audioBuffer) {
    let numOfChannels = audioBuffer.numberOfChannels;
    let length = audioBuffer.length * numOfChannels * 2 + 44;
    let buffer = new ArrayBuffer(length);
    let view = new DataView(buffer);
    let channels = [];
    let sampleRate = audioBuffer.sampleRate;

    let writeUTFBytes = function (offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeUTFBytes(0, "RIFF");
    view.setUint32(4, length - 8, true);
    writeUTFBytes(8, "WAVE");
    writeUTFBytes(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChannels * 2, true);
    view.setUint16(32, numOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeUTFBytes(36, "data");
    view.setUint32(40, length - 44, true);

    for (let i = 0; i < numOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
        for (let j = 0; j < numOfChannels; j++) {
            let sample = Math.max(-1, Math.min(1, channels[j][i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }

    return new Blob([view], { type: "audio/wav" });
}
