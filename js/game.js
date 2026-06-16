// ========== ГЛАВНАЯ ЛОГИКА ИГРЫ ==========

let gameActive = true;
let gameLoop = null;
let countdownActive = false;
let countdownValue = 3;
let currentSteps = 0;
let bestRecord = localStorage.getItem('tronRecord') ? parseInt(localStorage.getItem('tronRecord')) : 0;
let MOVE_INTERVAL = 70;

// crashEffect из render.js
if (typeof crashEffect === 'undefined') {
    var crashEffect = { active: false, x: 0, y: 0, color: '#ffffff', timer: 0 };
}

// Флаги бонусов
let bonusShieldActive = false;
let bonusSpeedActive = false;
let bonusSlowActive = false;
let bonusNoTrailActive = false;

function showVictory(name) {
    const overlay = document.getElementById('victoryOverlay');
    if (overlay) {
        overlay.innerText = `${name.toUpperCase()} ПОБЕДИЛ!`;
        overlay.classList.add('show');
        setTimeout(() => overlay.classList.remove('show'), 2000);
    }
    
    if (matchMode === 'tournament') {
        if (name === 'Синий') tournamentScore[0]++;
        else if (name === 'Оранжевый') tournamentScore[1]++;
        updateUI();
        if (tournamentScore[0] >= tournamentTarget || tournamentScore[1] >= tournamentTarget) {
            let finalWinner = tournamentScore[0] >= tournamentTarget ? 'Синий' : 'Оранжевый';
            showMessage(`🏆 ТУРНИР ВЫИГРАЛ ${finalWinner.toUpperCase()}! 🏆`);
            tournamentScore = [0, 0];
            tournamentActive = false;
            return;
        }
        resetGame();
        showMessage(`Счёт турнира: ${tournamentScore[0]} : ${tournamentScore[1]} (до ${tournamentTarget})`);
        return;
    }
    
    if (opponentType === 'survival' && currentSteps > bestRecord) {
        bestRecord = currentSteps;
        localStorage.setItem('tronRecord', bestRecord);
        const recordDisplay = document.getElementById('recordDisplay');
        if (recordDisplay) recordDisplay.innerText = bestRecord;
        showMessage(`🏆 НОВЫЙ РЕКОРД: ${bestRecord} шагов!`);
    }
}

function updateGame() {
    if (!gameActive) return;
    
    for (let p of players) {
        if (!p.alive) continue;
        p.x += p.dirX;
        p.y += p.dirY;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 15) p.trail.shift();
        if (typeof addParticles === 'function') addParticles(p.x, p.y, p.color);
    }
    
    if (opponentType === 'survival') {
        if (typeof updateSurvival === 'function') updateSurvival();
    } else {
        if (typeof aiMove === 'function') aiMove();
    }
    
    if (typeof updateParticles === 'function') updateParticles();
    
    for (let p of players) {
        if (!p.alive) continue;
        
        // ЩИТ
        if (bonusShieldActive && p === players[0]) {
            continue;
        }
        
        if (p.x < 0 || p.x >= WIDTH || p.y < 0 || p.y >= HEIGHT) {
            p.alive = false;
            crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
            if (typeof explode === 'function') explode(p.x, p.y, p.color);
            continue;
        }
        
        for (let i = 0; i < p.trail.length - 2; i++) {
            if (p.trail[i].x === p.x && p.trail[i].y === p.y) {
                p.alive = false;
                crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
                if (typeof explode === 'function') explode(p.x, p.y, p.color);
                break;
            }
        }
        if (!p.alive) continue;
        
        for (let other of players) {
            if (other === p) continue;
            for (let i = 0; i < other.trail.length - 1; i++) {
                const seg = other.trail[i];
                const nextSeg = other.trail[i+1];
                const px = p.x * CELL_SIZE + CELL_SIZE/2;
                const py = p.y * CELL_SIZE + CELL_SIZE/2;
                const dist = pointToSegmentDistance(px, py,
                    seg.x * CELL_SIZE + CELL_SIZE/2, seg.y * CELL_SIZE + CELL_SIZE/2,
                    nextSeg.x * CELL_SIZE + CELL_SIZE/2, nextSeg.y * CELL_SIZE + CELL_SIZE/2);
                if (dist < CELL_SIZE/2) {
                    p.alive = false;
                    crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
                    if (typeof explode === 'function') explode(p.x, p.y, p.color);
                    break;
                }
            }
            if (!p.alive) break;
        }
        
        if (!p.alive) continue;
        if (typeof survivalEnemies !== 'undefined') {
            for (let e of survivalEnemies) {
                if (!e.alive) continue;
                for (let i = 0; i < e.trail.length - 1; i++) {
                    const seg = e.trail[i];
                    const nextSeg = e.trail[i+1];
                    const px = p.x * CELL_SIZE + CELL_SIZE/2;
                    const py = p.y * CELL_SIZE + CELL_SIZE/2;
                    const dist = pointToSegmentDistance(px, py,
                        seg.x * CELL_SIZE + CELL_SIZE/2, seg.y * CELL_SIZE + CELL_SIZE/2,
                        nextSeg.x * CELL_SIZE + CELL_SIZE/2, nextSeg.y * CELL_SIZE + CELL_SIZE/2);
                    if (dist < CELL_SIZE/2) {
                        p.alive = false;
                        crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
                        if (typeof explode === 'function') explode(p.x, p.y, p.color);
                        break;
                    }
                }
                if (!p.alive) break;
            }
        }
    }
    
    const alivePlayers = players.filter(p => p.alive);
    if (alivePlayers.length === 1 && opponentType !== 'survival') {
        let winnerIdx = players.findIndex(p => p.alive);
        players[winnerIdx].score++;
        gameActive = false;
        showVictory(players[winnerIdx].name);
        updateUI();
        if (typeof draw === 'function') draw();
        showMessage(`${players[winnerIdx].name} победил! Нажмите ИГРАТЬ`);
        if (typeof stopBgMusic === 'function') stopBgMusic();
        return;
    }
    
    if (alivePlayers.length === 0 && opponentType !== 'survival') {
        gameActive = false;
        showMessage('Ничья!');
        if (typeof stopBgMusic === 'function') stopBgMusic();
        return;
    }
    
    if (opponentType === 'survival' && !players[0].alive) {
        gameActive = false;
        showMessage('ВЫ ПРОИГРАЛИ! Нажмите ИГРАТЬ');
        if (typeof stopBgMusic === 'function') stopBgMusic();
        return;
    }
    
    currentSteps++;
    updateUI();
    if (typeof draw === 'function') draw();
}

function initGame() {
    if (typeof resetPlayers === 'function') resetPlayers();
    
    if (opponentType === 'survival') {
        if (typeof spawnSurvivalEnemies === 'function') spawnSurvivalEnemies();
        players[1].alive = false;
    }
    
    gameActive = false;
    countdownActive = true;
    countdownValue = 3;
    crashEffect.active = false;
    particles = [];
    currentSteps = 0;
    
    updateUI();
    if (typeof draw === 'function') draw();
    
    const countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue === 2) {
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = '2...';
            if (typeof speak === 'function') speak("Два");
            if (typeof draw === 'function') draw();
        } else if (countdownValue === 1) {
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = '1...';
            if (typeof speak === 'function') speak("Один");
            if (typeof draw === 'function') draw();
        } else if (countdownValue === 0) {
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = 'ВПЕРЁД!';
            if (typeof speak === 'function') speak("Вперёд");
            if (typeof draw === 'function') draw();
        } else if (countdownValue < 0) {
            clearInterval(countdownInterval);
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = '';
            gameActive = true;
            countdownActive = false;
            paused = false;
            if (typeof playBgMusic === 'function') playBgMusic();
            
            if (gameLoop) clearInterval(gameLoop);
            gameLoop = setInterval(() => {
                if (paused || !gameActive) return;
                updateGame();
            }, MOVE_INTERVAL);
        }
    }, 1000);
}

function resetGame() {
    if (gameLoop) clearInterval(gameLoop);
    paused = false;
    initGame();
}
