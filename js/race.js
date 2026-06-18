// ========== РЕЖИМ "ГОНКИ" ==========

let raceState = {
    active: false,
    player: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    ai: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    obstacles: [],
    gameOver: false,
    win: false,
    finishX: 0
};

const RACE_CONFIG = {
    playerStartX: 2,
    playerY: 2,
    aiStartX: 2,
    aiY: HEIGHT - 3,
    finishX: WIDTH - 4,
    obstacleSpeed: 0.3,
    aiSpeed: 0.5
};

function initRace() {
    raceState.active = true;
    raceState.gameOver = false;
    raceState.win = false;
    
    // Игрок (верхняя половина)
    raceState.player = {
        x: RACE_CONFIG.playerStartX,
        y: RACE_CONFIG.playerY,
        dirX: 1,
        dirY: 0,
        trail: [{ x: RACE_CONFIG.playerStartX, y: RACE_CONFIG.playerY }]
    };
    
    // ИИ (нижняя половина)
    raceState.ai = {
        x: RACE_CONFIG.aiStartX,
        y: RACE_CONFIG.aiY,
        dirX: 1,
        dirY: 0,
        trail: [{ x: RACE_CONFIG.aiStartX, y: RACE_CONFIG.aiY }]
    };
    
    raceState.obstacles = [];
    raceState.finishX = RACE_CONFIG.finishX;
    
    showMessage('🏁 ГОНКА! ДОБЕРИСЬ ДО ФИНИША!');
}

function updateRace() {
    if (!raceState.active || raceState.gameOver || raceState.win) return;
    
    const player = raceState.player;
    const ai = raceState.ai;
    
    // ===== ДВИЖЕНИЕ ИГРОКА (ПОСТОЯННОЕ) =====
    player.x += player.dirX;
    player.y += player.dirY;
    
    // ===== ОГРАНИЧЕНИЯ ИГРОКА (ВЕРХНЯЯ ПОЛОВИНА) =====
    // Верхняя граница
    if (player.y < 0) player.y = 0;
    // Нижняя граница (середина поля)
    if (player.y >= Math.floor(HEIGHT / 2)) player.y = Math.floor(HEIGHT / 2) - 1;
    // Левая граница
    if (player.x < 0) player.x = 0;
    // Правая граница
    if (player.x >= WIDTH) player.x = WIDTH - 1;
    
    // След игрока
    if (player.trail.length === 0 || 
        player.trail[player.trail.length-1].x !== player.x || 
        player.trail[player.trail.length-1].y !== player.y) {
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 30) player.trail.shift();
    }
    
    // ===== ДВИЖЕНИЕ ИИ (ПОСТОЯННОЕ) =====
    ai.x += ai.dirX;
    ai.y += ai.dirY;
    
    // ===== ОГРАНИЧЕНИЯ ИИ (НИЖНЯЯ ПОЛОВИНА) =====
    // Верхняя граница (середина поля)
    if (ai.y < Math.floor(HEIGHT / 2) + 1) ai.y = Math.floor(HEIGHT / 2) + 1;
    // Нижняя граница
    if (ai.y >= HEIGHT) ai.y = HEIGHT - 1;
    // Левая граница
    if (ai.x < 0) ai.x = 0;
    // Правая граница
    if (ai.x >= WIDTH) ai.x = WIDTH - 1;
    
    // ИИ: проверка препятствий и манёвры
    const aiObstacleAhead = raceState.obstacles.some(obs => 
        obs.x === Math.round(ai.x) + 1 && obs.y === Math.round(ai.y)
    );
    if (aiObstacleAhead) {
        const up = ai.y - 1 >= Math.floor(HEIGHT / 2) + 1;
        const down = ai.y + 1 < HEIGHT;
        if (up && !raceState.obstacles.some(o => o.x === Math.round(ai.x) && o.y === ai.y - 1)) {
            ai.dirY = -1;
        } else if (down && !raceState.obstacles.some(o => o.x === Math.round(ai.x) && o.y === ai.y + 1)) {
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
        
        // Столкновение с игроком
        if (Math.floor(obs.x) === player.x && obs.y === player.y) {
            raceState.gameOver = true;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В ПРЕПЯТСТВИЕ!');
            return;
        }
        
        // Столкновение с ИИ
        if (Math.floor(obs.x) === Math.round(ai.x) && obs.y === Math.round(ai.y)) {
            raceState.obstacles.splice(i, 1);
            showMessage('🤖 ИИ ВРЕЗАЛСЯ В ПРЕПЯТСТВИЕ!');
            continue;
        }
        
        if (obs.x < 0) {
            raceState.obstacles.splice(i, 1);
        }
    }
    
    // ===== СПАВН ПРЕПЯТСТВИЙ =====
    if (Math.random() < 0.025) {
        // Спавним в верхней или нижней половине
        const y = Math.random() > 0.5 ? 
            1 + Math.floor(Math.random() * (Math.floor(HEIGHT / 2) - 2)) : // верхняя половина
            Math.floor(HEIGHT / 2) + 1 + Math.floor(Math.random() * (Math.floor(HEIGHT / 2) - 2)); // нижняя половина
        raceState.obstacles.push({
            x: WIDTH - 2,
            y: y,
            color: '#ff4444'
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
    
    // ===== ПРЕПЯТСТВИЯ =====
    for (let obs of raceState.obstacles) {
        ctx.fillStyle = obs.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4444';
        ctx.fillRect(obs.x * CELL_SIZE, obs.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
    ctx.shadowBlur = 0;
    
    // ===== ИГРОК =====
    const px = raceState.player.x * CELL_SIZE + CELL_SIZE / 2;
    const py = raceState.player.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.save();
    ctx.translate(px, py);
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
    gameLoop = setInterval(() => {
        if (matchMode === 'race') {
            updateGame();
        }
    }, 60);
}
