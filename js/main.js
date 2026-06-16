// ========== ТОЧКА ВХОДА ==========

let canvas, ctx;

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    window.canvas = canvas;
    window.ctx = ctx;
    
    if (typeof initSound === 'function') initSound();
    if (typeof setupEventListeners === 'function') setupEventListeners();
    
    // Показываем меню
    showScreen('menuScreen');
    
    // Загружаем рекорд
    const recordDisplay = document.getElementById('menuRecordDisplay');
    if (recordDisplay && typeof bestRecord !== 'undefined') {
        recordDisplay.innerText = bestRecord;
    }
    
    // Показываем сообщение в меню
    showMessage('Выберите настройки и нажмите ИГРАТЬ');
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    init();
});
