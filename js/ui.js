// ========== ИНТЕРФЕЙС: ЭКРАНЫ И МЕНЮ ==========

let opponentType = '2p';
let matchMode = 'classic';
let paused = false;
let tournamentActive = false;
let tournamentScore = [0, 0];
let tournamentTarget = 3;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}

// ===== СБРАСЫВАЕМ ТОЛЬКО В СВОЕЙ ГРУППЕ =====
function setMenuActive(groupSelector, activeId) {
    // 1. Находим ВСЕ кнопки в этой группе
    const buttons = document.querySelectorAll(groupSelector);
    // 2. Убираем класс active у всех кнопок в этой группе
    buttons.forEach(btn => btn.classList.remove('active'));
    // 3. Добавляем класс active только нужной
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) {
        activeBtn.classList.add('active');
    } else {
        console.error('Кнопка с id', activeId, 'не найдена!');
    }
}

// ===== АКТИВАЦИЯ КНОПОК ПРИ ЗАГРУЗКЕ (чтобы по умолчанию горели "2 игрока" и "Классика") =====
function setDefaultActive() {
    setMenuActive('.opponent-btn', 'menuOpponent2p');
    setMenuActive('.match-btn', 'menuMatchClassic');
}

function setupEventListeners() {
    // ===== ГРУППА 1: ПРОТИВНИК (класс .opponent-btn) =====
    const btn2p = document.getElementById('menuOpponent2p');
    const btnAI = document.getElementById('menuOpponentAI');
    const btnSurvival = document.getElementById('menuOpponentSurvival');
    
    if (btn2p) {
        btn2p.addEventListener('click', () => {
            opponentType = '2p';
            setMenuActive('.opponent-btn', 'menuOpponent2p');
            showMessage('Противник: 2 игрока');
        });
    }
    if (btnAI) {
        btnAI.addEventListener('click', () => {
            opponentType = 'ai';
            setMenuActive('.opponent-btn', 'menuOpponentAI');
            showMessage('Противник: VS AI');
        });
    }
    if (btnSurvival) {
        btnSurvival.addEventListener('click', () => {
            opponentType = 'survival';
            setMenuActive('.opponent-btn', 'menuOpponentSurvival');
            showMessage('Противник: ВЫЖИВАНИЕ');
        });
    }
    
    // ===== ГРУППА 2: РЕЖИМ МАТЧА (класс .match-btn) =====
    const btnClassic = document.getElementById('menuMatchClassic');
    const btnTournament = document.getElementById('menuMatchTournament');
    
    if (btnClassic) {
        btnClassic.addEventListener('click', () => {
            matchMode = 'classic';
            setMenuActive('.match-btn', 'menuMatchClassic');
            tournamentActive = false;
            showMessage('Режим: Классика');
        });
    }
    if (btnTournament) {
        btnTournament.addEventListener('click', () => {
            matchMode = 'tournament';
            setMenuActive('.match-btn', 'menuMatchTournament');
            tournamentScore = [0, 0];
            tournamentActive = true;
            showMessage('Режим: ТУРНИР до 3 побед');
        });
    }
    
    // ===== ОСТАЛЬНЫЕ КНОПКИ =====
    const playBtn = document.getElementById('menuPlayBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (typeof updateUI === 'function') updateUI();
            showScreen('gameScreen');
            if (typeof resetGame === 'function') resetGame();
        });
    }
    
    const soundBtn = document.getElementById('menuSoundToggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            if (typeof toggleSound === 'function') toggleSound();
        });
    }
    
    const backBtn = document.getElementById('backToMenuBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (typeof gameLoop !== 'undefined' && gameLoop) {
                clearInterval(gameLoop);
                gameLoop = null;
            }
            if (typeof gameActive !== 'undefined') gameActive = false;
            paused = false;
            showScreen('menuScreen');
            const recordDisplay = document.getElementById('menuRecordDisplay');
            if (recordDisplay && typeof bestRecord !== 'undefined') {
                recordDisplay.innerText = bestRecord;
            }
        });
    }
    
    // ===== КЛАВИАТУРА =====
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const gameScreen = document.getElementById('gameScreen');
            if (gameScreen && gameScreen.classList.contains('active')) {
                e.preventDefault();
                if (typeof gameActive !== 'undefined' && gameActive && !countdownActive) {
                    paused = !paused;
                    if (typeof draw === 'function') draw();
                }
            }
        }
        
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen || !gameScreen.classList.contains('active')) return;
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
    
    const recordDisplay = document.getElementById('menuRecordDisplay');
    if (recordDisplay && typeof bestRecord !== 'undefined') {
        recordDisplay.innerText = bestRecord;
    }
}

function showMessage(msg) {
    const msgDiv = document.getElementById('gameMessage');
    if (msgDiv) msgDiv.innerText = msg;
}

function setActiveButton(group, activeId) {
    const buttons = document.querySelectorAll(group);
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}

// ===== АВТОЗАПУСК ПРИ ЗАГРУЗКЕ =====
window.addEventListener('DOMContentLoaded', () => {
    setDefaultActive();
});
