// ========== РЕЖИМ "ГОНКИ" ==========

let raceState = {
    active: false,
    player: { x: 0, y: 0 },
    ai: { x: 0, y: 0 },
    obstacles: [],
    speed: 0,
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
    aiSpeed: 0.6
};

function initRace() {
    raceState.active = true;
    raceState.gameOver = false;
    raceState.win = false;
    raceState.player = {
        x: RACE_CONFIG.playerStartX,
        y: RACE_CONFIG.playerY,
        dirX: 1,
        dirY: 0,
        trail: [{ x: RACE_CONFIG.playerStartX, y: RACE_CONFIG.playerY }]
    };
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
    if (!raceState.active || raceState.gameOver) return;
    
    const player = raceState.player;
    const ai = raceState.ai;
    
    // ===== ДВИЖЕНИЕ ИГРОКА (только вправо, стрелки вверх/вниз) =====
    // Обрабатывается в keydown
    
    // Добавляем след игрока
    if (player.x !== player.trail[player.trail.length-1].x || 
        player.y !== player.trail[player.trail.length-1].y) {
        player.trail.push({ x: player.x, y: player.y });
        if (player.trail.length > 20) player.trail.shift();
    }
    
    // ===== ДВИЖЕНИЕ ИИ =====
    // ИИ всегда движется вправо, но может менять высоту, чтобы обойти препятствия
    ai.x += RACE_CONFIG.aiSpeed;
    
    // ИИ проверяет препятствия впереди
    let obstacleAhead = false;
    for (let obs of raceState.obstacles) {
        if (obs.x === Math.floor(ai.x) && Math.abs(obs.y - ai.y) <= 1) {
            obstacleAhead = true;
            break;
        }
    }
    
    if (obstacleAhead) {
        // Пытается обойти: вверх или вниз
        if (ai.y > 3 && Math.random() < 0.5) {
            ai.y--;
        } else if (ai.y < HEIGHT - 4 && Math.random() < 0.5) {
            ai.y++;
        }
    } else {
        // Иногда меняет полосу для обгона
        if (Math.random() < 0.01) {
            ai.y = 3 + Math.floor(Math.random() * (HEIGHT - 6));
        }
    }
    
    // Ограничиваем ИИ в нижней половине
    ai.y = Math.max(Math.floor(HEIGHT / 2) + 1, Math.min(HEIGHT - 3, ai.y));
    
    // Добавляем след ИИ
    const aiX = Math.round(ai.x);
    if (aiX !== ai.trail[ai.trail.length-1].x || 
        Math.round(ai.y) !== ai.trail[ai.trail.length-1].y) {
        ai.trail.push({ x: aiX, y: Math.round(ai.y) });
        if (ai.trail.length > 20) ai.trail.shift();
    }
    
    // ===== ДВИЖЕНИЕ ПРЕПЯТСТВИЙ =====
    for (let i = raceState.obstacles.length - 1; i >= 0; i--) {
        const obs = raceState.obstacles[i];
        obs.x -= RACE_CONFIG.obstacleSpeed;
        
        // Проверка столкновения с игроком
        if (Math.floor(obs.x) === player.x && obs.y === player.y) {
            raceState.gameOver = true;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В ПРЕПЯТСТВИЕ!');
            return;
        }
        
        // Проверка столкновения с ИИ
        if (Math.floor(obs.x) === Math.round(ai.x) && obs.y === Math.round(ai.y)) {
            // ИИ погибает, но мы просто удаляем препятствие
            raceState.obstacles.splice(i, 1);
            continue;
        }
        
        if (obs.x < 0) {
            raceState.obstacles.splice(i, 1);
        }
    }
    
    // ===== СПАВН ПРЕПЯТСТВИЙ =====
    if (Math.random() < 0.02) {
        // Спавним в верхней или нижней половине
        const isTop = Math.random() < 0.5;
        const y = isTop ? 1 + Math.floor(Math.random() * 3) : 
                           Math.floor(HEIGHT / 2) + 1 + Math.floor(Math.random() * 3);
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
    
    // Если ИИ достиг финиша раньше — поражение
    if (Math.round(ai.x) >= raceState.finishX) {
        raceState.gameOver = true;
        showMessage('💀 ИИ ДОШЁЛ ДО ФИНИША РАНЬШЕ!');
        return;
    }
}

function drawRace() {
    if (!raceState.active && !raceState.win && !raceState.gameOver) return;
    
    // ===== ФОН =====
    ctx.fillStyle = '#03050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ===== РАЗДЕЛИТЕЛЬНАЯ ЛИНИЯ =====
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // ===== ПОДПИСИ ПОЛОВИН =====
    ctx.fillStyle = 'rgba(0,255,255,0.2)';
    ctx.font = '14px Orbitron';
    ctx.fillText('ИГРОК', 10, 30);
    ctx.fillStyle = 'rgba(255,50,50,0.2)';
    ctx.fillText('ИИ', 10, canvas.height / 2 + 30);
    
    // ===== ФИНИШНАЯ ПОЛОСА =====
    const fx = raceState.finishX * CELL_SIZE;
    for (let y = 0; y < canvas.height / 2; y += 10) {
        ctx.fillStyle = (Math.floor(y / 10) % 2 === 0) ? '#ffff00' : '#000000';
        ctx.fillRect(fx, y, 8, 10);
    }
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 16px Orbitron';
    ctx.fillText('🏁', fx + 12, 30);
    
    // ===== СЛЕДЫ =====
    // След игрока
    if (raceState.player.trail.length > 1) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 6;
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
    
    // След ИИ
    if (raceState.ai.trail.length > 1) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 6;
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
    const px = raceState.player.x * CELL_SIZE + CELL_SIZE / 2;
    const py = raceState.player.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // ===== ИИ (ТРЕУГОЛЬНИК, КРАСНЫЙ) =====
    const ax = Math.round(raceState.ai.x) * CELL_SIZE + CELL_SIZE / 2;
    const ay = Math.round(raceState.ai.y) * CELL_SIZE + CELL_SIZE / 2;
    ctx.save();
    ctx.translate(ax, ay);
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff3300';
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-5, -5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.shadowBlur = 0;
}

// ===== УПРАВЛЕНИЕ В РЕЖИМЕ ГОНКИ =====
// (управление через keydown в ui.js)

// ===== ЗАПУСК РЕЖИМА =====
function startRace() {
    // Сохраняем текущий режим
    opponentType = 'race';
    initRace();
    showScreen('gameScreen');
    gameActive = true;
    // Очищаем старые интервалы
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    // Запускаем игровой цикл
    gameLoop = setInterval(() => {
        if (matchMode === 'race') {
            updateGame();
        }
    }, 50);
}
