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
    
    // ===== ГРУППА 2: РЕЖИМ МАТЧА =====
    const btnClassic = document.getElementById('menuMatchClassic');
    const btnTournament = document.getElementById('menuMatchTournament');
    const btnSurvival = document.getElementById('menuMatchSurvival');
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
    if (btnSurvival) {
        btnSurvival.addEventListener('click', () => {
            matchMode = 'survival';
            setMenuActive('match', 'menuMatchSurvival');
            tournamentActive = false;
            // Принудительно устанавливаем противника для выживания
            opponentType = 'survival';
            showMessage('Режим: ВЫЖИВАНИЕ');
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
                if (typeof startRace === 'function') {
                    startRace();
                } else {
                    console.error('Функция startRace не найдена!');
                }
            } else if (matchMode === 'survival') {
                // Запускаем выживание
                if (typeof updateUI === 'function') updateUI();
                showScreen('gameScreen');
                // Устанавливаем тип противника для выживания
                opponentType = 'survival';
                if (typeof resetGame === 'function') resetGame();
            } else {
                // Классика или турнир
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
    
    // ===== КНОПКА НАЗАД (ПОЛНАЯ ОСТАНОВКА ИГРЫ) =====
const backBtn = document.getElementById('backToMenuBtn');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        // 1. Останавливаем игровой цикл
        if (typeof gameLoop !== 'undefined' && gameLoop) {
            clearInterval(gameLoop);
            gameLoop = null;
        }
        
        // 2. Останавливаем все таймеры (если есть)
        if (typeof countdownInterval !== 'undefined') {
            clearInterval(countdownInterval);
        }
        
        // 3. Останавливаем музыку
        if (typeof stopBgMusic === 'function') {
            stopBgMusic();
        }
        
        // 4. Сбрасываем состояние игры
        if (typeof gameActive !== 'undefined') gameActive = false;
        paused = false;
        
        // 5. Очищаем врагов (если есть)
        if (typeof survivalEnemies !== 'undefined') {
            survivalEnemies = [];
        }
        
        // 6. Сбрасываем бонусы
        if (typeof resetBonuses === 'function') {
            resetBonuses();
        }
        
        // 7. Сбрасываем босса
        if (typeof resetBoss === 'function') {
            resetBoss();
        }
        
        // 8. Переключаемся на меню
        showScreen('menuScreen');
        
        // 9. Обновляем рекорд в меню
        const recordDisplay = document.getElementById('menuRecordDisplay');
        if (recordDisplay && typeof bestRecord !== 'undefined') {
            recordDisplay.innerText = bestRecord;
        }
        
        // 10. Очищаем сообщение
        showMessage('Выберите противника и режим матча, затем нажмите ИГРАТЬ');
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
            } else if (matchMode === 'survival') {
                // Перезапуск выживания
                opponentType = 'survival';
                if (typeof resetGame === 'function') {
                    resetGame();
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
        
        // Если режим гонок — управление через race.js
        if (matchMode === 'race') {
            if (typeof raceState !== 'undefined' && raceState.active && !raceState.gameOver) {
                const p = raceState.player;
                if (e.key === 'ArrowUp' && p.dirY !== 1) { p.dirY = -1; p.dirX = 0; }
                else if (e.key === 'ArrowDown' && p.dirY !== -1) { p.dirY = 1; p.dirX = 0; }
                else if (e.key === 'ArrowLeft' && p.dirX !== 1) { p.dirX = -1; p.dirY = 0; }
                else if (e.key === 'ArrowRight' && p.dirX !== -1) { p.dirX = 1; p.dirY = 0; }
            }
            return;
        }
        
        // Обычное управление для 2p, AI, выживание
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
        if (matchMode === 'survival') {
            p1Score.innerText = currentSteps || 0;
        } else {
            p1Score.innerText = matchMode === 'tournament' ? tournamentScore[0] : players[0].score;
        }
    }
    
    if (p2Score) {
        if (matchMode === 'survival') {
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
