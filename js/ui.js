// ========== ИНТЕРФЕЙС: ЭКРАНЫ И МЕНЮ ==========

let opponentType = '2p';
let matchMode = 'classic';
let paused = false;
let tournamentActive = false;
let tournamentScore = [0, 0];
let tournamentTarget = 3;

// Переключение экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Переключение активной кнопки в меню
function setMenuActive(group, activeId) {
    const container = document.getElementById(group);
    if (!container) return;
    const buttons = container.querySelectorAll('.menu-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}

function setupEventListeners() {
    // ===== ГЛАВНОЕ МЕНЮ =====
    // Выбор противника
    document.getElementById('menuOpponent2p').addEventListener('click', () => {
        opponentType = '2p';
        setMenuActive('menuOpponent2p', 'menuOpponent2p');
        showMessage('Противник: 2 игрока');
    });
    document.getElementById('menuOpponentAI').addEventListener('click', () => {
        opponentType = 'ai';
        setMenuActive('menuOpponentAI', 'menuOpponentAI');
        showMessage('Противник: VS AI');
    });
    document.getElementById('menuOpponentSurvival').addEventListener('click', () => {
        opponentType = 'survival';
        setMenuActive('menuOpponentSurvival', 'menuOpponentSurvival');
        showMessage('Противник: ВЫЖИВАНИЕ');
    });
    
    // Выбор режима матча
    document.getElementById('menuMatchClassic').addEventListener('click', () => {
        matchMode = 'classic';
        setMenuActive('menuMatchClassic', 'menuMatchClassic');
        tournamentActive = false;
        showMessage('Режим: Классика');
    });
    document.getElementById('menuMatchTournament').addEventListener('click', () => {
        matchMode = 'tournament';
        setMenuActive('menuMatchTournament', 'menuMatchTournament');
        tournamentScore = [0, 0];
        tournamentActive = true;
        showMessage('Режим: ТУРНИР до 3 побед');
    });
    
    // Кнопка ИГРАТЬ
    document.getElementById('menuPlayBtn').addEventListener('click', () => {
        // Обновляем UI перед переходом
        if (typeof updateUI === 'function') updateUI();
        // Показываем игровой экран
        showScreen('gameScreen');
        // Запускаем игру
        if (typeof resetGame === 'function') resetGame();
    });
    
    // Звук в меню
    document.getElementById('menuSoundToggle').addEventListener('click', () => {
        if (typeof toggleSound === 'function') toggleSound();
    });
    
    // ===== ИГРОВОЙ ЭКРАН =====
    // Кнопка НАЗАД
    document.getElementById('backToMenuBtn').addEventListener('click', () => {
        // Останавливаем игру
        if (typeof gameLoop !== 'undefined' && gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        gameActive = false;
        paused = false;
        // Показываем меню
        showScreen('menuScreen');
        // Обновляем рекорд в меню
        const recordDisplay = document.getElementById('menuRecordDisplay');
        if (recordDisplay && typeof bestRecord !== 'undefined') {
            recordDisplay.innerText = bestRecord;
        }
    });
    
    // ===== КЛАВИАТУРА =====
    document.addEventListener('keydown', (e) => {
        // ESC в игре — пауза
        if (e.key === 'Escape') {
            const gameScreen = document.getElementById('gameScreen');
            if (gameScreen.classList.contains('active')) {
                e.preventDefault();
                if (typeof gameActive !== 'undefined' && gameActive && !countdownActive) {
                    paused = !paused;
                    if (typeof draw === 'function') draw();
                }
            }
        }
        
        // Управление в игре
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen.classList.contains('active')) return;
        if (typeof gameActive === 'undefined' || !gameActive || paused || countdownActive) return;
        
        if (players[0].alive) {
            if (e.key === 'ArrowUp' && players[0].dirY !== 1) {
                players[0].dirX = 0; players[0].dirY = -1;
            }
            if (e.key === 'ArrowDown' && players[0].dirY !== -1) {
                players[0].dirX = 0; players[0].dirY = 1;
            }
            if (e.key === 'ArrowLeft' && players[0].dirX !== 1) {
                players[0].dirX = -1; players[0].dirY = 0;
            }
            if (e.key === 'ArrowRight' && players[0].dirX !== -1) {
                players[0].dirX = 1; players[0].dirY = 0;
            }
        }
        
        if (opponentType === '2p' && players[1].alive) {
            if (e.key === 'w' && players[1].dirY !== 1) {
                players[1].dirX = 0; players[1].dirY = -1;
            }
            if (e.key === 's' && players[1].dirY !== -1) {
                players[1].dirX = 0; players[1].dirY = 1;
            }
            if (e.key === 'a' && players[1].dirX !== 1) {
                players[1].dirX = -1; players[1].dirY = 0;
            }
            if (e.key === 'd' && players[1].dirX !== -1) {
                players[1].dirX = 1; players[1].dirY = 0;
            }
        }
    });
}

// Обновление UI (счёт)
function updateUI() {
    const p1Score = document.getElementById('gamePlayer1Score');
    const p2Score = document.getElementById('gamePlayer2Score');
    
    if (p1Score) {
        p1Score.innerText = matchMode === 'tournament' ? tournamentScore[0] : players[0].score;
    }
    if (p2Score) {
        if (opponentType === 'survival') {
            p2Score.innerText = survivalEnemies.length;
        } else {
            p2Score.innerText = matchMode === 'tournament' ? tournamentScore[1] : players[1].score;
        }
    }
    
    // Обновляем рекорд в меню
    const recordDisplay = document.getElementById('menuRecordDisplay');
    if (recordDisplay && typeof bestRecord !== 'undefined') {
        recordDisplay.innerText = bestRecord;
    }
}

// Показ сообщения
function showMessage(msg) {
    const msgDiv = document.getElementById('gameMessage');
    if (msgDiv) msgDiv.innerText = msg;
}

function setActiveButton(group, activeId) {
    // Для совместимости со старым кодом
    const buttons = document.querySelectorAll(group);
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}
