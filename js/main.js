// ========== ТОЧКА ВХОДА ==========

let canvas, ctx;

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Делаем глобальными
    window.canvas = canvas;
    window.ctx = ctx;
    
    // Инициализация
    if (typeof initSound === 'function') initSound();
    if (typeof setupEventListeners === 'function') setupEventListeners();
    
    // Настройка отображения счёта
    const recordDisplay = document.getElementById('recordDisplay');
    if (recordDisplay && typeof bestRecord !== 'undefined') {
        recordDisplay.innerText = bestRecord;
    }
    
    // Стартовое сообщение
    if (typeof showMessage === 'function') {
        showMessage('Выберите противника и режим матча, затем нажмите ИГРАТЬ');
    }
    
    // Начальная отрисовка
    if (typeof draw === 'function') draw();
    
    // Скрываем управление для второго игрока по умолчанию
    const p2Controls = document.getElementById('player2-controls');
    if (p2Controls) p2Controls.style.opacity = '0.5';
}

// Запуск после загрузки страницы
window.addEventListener('DOMContentLoaded', () => {
    // Устанавливаем активные кнопки
    if (typeof setActiveButton === 'function') {
        setActiveButton('.mode-selector .mode-btn', 'opponent2p');
        setActiveButton('.arena-selector .mode-btn', 'matchClassic');
    }
    
    // Глобальные переменные
    window.opponentType = '2p';
    window.matchMode = 'classic';
    window.tournamentActive = false;
    
    init();
});
