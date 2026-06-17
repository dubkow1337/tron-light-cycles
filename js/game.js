// ========== ГЛАВНАЯ ЛОГИКА ИГРЫ ==========

let gameActive = true;
let gameLoop = null;
let countdownActive = false;
let countdownValue = 3;
let currentSteps = 0;
let bestRecord = localStorage.getItem('tronRecord') ? parseInt(localStorage.getItem('tronRecord')) : 0;
let MOVE_INTERVAL = 70;

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
        const recordDisplay = document.getElementById('menuRecordDisplay');
        if (recordDisplay) recordDisplay.innerText = bestRecord;
        showMessage(`🏆 НОВЫЙ РЕКОРД: ${bestRecord} шагов!`);
    }
    
    if (typeof speakVictory === 'function') {
        speakVictory(`${name} победил!`);
    }
}

function updateGame() {
    if (!gameActive) return;
    
    // ===== ДВИЖЕНИЕ ИГРОКОВ =====
    for (let p of players) {
        if (!p.alive) continue;
        p.x += p.dirX;
        p.y += p.dirY;
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 15) p.trail.shift();
        if (typeof addParticles === 'function') addParticles(p.x, p.y, p.color);
    }
    
    // ===== ОБНОВЛЕНИЕ РЕЖИМОВ =====
    if (opponentType === 'survival') {
        if (typeof updateSurvival === 'function') updateSurvival();
        if (typeof survivalEnemies !== 'undefined' && gameActive) {
            if (typeof spawnTimer !== 'undefined') {
                spawnTimer += 16;
            }
        }
    } else {
        if (typeof aiMove === 'function') aiMove();
    }
    
    if (typeof updateParticles === 'function') updateParticles();
    
    // ===== ПРОВЕРКА СТОЛКНОВЕНИЙ =====
    for (let p of players) {
        if (!p.alive) continue;
        
        // ЩИТ (полная неуязвимость)
        if (bonusShieldActive && p === players[0]) {
            continue;
        }
        
        // Границы
        if (p.x < 0 || p.x >= WIDTH || p.y < 0 || p.y >= HEIGHT) {
            p.alive = false;
            crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
            if (typeof explode === 'function') explode(p.x, p.y, p.color);
            continue;
        }
        
        // Свой след
        for (let i = 0; i < p.trail.length - 2; i++) {
            if (p.trail[i].x === p.x && p.trail[i].y === p.y) {
                p.alive = false;
                crashEffect = { active: true, x: p.x, y: p.y, color: p.color, timer: 5 };
                if (typeof explode === 'function') explode(p.x, p.y, p.color);
                break;
            }
        }
        if (!p.alive) continue;
        
        // Следы других игроков
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
        
        // Следы врагов (выживание)
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
    
    // ===== УРОН ПО БОССУ =====
    if (typeof boss !== 'undefined' && boss && boss.alive) {
        for (let p of players) {
            if (!p.alive) continue;
            for (let dx = 0; dx < (boss.size || 2); dx++) {
                for (let dy = 0; dy < (boss.size || 2); dy++) {
                    const bx = boss.x + dx;
                    const by = boss.y + dy;
                    if (p.x === bx && p.y === by) {
                        if (typeof hitBoss === 'function') {
                            hitBoss();
                            p.x -= p.dirX * 2;
                            p.y -= p.dirY * 2;
                        }
                        break;
                    }
                }
            }
        }
    }
    
    // ===== ОПРЕДЕЛЕНИЕ ПОБЕДИТЕЛЯ =====
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
        if (typeof survivalEnemies !== 'undefined') {
            survivalEnemies = [];
        }
        showMessage('ВЫ ПРОИГРАЛИ! Нажмите ИГРАТЬ');
        if (typeof stopBgMusic === 'function') stopBgMusic();
        return;
    }
    
    currentSteps++;
    updateUI();
    if (typeof draw === 'function') draw();
}

function initGame() {
    // ===== ПРИНУДИТЕЛЬНЫЙ СБРОС ВРАГОВ =====
    if (typeof survivalEnemies !== 'undefined') {
        survivalEnemies = [];
    }
    if (typeof spawnTimer !== 'undefined') {
        spawnTimer = 0;
    }
    
    if (typeof resetPlayers === 'function') resetPlayers();
    
    if (opponentType === 'survival') {
        if (typeof spawnSurvivalEnemies === 'function') spawnSurvivalEnemies();
        if (typeof resetSurvivalTimer === 'function') resetSurvivalTimer();
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
            if (typeof countdownBeep === 'function') countdownBeep(2);
            if (typeof draw === 'function') draw();
        } else if (countdownValue === 1) {
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = '1...';
            if (typeof countdownBeep === 'function') countdownBeep(1);
            if (typeof draw === 'function') draw();
        } else if (countdownValue === 0) {
            const msgDiv = document.getElementById('gameMessage');
            if (msgDiv) msgDiv.textContent = 'GO!';
            if (typeof countdownBeep === 'function') countdownBeep(0);
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
