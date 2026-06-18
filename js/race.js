// ========== РЕЖИМ "ВЫЖИВАНИЕ" (КЛАССИЧЕСКОЕ ДВИЖЕНИЕ) ==========

let raceState = {
    active: false,
    gameOver: false,
    win: false,
    player: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    ai: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    obstacles: [],
    speed: 1.5,
    startTime: 0,
    score: 0
};

const RACE_CONFIG = {
    playerStartX: 5,
    playerStartY: Math.floor(HEIGHT / 4),
    aiStartX: 5,
    aiStartY: Math.floor(HEIGHT * 3 / 4),
    obstacleSpeed: 1.5,
    spawnRate: 0.06,
    doubleChance: 0.3,
    speedIncrease: 0.01,
    maxSpeed: 4.0,
    playerSpeed: 0.7,
    aiSpeed: 0.7
};

function initRace() {
    raceState.active = false;
    raceState.gameOver = false;
    raceState.win = false;
    raceState.speed = RACE_CONFIG.obstacleSpeed;
    raceState.startTime = 0;
    raceState.score = 0;
    
    raceState.player = {
        x: RACE_CONFIG.playerStartX,
        y: RACE_CONFIG.playerStartY,
        dirX: 1,
        dirY: 0,
        trail: [{ x: RACE_CONFIG.playerStartX, y: RACE_CONFIG.playerStartY }]
    };
    
    raceState.ai = {
        x: RACE_CONFIG.aiStartX,
        y: RACE_CONFIG.aiStartY,
        dirX: 1,
        dirY: 0,
        trail: [{ x: RACE_CONFIG.aiStartX, y: RACE_CONFIG.aiStartY }]
    };
    
    raceState.obstacles = [];
    
    showMessage('🏁 УКЛОНЯЙСЯ! КТО ПЕРВЫЙ ВРЕЖЕТСЯ — ПРОИГРАЛ!');
    raceState.active = true;
    raceState.startTime = Date.now();
}

function updateRace() {
    if (!raceState.active || raceState.gameOver || raceState.win) return;
    
    const player = raceState.player;
    const ai = raceState.ai;
    const speed = raceState.speed;
    const ps = RACE_CONFIG.playerSpeed;
    const ais = RACE_CONFIG.aiSpeed;
    
    // ===== УВЕЛИЧЕНИЕ СКОРОСТИ =====
    const now = Date.now();
    const elapsed = (now - raceState.startTime) / 1000;
    raceState.speed = Math.min(
        RACE_CONFIG.obstacleSpeed + elapsed * RACE_CONFIG.speedIncrease,
        RACE_CONFIG.maxSpeed
    );
    raceState.score = Math.floor(elapsed * 10);
    
    // ============================================================
    // ===== ИГРОК (классическое движение) =====
    // ============================================================
    player.x += player.dirX * ps;
    player.y += player.dirY * ps;
    
    // Ограничения (только верхняя половина)
    const maxY = Math.floor(HEIGHT / 2) - 1;
    if (player.y < 0) player.y = 0;
    if (player.y > maxY) player.y = maxY;
    if (player.x < 0) player.x = 0;
    if (player.x >= WIDTH) player.x = WIDTH - 1;
    
    // След игрока
    const px = Math.round(player.x);
    const py = Math.round(player.y);
    if (player.trail.length === 0 || 
        player.trail[player.trail.length-1].x !== px || 
        player.trail[player.trail.length-1].y !== py) {
        player.trail.push({ x: px, y: py });
        if (player.trail.length > 40) player.trail.shift();
    }
    
    // Проверка на свой след
    for (let i = 0; i < player.trail.length - 2; i++) {
        if (player.trail[i].x === px && player.trail[i].y === py) {
            raceState.gameOver = true;
            raceState.active = false;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В СВОЙ СЛЕД!');
            return;
        }
    }
    
    // ============================================================
    // ===== ИИ (классическое движение с уклонением) =====
    // ============================================================
    // Проверяем препятствия впереди
    const aiX = ai.x;
    const aiY = ai.y;
    const minAIY = Math.floor(HEIGHT / 2) + 1;
    const maxAIY = HEIGHT - 1;
    
    let obstacleAhead = false;
    for (let obs of raceState.obstacles) {
        // Проверяем препятствие на том же Y, что и ИИ (с учётом размера)
        const distX = obs.x - aiX;
        if (distX > 0 && distX < 6) {
            const obsY = obs.y;
            const obsSize = obs.size || 1;
            for (let dy = 0; dy < obsSize; dy++) {
                if (obsY + dy === Math.round(aiY)) {
                    obstacleAhead = true;
                    break;
                }
            }
        }
        if (obstacleAhead) break;
    }
    
    if (obstacleAhead) {
        // Уклоняемся — меняем вертикальное направление
        const up = aiY - 1 >= minAIY;
        const down = aiY + 1 <= maxAIY;
        if (up && down) {
            ai.dirY = (Math.random() < 0.5) ? -1 : 1;
        } else if (up) {
            ai.dirY = -1;
        } else if (down) {
            ai.dirY = 1;
        } else {
            // Если некуда уклоняться, поворачиваем назад (влево)
            ai.dirX = -1;
        }
        ai.dirX = 1; // продолжаем двигаться вправо
    } else {
        // Случайные манёвры
        if (Math.random() < 0.01) {
            ai.dirY = (Math.random() < 0.5) ? 1 : -1;
        } else if (Math.random() < 0.02) {
            ai.dirY = 0;
        }
        ai.dirX = 1;
    }
    
    // Движение ИИ
    ai.x += ai.dirX * ais;
    ai.y += ai.dirY * ais;
    
    // Ограничения ИИ (нижняя половина)
    if (ai.y < minAIY) ai.y = minAIY;
    if (ai.y > maxAIY) ai.y = maxAIY;
    if (ai.x < 0) ai.x = 0;
    if (ai.x >= WIDTH) ai.x = WIDTH - 1;
    
    // След ИИ
    const aiPX = Math.round(ai.x);
    const aiPY = Math.round(ai.y);
    if (ai.trail.length === 0 || 
        ai.trail[ai.trail.length-1].x !== aiPX || 
        ai.trail[ai.trail.length-1].y !== aiPY) {
        ai.trail.push({ x: aiPX, y: aiPY });
        if (ai.trail.length > 30) ai.trail.shift();
    }
    
    // Проверка ИИ на свой след
    for (let i = 0; i < ai.trail.length - 2; i++) {
        if (ai.trail[i].x === aiPX && ai.trail[i].y === aiPY) {
            // ИИ врезался в свой след — он проигрывает
            raceState.win = true;
            raceState.active = false;
            showMessage('🎉 ИИ ВРЕЗАЛСЯ В СВОЙ СЛЕД! ВЫ ПОБЕДИЛИ!');
            return;
        }
    }
    
    // ============================================================
    // ===== ПРЕПЯТСТВИЯ (движение, столкновения) =====
    // ============================================================
    for (let i = raceState.obstacles.length - 1; i >= 0; i--) {
        const obs = raceState.obstacles[i];
        obs.x -= raceState.speed;
        
        // Столкновение с игроком
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
            raceState.active = false;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В ПРЕПЯТСТВИЕ!');
            return;
        }
        
        // Столкновение с ИИ
        let hitAI = false;
        const aiX2 = Math.round(ai.x);
        const aiY2 = Math.round(ai.y);
        for (let dx = 0; dx < obs.size; dx++) {
            for (let dy = 0; dy < obs.size; dy++) {
                if (Math.floor(obs.x) + dx === aiX2 && obs.y + dy === aiY2) {
                    hitAI = true;
                    break;
                }
            }
            if (hitAI) break;
        }
        if (hitAI) {
            raceState.win = true;
            raceState.active = false;
            showMessage('🎉 ИИ ВРЕЗАЛСЯ В ПРЕПЯТСТВИЕ! ВЫ ПОБЕДИЛИ!');
            return;
        }
        
        if (obs.x < -2) {
            raceState.obstacles.splice(i, 1);
        }
    }
    
    // ============================================================
    // ===== СПАВН ПРЕПЯТСТВИЙ =====
    // ============================================================
    if (Math.random() < RACE_CONFIG.spawnRate) {
        const isPlayerSide = Math.random() < 0.5;
        let y;
        if (isPlayerSide) {
            const maxY = Math.floor(HEIGHT / 2) - 1;
            y = Math.floor(Math.random() * (maxY + 1));
        } else {
            const minY = Math.floor(HEIGHT / 2) + 1;
            y = minY + Math.floor(Math.random() * (HEIGHT - minY));
        }
        const size = Math.random() < RACE_CONFIG.doubleChance ? 2 : 1;
        if (size === 2) {
            if (isPlayerSide && y + 1 >= Math.floor(HEIGHT / 2)) {
                y = Math.floor(HEIGHT / 2) - 2;
            } else if (!isPlayerSide && y + 1 >= HEIGHT) {
                y = HEIGHT - 2;
            }
        }
        raceState.obstacles.push({
            x: WIDTH - 2,
            y: y,
            color: '#ff4444',
            size: size
        });
    }
}

function drawRace() {
    if (!raceState.active && !raceState.win && !raceState.gameOver) {
        ctx.fillStyle = '#03050a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 30px Orbitron';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 ГОТОВЫ?', canvas.width/2, canvas.height/2);
        ctx.textAlign = 'start';
        return;
    }
    
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
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(canvas.width, midY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    
    // ===== ОЧКИ =====
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 20px Orbitron';
    ctx.fillText(`⏱ ${raceState.score}`, 20, 40);
    
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
    
    // ===== ПРЕПЯТСТВИЯ =====
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
