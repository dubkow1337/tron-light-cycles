// ========== ИНТЕРФЕЙС И УПРАВЛЕНИЕ ==========

let opponentType = '2p';
let matchMode = 'classic';
let paused = false;
let tournamentActive = false;
let tournamentScore = [0, 0];
let tournamentTarget = 3;

function updateUI() {
    const p1Score = document.getElementById('player1Score');
    const p2Score = document.getElementById('player2Score');
    
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
}

function setActiveButton(group, activeId) {
    const buttons = document.querySelectorAll(group);
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(activeId);
    if (activeBtn) activeBtn.classList.add('active');
}

function setupEventListeners() {
    // Кнопки выбора противника
    const btn2p = document.getElementById('opponent2p');
    const btnAI = document.getElementById('opponentAI');
    const btnSurvival = document.getElementById('opponentSurvival');
    
    if (btn2p) {
        btn2p.addEventListener('click', () => {
            opponentType = '2p';
            setActiveButton('.mode-selector .mode-btn', 'opponent2p');
            showMessage('Противник: 2 игрока');
        });
    }
    
    if (btnAI) {
        btnAI.addEventListener('click', () => {
            opponentType = 'ai';
            setActiveButton('.mode-selector .mode-btn', 'opponentAI');
            showMessage('Противник: VS AI');
        });
    }
    
    if (btnSurvival) {
        btnSurvival.addEventListener('click', () => {
            opponentType = 'survival';
            setActiveButton('.mode-selector .mode-btn', 'opponentSurvival');
            showMessage('Противник: ВЫЖИВАНИЕ');
        });
    }
    
    // Кнопки режима матча
    const btnClassic = document.getElementById('matchClassic');
    const btnTournament = document.getElementById('matchTournament');
    
    if (btnClassic) {
        btnClassic.addEventListener('click', () => {
            matchMode = 'classic';
            setActiveButton('.arena-selector .mode-btn', 'matchClassic');
            tournamentActive = false;
            showMessage('Режим: Классика');
        });
    }
    
    if (btnTournament) {
        btnTournament.addEventListener('click', () => {
            matchMode = 'tournament';
            setActiveButton('.arena-selector .mode-btn', 'matchTournament');
            tournamentScore = [0, 0];
            tournamentActive = true;
            showMessage('Режим: ТУРНИР до 3 побед');
        });
    }
    
    // Кнопка игры
    const playBtn = document.getElementById('playButton');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (typeof resetGame === 'function') resetGame();
        });
    }
    
    // Кнопка звука
    const soundBtn = document.getElementById('soundToggle');
    if (soundBtn) {
        soundBtn.addEventListener('click', toggleSound);
    }
    
    // Клавиатура
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            if (typeof gameActive !== 'undefined' && gameActive && !countdownActive) {
                paused = !paused;
                if (typeof draw === 'function') draw();
            }
        }
        
        if (typeof gameActive === 'undefined' || !gameActive || paused || countdownActive) return;
        
        // Игрок 1 (синий) - стрелки
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
        
        // Игрок 2 (оранжевый) - WASD (только в режиме 2p)
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
