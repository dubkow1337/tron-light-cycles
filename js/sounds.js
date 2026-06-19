// ========== ЗВУК И ГОЛОС ==========

let bgMusic = null;
let soundEnabled = true;
let ttsVoice = null;

// ===== АУДИО-КОНТЕКСТ ДЛЯ ПИСКА =====
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// ===== ФУНКЦИЯ ПИСКА =====
function playBeep(frequency, duration, volume = 0.15, type = 'square') {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    } catch(e) {
        // Тишина, если звук не работает
    }
}

// ===== ОБРАТНЫЙ ОТСЧЁТ С ПИСКОМ =====
function countdownBeep(step) {
    if (!soundEnabled) return;
    
    switch(step) {
        case 3:
            playBeep(440, 0.3, 0.15, 'square');
            break;
        case 2:
            playBeep(660, 0.25, 0.15, 'square');
            break;
        case 1:
            playBeep(880, 0.2, 0.15, 'square');
            break;
        case 0:
            playBeep(1200, 0.1, 0.2, 'square');
            setTimeout(() => playBeep(1500, 0.15, 0.2, 'square'), 120);
            setTimeout(() => playBeep(1800, 0.2, 0.25, 'square'), 250);
            break;
    }
}

function initSound() {
    try {
        bgMusic = new Audio('assets/sounds/tron-music.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
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
    const btn = document.getElementById('menuSoundToggle');
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

function speakVictory(text) {
    if (!soundEnabled) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.85;
    utterance.pitch = 0.6;
    if (ttsVoice) utterance.voice = ttsVoice;
    window.speechSynthesis.speak(utterance);
}

// ===== СОВМЕСТИМОСТЬ =====
function speak(text) {
    if (text === "Три" || text === "Два" || text === "Один" || text === "Вперёд") {
        return;
    }
    speakVictory(text);
}

if (typeof window !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = loadTTSVoice;
    loadTTSVoice();
}
