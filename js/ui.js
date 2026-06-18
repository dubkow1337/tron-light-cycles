// ========== ИНТЕРФЕЙС: ЭКРАНЫ И МЕНЮ ==========

let opponentType = '2p';
let matchMode = 'classic';
let paused = false;
let tournamentActive = false;
let tournamentScore = [0, 0];
let tournamentTarget = 5;

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    
    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) {
        if (screenId === 'gameScreen') {
            bgVideo.style.display = 'none';
        } else {
            bgVideo.style.display = 'block';
        }
    }
}

function setMenuActive(group, activeId) {
    const buttons = document.querySelectorAll(`.menu-btn[data-group="${group}"]`);
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) {
        activeBtn.classList.add('active');
    } else {
        console.error('Кнопка с id', activeId, 'не найдена!');
    }
}

function setupEventListeners() {
    // ===== ГРУППА 1: ПРОТИВНИК =====
    const btn2p = document.getElementById('menuOpponent2p');
    const btnAI = document.getElementById('menuOpponentAI');
    const btnSurvival = document.getElementById('menuOpponentSurvival');
    
    if (btn2p) {
        btn2p.addEventListener('click', () => {
            opponentType = '2p';
            setMenuActive('opponent', 'menuOpponent2p');
            showMessage('Противник: 2 игрока');
        });
    }
    if (btnAI) {
        btnAI.addEventListener('click', () => {
            opponentType = 'ai';
            setMenuActive('opponent', 'menuOpponentAI');
            showMessage('Противник: VS AI');
        });
    }
    if (btnSurvival) {
        btnSurvival.addEventListener('click', () => {
            opponentType = 'survival';
            setMenuActive('opponent', 'menuOpponentSurvival');
            showMessage('Противник: ВЫЖИВАНИЕ');
        });
    }
    
    // ===== ГРУППА 2: РЕЖИМ МАТЧА =====
    const btnClassic = document.getElementById('menuMatchClassic');
    const btnTournament = document.getElementById('menuMatchTournament');
    const btnRace = document.getElementById('menuMatchRace');
    
    if (btnClassic) {
        btnClassic.addEventListener('click', () => {
            matchMode = 'classic';
            setMenuActive('match', 'menuMatchClassic');
            tournamentActive = false;
            showMessage('Режим: Классика');
        });
    }
    if (btnTournament) {
        btnTournament.addEventListener('click', () => {
            matchMode = 'tournament';
            setMenuActive('match', 'menuMatchTournament');
            tournamentScore = [0, 0];
            tournamentActive = true;
            showMessage('Режим: ТУРНИР до 3 побед');
        });
    }
    if (btnRace) {
        btnRace.addEventListener('click', () => {
            matchMode = 'race';
            setMenuActive('match', 'menuMatchRace');
            tournamentActive = false;
            showMessage('Режим: ГОНКИ');
        });
    }
    
    // ===== КНОПКА ИГРАТЬ =====
    const playBtn = document.getElementById('menuPlayBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (matchMode === 'race') {
                // Запускаем режим гонок
                if (typeof startRace === 'function') {
                    startRace();
                } else {
                    console.error('Функция startRace не найдена!');
                }
            } else {
                // Обычный запуск
                if (typeof updateUI === 'function') updateUI();
                showScreen('gameScreen');
                if (typeof resetGame === 'function') resetGame();
            }
        });
    }
    
    // ===== ЗВУК =====
    const soundBtn = document.getElementById('menuSoundToggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            if (typeof toggleSound === 'function') toggleSound();
        });
    }
    
    // ===== КНОПКА НАЗАД =====
    const backBtn = document.getElementById('backToMenuBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (typeof gameLoop !== 'undefined' && gameLoop) {
                clearInterval(gameLoop);
                gameLoop = null;
            }
            if (typeof gameActive !== 'undefined') gameActive = false;
            paused = false;
            
            // Сброс режима гонок
            if (typeof raceState !== 'undefined') {
                raceState.active = false;
                raceState.gameOver = false;
                raceState.win = false;
            }
            
            if (typeof survivalEnemies !== 'undefined') {
                survivalEnemies = [];
            }
            
            showScreen('menuScreen');
            const recordDisplay = document.getElementById('menuRecordDisplay');
            if (recordDisplay && typeof bestRecord !== 'undefined') {
                recordDisplay.innerText = bestRecord;
            }
        });
    }
    
    // ===== КНОПКА "ИГРАТЬ СНОВА" =====
    const restartBtn = document.getElementById('restartGameBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (matchMode === 'race') {
                if (typeof startRace === 'function') {
                    startRace();
                }
            } else {
                if (typeof resetGame === 'function') {
                    resetGame();
                }
            }
        });
    }
    
    // ===== КЛАВИАТУРА =====
    document.addEventListener('keydown', (e) => {
        // ESC — пауза (только в обычных режимах)
        if (e.key === 'Escape') {
            const gameScreen = document.getElementById('gameScreen');
            if (gameScreen && gameScreen.classList.contains('active')) {
                e.preventDefault();
                // В режиме гонок ESC не ставит паузу
                if (matchMode === 'race') return;
                if (typeof gameActive !== 'undefined' && gameActive && !countdownActive) {
                    paused = !paused;
                    if (typeof draw === 'function') draw();
                }
            }
        }
        
        // Управление в обычных режимах (не гонки)
        const gameScreen = document.getElementById('gameScreen');
        if (!gameScreen || !gameScreen.classList.contains('active')) return;
        
        // ===== УПРАВЛЕНИЕ В РЕЖИМЕ ГОНКИ =====
if (matchMode === 'race') {
    if (typeof raceState !== 'undefined' && raceState.active && !raceState.gameOver) {
        const p = raceState.player;
        // Меняем направление, а не координаты
        if (e.key === 'ArrowUp' && p.dirY !== 1) { p.dirY = -1; p.dirX = 0; }
        else if (e.key === 'ArrowDown' && p.dirY !== -1) { p.dirY = 1; p.dirX = 0; }
        else if (e.key === 'ArrowLeft' && p.dirX !== 1) { p.dirX = -1; p.dirY = 0; }
        else if (e.key === 'ArrowRight' && p.dirX !== -1) { p.dirX = 1; p.dirY = 0; }
    }
    return;
}
        
        // Обычное управление для 2p и AI
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
    
    // В режиме гонок показываем прогресс
    if (matchMode === 'race') {
        if (p1Score) {
            p1Score.innerText = raceState.player ? raceState.player.x : 0;
        }
        if (p2Score) {
            p2Score.innerText = raceState.win ? '🏁' : '🚧';
        }
        return;
    }
    
    if (p1Score) {
        if (opponentType === 'survival') {
            p1Score.innerText = currentSteps || 0;
        } else {
            p1Score.innerText = matchMode === 'tournament' ? tournamentScore[0] : players[0].score;
        }
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
