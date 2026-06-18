// ========== РЕЖИМ "ГОНКИ" ==========

let raceState = {
    active: false,
    player: { x: 0, y: 0 },
    obstacles: [],
    enemies: [],
    flag: { x: 0, y: 0 },
    speed: 0,
    gameOver: false,
    win: false
};

const RACE_CONFIG = {
    playerStartX: 2,
    playerY: 2, // верхняя половина
    enemyY: HEIGHT - 3, // нижняя половина
    flagX: WIDTH - 4,
    flagY: 2,
    obstacleSpeed: 0.5,
    spawnInterval: 60 // кадров между появлением препятствий
};

function initRace() {
    raceState.active = true;
    raceState.gameOver = false;
    raceState.win = false;
    raceState.player = {
        x: RACE_CONFIG.playerStartX,
        y: RACE_CONFIG.playerY
    };
    raceState.obstacles = [];
    raceState.enemies = [];
    raceState.flag = {
        x: RACE_CONFIG.flagX,
        y: RACE_CONFIG.flagY
    };
    raceState.speed = 0;
    
    showMessage('🏁 ГОНКА! ДОБЕРИСЬ ДО ФЛАГА!');
}

function updateRace() {
    if (!raceState.active || raceState.gameOver) return;
    
    // ===== УПРАВЛЕНИЕ ИГРОКОМ =====
    // (движение обрабатывается в keydown)
    
    // ===== ДВИЖЕНИЕ ПРЕПЯТСТВИЙ =====
    for (let i = raceState.obstacles.length - 1; i >= 0; i--) {
        const obs = raceState.obstacles[i];
        obs.x -= RACE_CONFIG.obstacleSpeed;
        
        // Проверка столкновения с игроком
        if (obs.x === raceState.player.x && obs.y === raceState.player.y) {
            raceState.gameOver = true;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В ПРЕПЯТСТВИЕ!');
            return;
        }
        
        // Удаляем, если вышли за левый край
        if (obs.x < 0) {
            raceState.obstacles.splice(i, 1);
        }
    }
    
    // ===== СПАВН ПРЕПЯТСТВИЙ =====
    if (Math.random() < 0.03) {
        const y = 1 + Math.floor(Math.random() * 3); // только в верхней половине
        raceState.obstacles.push({
            x: WIDTH - 2,
            y: y,
            color: '#ff4444'
        });
    }
    
    // ===== ПРОВЕРКА ДОСТИЖЕНИЯ ФЛАГА =====
    if (raceState.player.x >= raceState.flag.x && 
        raceState.player.y === raceState.flag.y) {
        raceState.win = true;
        raceState.active = false;
        showMessage('🎉 ВЫ ДОБРАЛИСЬ ДО ФЛАГА! ПОБЕДА!');
        return;
    }
}

function drawRace() {
    if (!raceState.active && !raceState.win && !raceState.gameOver) return;
    
    // ===== ФОН =====
    ctx.fillStyle = '#03050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Разделительная линия (верх/низ)
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // ===== ПРЕПЯТСТВИЯ =====
    for (let obs of raceState.obstacles) {
        ctx.fillStyle = obs.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4444';
        ctx.fillRect(obs.x * CELL_SIZE, obs.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
    ctx.shadowBlur = 0;
    
    // ===== ФЛАГ =====
    const fx = raceState.flag.x * CELL_SIZE;
    const fy = raceState.flag.y * CELL_SIZE;
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffff00';
    ctx.fillRect(fx + 4, fy + 2, 4, 12);
    ctx.beginPath();
    ctx.moveTo(fx + 8, fy + 2);
    ctx.lineTo(fx + 16, fy + 6);
    ctx.lineTo(fx + 8, fy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // ===== ИГРОК =====
    const px = raceState.player.x * CELL_SIZE + CELL_SIZE / 2;
    const py = raceState.player.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillStyle = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ===== УПРАВЛЕНИЕ В РЕЖИМЕ ГОНКИ =====
document.addEventListener('keydown', (e) => {
    if (!raceState.active || raceState.gameOver) return;
    
    const p = raceState.player;
    if (e.key === 'ArrowUp' && p.y > 0) p.y--;
    if (e.key === 'ArrowDown' && p.y < 3) p.y++; // только верхняя половина
    if (e.key === 'ArrowRight' && p.x < WIDTH - 1) p.x++;
    if (e.key === 'ArrowLeft' && p.x > 0) p.x--;
});

// ===== ЗАПУСК РЕЖИМА =====
function startRace() {
    opponentType = 'race';
    initRace();
    showScreen('gameScreen');
    if (typeof resetGame === 'function') resetGame();
}
