// ========== ЗВУК И ГОЛОС ==========

let bgMusic = null;
let soundEnabled = true;
let ttsVoice = null;

function initSound() {
    try {
        bgMusic = new Audio('assets/sounds/tron-music.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.4;
    } catch(e) { 
        console.log('Sound not loaded'); 
    }
}

function playBgMusic() {
    if (bgMusic && soundEnabled && bgMusic.paused) {
        bgMusic.play().catch(e => console.log('Autoplay blocked'));
    }
}

function stopBgMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggle');
    if (btn) {
        btn.textContent = soundEnabled ? '🔊' : '🔇';
    }
    if (soundEnabled) {
        playBgMusic();
    } else {
        stopBgMusic();
    }
}

function loadTTSVoice() {
    const voices = window.speechSynthesis.getVoices();
    ttsVoice = voices.find(voice => voice.name === 'Microsoft Pavel' && voice.lang === 'ru-RU');
    if (!ttsVoice) setTimeout(loadTTSVoice, 200);
}

function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.85;
    utterance.pitch = 0.6;
    if (ttsVoice) utterance.voice = ttsVoice;
    window.speechSynthesis.speak(utterance);
}

// Загружаем голос
if (typeof window !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = loadTTSVoice;
    loadTTSVoice();
}
