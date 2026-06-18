// ========== РЕЖИМ "ГОНКИ" (НОВАЯ ВЕРСИЯ) ==========

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
    speed: 1
};

const RACE_CONFIG = {
    playerStartX: 2,
    playerY: Math.floor(HEIGHT / 4),
    aiStartX: 2,
    aiY: Math.floor(HEIGHT * 3 / 4),
    finishX: WIDTH - 4,
    obstacleSpeed: 0.8,
    aiSpeed: 0.5,
    spawnRate: 0.04,
    speedMultiplier: 1
};

function initRace() {
    raceState.active = false;
    raceState.gameOver = false;
    raceState.win = false;
    raceState.countdown = 3;
    raceState.countdownActive = true;
    raceState.speed = 1;
    
    // Игрок (центр верхней половины)
    raceState.player = {
        x: RACE_CONFIG.playerStartX,
        y: RACE_CONFIG.playerY,
        dirX: 1,
        dirY: 0,
        trail: [{ x: RACE_CONFIG.playerStartX, y: RACE_CONFIG.playerY }]
    };
    
    // ИИ (центр нижней половины)
    raceState.ai = {
        x: RACE_CONFIG.aiStartX,
        y: RACE_CONFIG.aiY,
        dirX: 1,
        dirY: 0,
        trail: [{ x: RACE_CONFIG.aiStartX, y: RACE_CONFIG.aiY }]
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
    
    // ===== ДВИЖЕНИЕ ИГРОКА (ПОСТОЯННОЕ) =====
    player.x += player.dirX * raceState.speed;
    player.y += player.dirY * raceState.speed;
    
    // ===== ОГРАНИЧЕНИЯ ИГРОКА (ВЕРХНЯЯ ПОЛОВИНА) =====
    const maxY = Math.floor(HEIGHT / 2) - 1;
    if (player.y < 0) player.y = 0;
    if (player.y > maxY) player.y = maxY;
    if (player.x < 0) player.x = 0;
    if (player.x >= WIDTH) player.x = WIDTH - 1;
    
    // След игрока
    if (player.trail.length === 0 || 
        player.trail[player.trail.length-1].x !== Math.round(player.x) || 
        player.trail[player.trail.length-1].y !== Math.round(player.y)) {
        player.trail.push({ x: Math.round(player.x), y: Math.round(player.y) });
        if (player.trail.length > 30) player.trail.shift();
    }
    
    // ===== ДВИЖЕНИЕ ИИ =====
    ai.x += ai.dirX * RACE_CONFIG.aiSpeed;
    ai.y += ai.dirY * RACE_CONFIG.aiSpeed;
    
    // ===== ОГРАНИЧЕНИЯ ИИ (НИЖНЯЯ ПОЛОВИНА) =====
    const minAIY = Math.floor(HEIGHT / 2) + 1;
    if (ai.y < minAIY) ai.y = minAIY;
    if (ai.y >= HEIGHT) ai.y = HEIGHT - 1;
    if (ai.x < 0) ai.x = 0;
    if (ai.x >= WIDTH) ai.x = WIDTH - 1;
    
    // ИИ: проверка препятствий
    const aiObstacleAhead = raceState.obstacles.some(obs => 
        obs.x === Math.round(ai.x) + 1 && obs.y === Math.round(ai.y)
    );
    if (aiObstacleAhead) {
        const up = ai.y - 1 >= minAIY;
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
        if (Math.floor(obs.x) === Math.round(player.x) && obs.y === Math.round(player.y)) {
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
    if (Math.random() < RACE_CONFIG.spawnRate) {
        const maxY = Math.floor(HEIGHT / 2) - 1;
        const minAIY = Math.floor(HEIGHT / 2) + 1;
        const y = Math.random() > 0.5 ? 
            1 + Math.floor(Math.random() * (maxY - 1)) : 
            minAIY + Math.floor(Math.random() * (HEIGHT - minAIY - 1));
        raceState.obstacles.push({
            x: WIDTH - 2,
            y: y,
            color: '#ff4444',
            size: 1
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
        // Обратный отсчёт
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
    
    // ===== ФОН (ДОРОГА) =====
    ctx.fillStyle = '#0a0f14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ===== ДОРОЖНАЯ РАЗМЕТКА =====
    ctx.strokeStyle = '#1a2a33';
    ctx.lineWidth = 2;
    for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // ===== РАЗДЕЛИТЕЛЬНАЯ ПОЛОСА =====
    const midY = canvas.height / 2;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
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
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
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
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
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
    
    // ===== ИГРОК (ТРЕУГОЛЬНИК) =====
    const px = Math.round(raceState.player.x) * CELL_SIZE + CELL_SIZE / 2;
    const py = Math.round(raceState.player.y) * CELL_SIZE + CELL_SIZE / 2;
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
    
    // ===== ИИ (ТРЕУГОЛЬНИК) =====
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
    drawRace();
    gameLoop = setInterval(() => {
        if (matchMode === 'race') {
            updateGame();
        }
    }, 60);
}
