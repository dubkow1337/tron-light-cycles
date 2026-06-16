// ========== ТОЧКА ВХОДА ==========

let canvas, ctx;

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    window.canvas = canvas;
    window.ctx = ctx;
    
    if (typeof initSound === 'function') initSound();
    if (typeof setupEventListeners === 'function') setupEventListeners();
    
    const recordDisplay = document.getElementById('recordDisplay');
    if (recordDisplay && typeof bestRecord !== 'undefined') {
        recordDisplay.innerText = bestRecord;
    }
    
    if (typeof showMessage === 'function') {
        showMessage('Выберите противника и режим матча, затем нажмите ИГРАТЬ');
    }
    
    function waitForDraw() {
        if (typeof draw === 'function') {
            draw();
            console.log('✅ draw() найдена');
        } else {
            console.log('⏳ Ждём draw()...');
            setTimeout(waitForDraw, 100);
        }
    }
    waitForDraw();
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    if (typeof setActiveButton === 'function') {
        setActiveButton('.mode-selector .mode-btn', 'opponent2p');
        setActiveButton('.arena-selector .mode-btn', 'matchClassic');
    }
    window.opponentType = '2p';
    window.matchMode = 'classic';
    window.tournamentActive = false;
    init();
});
