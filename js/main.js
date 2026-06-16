// ========== ТОЧКА ВХОДА ==========

// canvas и ctx объявлены в render.js, НЕ ОБЪЯВЛЯЕМ ИХ ЗДЕСЬ!

function init() {
    // Используем глобальные canvas и ctx из render.js
    if (typeof canvas === 'undefined' || typeof ctx === 'undefined') {
        console.error('❌ canvas или ctx не найдены!');
        return;
    }
    
    window.canvas = canvas;
    window.ctx = ctx;
    
    if (typeof initSound === 'function') initSound();
    if (typeof setupEventListeners === 'function') setupEventListeners();
    
    // Показываем меню
    if (typeof showScreen === 'function') {
        showScreen('menuScreen');
    }
    
    // Загружаем рекорд
    const recordDisplay = document.getElementById('menuRecordDisplay');
    if (recordDisplay && typeof bestRecord !== 'undefined') {
        recordDisplay.innerText = bestRecord;
    }
    
    // Показываем сообщение в меню
    if (typeof showMessage === 'function') {
        showMessage('Выберите настройки и нажмите ИГРАТЬ');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    init();
});
 
