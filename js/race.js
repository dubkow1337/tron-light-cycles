// ========== РЕЖИМ "ВЫЖИВАНИЕ" (КЛАССИЧЕСКОЕ ДВИЖЕНИЕ, УМНЫЙ ИИ) ==========

let raceState = {
    active: false,
    gameOver: false,
    win: false,
    player: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    ai: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    obstacles: [],
    speed: 1.5,
    startTime: 0,
    score: 0,
    stuckCounter: 0
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
    aiSpeed: 0.7,
    stuckThreshold: 10
};

function initRace() {
    raceState.active = false;
    raceState.gameOver = false;
    raceState.win = false;
    raceState.speed = RACE_CONFIG.obstacleSpeed;
    raceState.startTime = 0;
    raceState.score = 0;
    raceState.stuckCounter = 0;
    raceState.phase = 'restricted';
    
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
    raceState.active = true; // ← ФИКС: активируем гонку
    raceState.startTime = Date.now();
}

function isSafeForAI(x, y, trail, obstacles, minY, maxY) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return false;
    if (y < minY || y > maxY) return false;
    
    for (let obs of obstacles) {
        const ox = Math.floor(obs.x);
        const oy = obs.y;
        for (let dx = 0; dx < obs.size; dx++) {
            for (let dy = 0; dy < obs.size; dy++) {
                if (ox + dx === Math.round(x) && oy + dy === Math.round(y)) {
                    return false;
                }
            }
        }
    }
    
    for (let i = 0; i < trail.length - 2; i++) {
        if (trail[i].x === Math.round(x) && trail[i].y === Math.round(y)) {
            return false;
        }
    }
    
    return true;
}

function updateRace() {
    if (!raceState.active || raceState.gameOver || raceState.win) return;
    
    const player = raceState.player;
    const ai = raceState.ai;
    const speed = raceState.speed;
    const ps = RACE_CONFIG.playerSpeed;
    const ais = RACE_CONFIG.aiSpeed;
    
    // ===== УСКОРЕНИЕ =====
    const now = Date.now();
    const elapsed = (now - raceState.startTime) / 1000;
    raceState.speed = Math.min(
        RACE_CONFIG.obstacleSpeed + elapsed * RACE_CONFIG.speedIncrease,
        RACE_CONFIG.maxSpeed
    );
    raceState.score = Math.floor(elapsed * 10);
    
    // ============================================================
    // ===== ИГРОК =====
    // ============================================================
    player.x += player.dirX * ps;
    player.y += player.dirY * ps;
    
    const maxY = Math.floor(HEIGHT / 2) - 1;
    if (player.y < 0) player.y = 0;
    if (player.y > maxY) player.y = maxY;
    if (player.x < 0) player.x = 0;
    if (player.x >= WIDTH) player.x = WIDTH - 1;
    
    const px = Math.round(player.x);
    const py = Math.round(player.y);
    if (player.trail.length === 0 || 
        player.trail[player.trail.length-1].x !== px || 
        player.trail[player.trail.length-1].y !== py) {
        player.trail.push({ x: px, y: py });
        if (player.trail.length > 40) player.trail.shift();
    }
    
    for (let i = 0; i < player.trail.length - 2; i++) {
        if (player.trail[i].x === px && player.trail[i].y === py) {
            raceState.gameOver = true;
            raceState.active = false;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В СВОЙ СЛЕД!');
            return;
        }
    }
    
    // ============================================================
    // ===== ИИ (УМНЫЙ) =====
    // ============================================================
    const minAIY = Math.floor(HEIGHT / 2) + 1;
    const maxAIY = HEIGHT - 1;
    const aiX = ai.x;
    const aiY = ai.y;
    
    if (Math.abs(ai.x - (ai.prevX || 0)) < 0.01 && Math.abs(ai.y - (ai.prevY || 0)) < 0.01) {
        raceState.stuckCounter++;
    } else {
        raceState.stuckCounter = 0;
    }
    ai.prevX = ai.x;
    ai.prevY = ai.y;
    
    function isSafeAI(x, y) {
        return isSafeForAI(x, y, ai.trail, raceState.obstacles, minAIY, maxAIY);
    }
    
    const dirs = [
        { dx: 1, dy: 0, priority: 4 },
        { dx: 0, dy: -1, priority: 3 },
        { dx: 0, dy: 1, priority: 3 },
        { dx: -1, dy: 0, priority: 2 }
    ];
    
    if (raceState.stuckCounter > RACE_CONFIG.stuckThreshold) {
        dirs[0].priority = 2;
        dirs[1].priority = 4;
        dirs[2].priority = 4;
        raceState.stuckCounter = 0;
    }
    
    let obstacleAhead = false;
    for (let step = 1; step <= 3; step++) {
        const testX = aiX + ai.dirX * step * ais;
        const testY = aiY + ai.dirY * step * ais;
        if (!isSafeAI(testX, testY)) {
            obstacleAhead = true;
            break;
        }
    }
    
    if (obstacleAhead) {
        dirs[1].priority = 5;
        dirs[2].priority = 5;
    }
    
    let bestDir = null;
    let bestScore = -Infinity;
    
    for (let dir of dirs) {
        let safe = true;
        for (let step = 1; step <= 3; step++) {
            const testX = aiX + dir.dx * step * ais;
            const testY = aiY + dir.dy * step * ais;
            if (!isSafeAI(testX, testY)) {
                safe = false;
                break;
            }
        }
        if (safe) {
            let score = dir.priority;
            score += Math.random() * 0.5;
            if (dir.dx === 1) score += 2;
            if (dir.dx === -1) score -= 1;
            if (dir.dy === -1 && aiY > (minAIY + 2)) score += 1;
            if (dir.dy === 1 && aiY < (maxAIY - 2)) score += 1;
            
            if (score > bestScore) {
                bestScore = score;
                bestDir = dir;
            }
        }
    }
    
    if (bestDir) {
        ai.dirX = bestDir.dx;
        ai.dirY = bestDir.dy;
    } else {
        const upSafe = isSafeAI(aiX, aiY - 1);
        const downSafe = isSafeAI(aiX, aiY + 1);
        if (upSafe && downSafe) {
            ai.dirX = 0;
            ai.dirY = (Math.random() < 0.5) ? -1 : 1;
        } else if (upSafe) {
            ai.dirX = 0;
            ai.dirY = -1;
        } else if (downSafe) {
            ai.dirX = 0;
            ai.dirY = 1;
        } else {
            ai.dirX = 0;
            ai.dirY = 0;
        }
    }
    
    ai.x += ai.dirX * ais;
    ai.y += ai.dirY * ais;
    
    if (ai.y < minAIY) ai.y = minAIY;
    if (ai.y > maxAIY) ai.y = maxAIY;
    if (ai.x < 0) ai.x = 0;
    if (ai.x >= WIDTH) ai.x = WIDTH - 1;
    
    const aiPX = Math.round(ai.x);
    const aiPY = Math.round(ai.y);
    if (ai.trail.length === 0 || 
        ai.trail[ai.trail.length-1].x !== aiPX || 
        ai.trail[ai.trail.length-1].y !== aiPY) {
        ai.trail.push({ x: aiPX, y: aiPY });
        if (ai.trail.length > 30) ai.trail.shift();
    }
    
    for (let i = 0; i < ai.trail.length - 2; i++) {
        if (ai.trail[i].x === aiPX && ai.trail[i].y === aiPY) {
            raceState.win = true;
            raceState.active = false;
            showMessage('🎉 ИИ ВРЕЗАЛСЯ В СВОЙ СЛЕД! ВЫ ПОБЕДИЛИ!');
            return;
        }
    }
    
    // ============================================================
    // ===== ПРЕПЯТСТВИЯ =====
    // ============================================================
    for (let i = raceState.obstacles.length - 1; i >= 0; i--) {
        const obs = raceState.obstacles[i];
        obs.x -= raceState.speed;
        
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
    
    // ===== СПАВН ПРЕПЯТСТВИЙ =====
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
    
    // ===== РАЗДЕЛИТЕЛЬ =====
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
    
    // ===== ИГРОК =====
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
    
    // ===== ИИ =====
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
