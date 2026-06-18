// ========== РЕЖИМ "ГОНКИ" (ПЕРЕРАБОТАННЫЙ) ==========

let raceState = {
    active: false,
    player: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    ai: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    obstacles: [],
    gameOver: false,
    win: false,
    finishX: 0,
    countdown: 0,
    countdownActive: false,
    speed: 0.7           // ← общая скорость (снижена)
};

const RACE_CONFIG = {
    playerStartX: 2,
    playerY: Math.floor(HEIGHT / 4),
    aiStartX: 2,
    aiY: Math.floor(HEIGHT * 3 / 4),
    finishX: WIDTH - 4,
    obstacleSpeed: 1.5,      // ← быстрее, чтобы заставлять уворачиваться
    speed: 0.7,              // ← общая скорость движения
    spawnRate: 0.05,         // ← частота спавна
    doubleChance: 0.3,       // ← вероятность двойного блока
    playerAimChance: 0.6     // ← вероятность спавна на линии игрока
};

function initRace() {
    raceState.active = false;
    raceState.gameOver = false;
    raceState.win = false;
    raceState.countdown = 3;
    raceState.countdownActive = true;
    raceState.speed = RACE_CONFIG.speed;
    
    // Игрок
    raceState.player = {
        x: RACE_CONFIG.playerStartX,
        y: RACE_CONFIG.playerY,
        dirX: 1,
        dirY: 0,
        trail: [{ x: RACE_CONFIG.playerStartX, y: RACE_CONFIG.playerY }]
    };
    
    // ИИ (такая же скорость, как у игрока)
    raceState.ai = {
        x: RACE_CONFIG.aiStartX,
        y: RACE_CONFIG.aiY,
        dirX: 1,
        dirY: 0,
        trail: [{ x: RACE_CONFIG.aiStartX, y: RACE_CONFIG.aiY }],
        speed: RACE_CONFIG.speed   // ← теперь ИИ имеет ту же скорость
    };
    
    raceState.obstacles = [];
    raceState.finishX = RACE_CONFIG.finishX;
    
    showMessage('🏁 ГОНКА! СТАРТ ЧЕРЕЗ 3...');
    
    let countdownInterval = setInterval(() => {
        raceState.countdown--;
        if (raceState.countdown === 2) {
            showMessage('🏁 2...');
            if (typeof countdownBeep === 'function') countdownBeep(2);
        } else if (raceState.countdown === 1) {
            showMessage('🏁 1...');
            if (typeof countdownBeep === 'function') countdownBeep(1);
        } else if (raceState.countdown === 0) {
            showMessage('🏁 GO!');
            if (typeof countdownBeep === 'function') countdownBeep(0);
            raceState.active = true;
            raceState.countdownActive = false;
            clearInterval(countdownInterval);
            setTimeout(() => {
                showMessage('🏁 ГОНКА!');
            }, 1000);
        }
    }, 1000);
}

function updateRace() {
    if (!raceState.active || raceState.gameOver || raceState.win) return;
    
    const player = raceState.player;
    const ai = raceState.ai;
    const speed = raceState.speed;
    
    // ===== ДВИЖЕНИЕ ИГРОКА =====
    player.x += player.dirX * speed;
    player.y += player.dirY * speed;
    
    // ===== ОГРАНИЧЕНИЯ =====
    const maxY = Math.floor(HEIGHT / 2) - 1;
    if (player.y < 0) player.y = 0;
    if (player.y > maxY) player.y = maxY;
    if (player.x < 0) player.x = 0;
    if (player.x >= WIDTH) player.x = WIDTH - 1;
    
    // ===== СЛЕД ИГРОКА =====
    const px = Math.round(player.x);
    const py = Math.round(player.y);
    if (player.trail.length === 0 || 
        player.trail[player.trail.length-1].x !== px || 
        player.trail[player.trail.length-1].y !== py) {
        player.trail.push({ x: px, y: py });
        if (player.trail.length > 40) player.trail.shift();
    }
    
    // ===== ПРОВЕРКА СТОЛКНОВЕНИЯ СО СВОИМ СЛЕДОМ =====
    for (let i = 0; i < player.trail.length - 2; i++) {
        if (player.trail[i].x === px && player.trail[i].y === py) {
            raceState.gameOver = true;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В СВОЙ СЛЕД!');
            return;
        }
    }
    
    // ===== ДВИЖЕНИЕ ИИ (такая же скорость) =====
    ai.x += ai.dirX * speed;
    ai.y += ai.dirY * speed;
    
    // ===== ОГРАНИЧЕНИЯ ИИ =====
    const minAIY = Math.floor(HEIGHT / 2) + 1;
    if (ai.y < minAIY) ai.y = minAIY;
    if (ai.y >= HEIGHT) ai.y = HEIGHT - 1;
    if (ai.x < 0) ai.x = 0;
    if (ai.x >= WIDTH) ai.x = WIDTH - 1;
    
    // ИИ: проверка препятствий
    const aiObstacleAhead = raceState.obstacles.some(obs => {
        const ox = Math.floor(obs.x);
        const oy = obs.y;
        const aiX = Math.round(ai.x);
        const aiY = Math.round(ai.y);
        // Проверяем все клетки двойного блока
        for (let dx = 0; dx < obs.size; dx++) {
            for (let dy = 0; dy < obs.size; dy++) {
                if (ox + dx === aiX + 1 && oy + dy === aiY) return true;
            }
        }
        return false;
    });
    
    if (aiObstacleAhead) {
        const up = ai.y - 1 >= minAIY;
        const down = ai.y + 1 < HEIGHT;
        if (up && !raceState.obstacles.some(o => {
            const ox = Math.floor(o.x);
            const oy = o.y;
            const aiX = Math.round(ai.x);
            const aiY = Math.round(ai.y);
            for (let dx = 0; dx < o.size; dx++) {
                for (let dy = 0; dy < o.size; dy++) {
                    if (ox + dx === aiX && oy + dy === aiY - 1) return true;
                }
            }
            return false;
        })) {
            ai.dirY = -1;
        } else if (down && !raceState.obstacles.some(o => {
            const ox = Math.floor(o.x);
            const oy = o.y;
            const aiX = Math.round(ai.x);
            const aiY = Math.round(ai.y);
            for (let dx = 0; dx < o.size; dx++) {
                for (let dy = 0; dy < o.size; dy++) {
                    if (ox + dx === aiX && oy + dy === aiY + 1) return true;
                }
            }
            return false;
        })) {
            ai.dirY = 1;
        }
    } else {
        if (Math.random() < 0.005) {
            ai.dirY = (Math.random() > 0.5) ? 1 : -1;
        }
        if (Math.random() < 0.02) {
            ai.dirY = 0;
        }
    }
    
    // След ИИ
    if (ai.trail.length === 0 || 
        ai.trail[ai.trail.length-1].x !== Math.round(ai.x) || 
        ai.trail[ai.trail.length-1].y !== Math.round(ai.y)) {
        ai.trail.push({ x: Math.round(ai.x), y: Math.round(ai.y) });
        if (ai.trail.length > 30) ai.trail.shift();
    }
    
    // ===== ДВИЖЕНИЕ ПРЕПЯТСТВИЙ =====
    for (let i = raceState.obstacles.length - 1; i >= 0; i--) {
        const obs = raceState.obstacles[i];
        obs.x -= RACE_CONFIG.obstacleSpeed;
        
        // Столкновение с игроком (проверяем все клетки блока)
        let hitPlayer = false;
        const px2 = Math.round(player.x);
        const py2 = Math.round(player.y);
        for (let dx = 0; dx < obs.size; dx++) {
            for (let dy = 0; dy < obs.size; dy++) {
                if (Math.floor(obs.x) + dx === px2 && obs.y + dy === py2) {
                    hitPlayer = true;
                    break;
                }
            }
            if (hitPlayer) break;
        }
        if (hitPlayer) {
            raceState.gameOver = true;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В ПРЕПЯТСТВИЕ!');
            return;
        }
        
        // Столкновение с ИИ
        let hitAI = false;
        const aiX = Math.round(ai.x);
        const aiY = Math.round(ai.y);
        for (let dx = 0; dx < obs.size; dx++) {
            for (let dy = 0; dy < obs.size; dy++) {
                if (Math.floor(obs.x) + dx === aiX && obs.y + dy === aiY) {
                    hitAI = true;
                    break;
                }
            }
            if (hitAI) break;
        }
        if (hitAI) {
            raceState.obstacles.splice(i, 1);
            showMessage('🤖 ИИ ВРЕЗАЛСЯ В ПРЕПЯТСТВИЕ!');
            continue;
        }
        
        if (obs.x < 0) {
            raceState.obstacles.splice(i, 1);
        }
    }
    
    // ===== СПАВН ПРЕПЯТСТВИЙ (с прицелом на игрока) =====
    if (Math.random() < RACE_CONFIG.spawnRate) {
        const maxY = Math.floor(HEIGHT / 2) - 1;
        const minAIY = Math.floor(HEIGHT / 2) + 1;
        let y;
        // С вероятностью 0.6 спавним на линии игрока
        if (Math.random() < RACE_CONFIG.playerAimChance) {
            y = Math.round(player.y);
            // Немного отклоняем, чтобы не было слишком предсказуемо
            y += Math.floor(Math.random() * 3 - 1);
            y = Math.max(0, Math.min(maxY, y));
        } else {
            y = Math.random() > 0.5 ? 
                1 + Math.floor(Math.random() * (maxY - 1)) : 
                minAIY + Math.floor(Math.random() * (HEIGHT - minAIY - 1));
        }
        
        // Определяем размер блока (1x1 или 2x2)
        const size = Math.random() < RACE_CONFIG.doubleChance ? 2 : 1;
        // Убедимся, что блок помещается в половине
        if (size === 2) {
            if (y + 1 >= Math.floor(HEIGHT / 2) && y < Math.floor(HEIGHT / 2)) {
                // Если блок пересекает середину, смещаем вверх
                y = Math.floor(HEIGHT / 2) - 2;
            }
            if (y + 1 >= HEIGHT) y = HEIGHT - 2;
        }
        
        raceState.obstacles.push({
            x: WIDTH - 2,
            y: y,
            color: '#ff4444',
            size: size
        });
    }
    
    // ===== ПРОВЕРКА ФИНИША =====
    if (player.x >= raceState.finishX) {
        raceState.win = true;
        raceState.active = false;
        showMessage('🏆 ВЫ ПОБЕДИЛИ! ФИНИШ!');
        return;
    }
    
    if (Math.round(ai.x) >= raceState.finishX) {
        raceState.gameOver = true;
        showMessage('💀 ИИ ДОШЁЛ ДО ФИНИША РАНЬШЕ!');
        return;
    }
}

function drawRace() {
    if (!raceState.active && !raceState.win && !raceState.gameOver && raceState.countdownActive) {
        ctx.fillStyle = '#03050a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 80px Orbitron';
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00ffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const text = raceState.countdown > 0 ? raceState.countdown.toString() : 'GO!';
        ctx.fillText(text, canvas.width/2, canvas.height/2);
        ctx.shadowBlur = 0;
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
        return;
    }
    
    if (!raceState.active && !raceState.win && !raceState.gameOver) return;
    
    // ===== СЕТКА =====
    ctx.fillStyle = '#03050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#0f3f3a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= WIDTH; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
    
    // ===== РАЗДЕЛИТЕЛЬНАЯ ЛИНИЯ =====
    const midY = canvas.height / 2;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(canvas.width, midY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // ===== ФИНИШНАЯ ПОЛОСА =====
    const fx = raceState.finishX * CELL_SIZE;
    for (let y = 0; y < canvas.height; y += 10) {
        ctx.fillStyle = (Math.floor(y / 10) % 2 === 0) ? '#ffff00' : '#000000';
        ctx.fillRect(fx, y, 8, 10);
    }
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 16px Orbitron';
    ctx.fillText('🏁', fx + 12, 30);
    ctx.shadowBlur = 0;
    
    // ===== СЛЕД ИГРОКА =====
    if (raceState.player.trail.length > 1) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ffff';
        ctx.strokeStyle = '#00ffff';
        for (let i = 0; i < raceState.player.trail.length - 1; i++) {
            const p1 = raceState.player.trail[i];
            const p2 = raceState.player.trail[i+1];
            ctx.moveTo(p1.x * CELL_SIZE + CELL_SIZE/2, p1.y * CELL_SIZE + CELL_SIZE/2);
            ctx.lineTo(p2.x * CELL_SIZE + CELL_SIZE/2, p2.y * CELL_SIZE + CELL_SIZE/2);
        }
        ctx.stroke();
    }
    
    // ===== СЛЕД ИИ =====
    if (raceState.ai.trail.length > 1) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff3300';
        ctx.strokeStyle = '#ff3300';
        for (let i = 0; i < raceState.ai.trail.length - 1; i++) {
            const p1 = raceState.ai.trail[i];
            const p2 = raceState.ai.trail[i+1];
            ctx.moveTo(p1.x * CELL_SIZE + CELL_SIZE/2, p1.y * CELL_SIZE + CELL_SIZE/2);
            ctx.lineTo(p2.x * CELL_SIZE + CELL_SIZE/2, p2.y * CELL_SIZE + CELL_SIZE/2);
        }
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
    
    // ===== ПРЕПЯТСТВИЯ (с поддержкой двойных блоков) =====
    for (let obs of raceState.obstacles) {
        const size = obs.size || 1;
        ctx.fillStyle = obs.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4444';
        for (let dx = 0; dx < size; dx++) {
            for (let dy = 0; dy < size; dy++) {
                ctx.fillRect((obs.x + dx) * CELL_SIZE, (obs.y + dy) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
    ctx.shadowBlur = 0;
    
    // ===== ИГРОК (поворот) =====
    const px = Math.round(raceState.player.x) * CELL_SIZE + CELL_SIZE / 2;
    const py = Math.round(raceState.player.y) * CELL_SIZE + CELL_SIZE / 2;
    ctx.save();
    ctx.translate(px, py);
    if (raceState.player.dirX === 1) ctx.rotate(0);
    else if (raceState.player.dirX === -1) ctx.rotate(Math.PI);
    else if (raceState.player.dirY === -1) ctx.rotate(-Math.PI / 2);
    else if (raceState.player.dirY === 1) ctx.rotate(Math.PI / 2);
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // ===== ИИ (поворот) =====
    const ax = Math.round(raceState.ai.x) * CELL_SIZE + CELL_SIZE / 2;
    const ay = Math.round(raceState.ai.y) * CELL_SIZE + CELL_SIZE / 2;
    ctx.save();
    ctx.translate(ax, ay);
    if (raceState.ai.dirX === 1) ctx.rotate(0);
    else if (raceState.ai.dirX === -1) ctx.rotate(Math.PI);
    else if (raceState.ai.dirY === -1) ctx.rotate(-Math.PI / 2);
    else if (raceState.ai.dirY === 1) ctx.rotate(Math.PI / 2);
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff3300';
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.shadowBlur = 0;
}

function startRace() {
    opponentType = 'race';
    initRace();
    showScreen('gameScreen');
    gameActive = true;
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    drawRace();
    gameLoop = setInterval(() => {
        if (matchMode === 'race') {
            updateGame();
        }
    }, 60);
}
