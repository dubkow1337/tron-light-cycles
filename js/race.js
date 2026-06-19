// ========== РЕЖИМ "ВЫЖИВАНИЕ С МЕТЕОРИТАМИ" ==========

let raceState = {
    active: false,
    gameOver: false,
    player: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    meteors: [],
    speed: 1.5,
    startTime: 0,
    score: 0
};

const RACE_CONFIG = {
    playerStartX: 5,
    playerStartY: Math.floor(HEIGHT / 2) - 2, // центр поля
    obstacleSpeed: 1.5,
    spawnRate: 0.08,
    doubleChance: 0.3,
    speedIncrease: 0.005,
    maxSpeed: 3.5,
    playerSpeed: 0.7 // такая же, как в классике
};

function initRace() {
    raceState.active = false;
    raceState.gameOver = false;
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
    
    raceState.meteors = [];
    
    showMessage('☄️ УКЛОНЯЙСЯ ОТ МЕТЕОРИТОВ!');
    raceState.active = true;
    raceState.startTime = Date.now();
}

function updateRace() {
    if (!raceState.active || raceState.gameOver) return;
    
    const player = raceState.player;
    const speed = raceState.speed;
    const ps = RACE_CONFIG.playerSpeed;
    
    // ===== УСКОРЕНИЕ =====
    const now = Date.now();
    const elapsed = (now - raceState.startTime) / 1000;
    raceState.speed = Math.min(
        RACE_CONFIG.obstacleSpeed + elapsed * RACE_CONFIG.speedIncrease,
        RACE_CONFIG.maxSpeed
    );
    raceState.score = Math.floor(elapsed * 10);
    
    // ===== ДВИЖЕНИЕ ИГРОКА (как в классике) =====
    player.x += player.dirX * ps;
    player.y += player.dirY * ps;
    
    // Ограничения
    if (player.y < 0) player.y = 0;
    if (player.y >= HEIGHT) player.y = HEIGHT - 1;
    if (player.x < 0) player.x = 0;
    if (player.x >= WIDTH) player.x = WIDTH - 1;
    
    // След игрока (длина 30, как везде)
    const px = Math.round(player.x);
    const py = Math.round(player.y);
    if (player.trail.length === 0 || 
        player.trail[player.trail.length-1].x !== px || 
        player.trail[player.trail.length-1].y !== py) {
        player.trail.push({ x: px, y: py });
        if (player.trail.length > 30) player.trail.shift();
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
    
    // ===== ДВИЖЕНИЕ МЕТЕОРИТОВ =====
    for (let i = raceState.meteors.length - 1; i >= 0; i--) {
        const m = raceState.meteors[i];
        m.x -= raceState.speed;
        m.y += Math.sin(Date.now() * 0.001 + m.id) * 0.05; // лёгкое покачивание
        
        // Столкновение с игроком
        const dx = Math.abs(Math.round(m.x) - px);
        const dy = Math.abs(Math.round(m.y) - py);
        if (dx < 1 && dy < 1) {
            raceState.gameOver = true;
            raceState.active = false;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В МЕТЕОРИТ!');
            return;
        }
        
        if (m.x < -2) {
            raceState.meteors.splice(i, 1);
        }
    }
    
    // ===== СПАВН МЕТЕОРИТОВ =====
    if (Math.random() < RACE_CONFIG.spawnRate) {
        const y = Math.random() * HEIGHT;
        const size = Math.random() < RACE_CONFIG.doubleChance ? 2 : 1;
        raceState.meteors.push({
            x: WIDTH + 1,
            y: y,
            size: size,
            id: Math.random() * 1000,
            color: `hsl(${20 + Math.random() * 20}, 100%, ${50 + Math.random() * 30}%)`
        });
    }
}

function drawRace() {
    if (!raceState.active && !raceState.gameOver) {
        ctx.fillStyle = '#03050a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 30px Orbitron';
        ctx.fillStyle = '#00ffff';
        ctx.textAlign = 'center';
        ctx.fillText('☄️ МЕТЕОРИТЫ!', canvas.width/2, canvas.height/2);
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
    
    // ===== ОЧКИ =====
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 20px Orbitron';
    ctx.fillText(`⏱ ${raceState.score}`, 20, 40);
    
    // ===== СЛЕД ИГРОКА =====
    if (raceState.player.trail.length > 1) {
        // Затухающий след
        const trail = raceState.player.trail;
        for (let i = 0; i < trail.length - 1; i++) {
            const alpha = i / trail.length;
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = alpha * 0.8;
            ctx.shadowBlur = 6 * alpha;
            ctx.shadowColor = '#00ffff';
            ctx.strokeStyle = '#00ffff';
            ctx.moveTo(trail[i].x * CELL_SIZE + CELL_SIZE/2, trail[i].y * CELL_SIZE + CELL_SIZE/2);
            ctx.lineTo(trail[i+1].x * CELL_SIZE + CELL_SIZE/2, trail[i+1].y * CELL_SIZE + CELL_SIZE/2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    // ===== МЕТЕОРИТЫ (красивые, круглые, с хвостом) =====
    for (let m of raceState.meteors) {
        const size = m.size || 1;
        const cx = m.x * CELL_SIZE + CELL_SIZE/2;
        const cy = m.y * CELL_SIZE + CELL_SIZE/2;
        const radius = size * CELL_SIZE / 1.5;
        
        // Свечение
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.8);
        grad.addColorStop(0, 'rgba(255, 200, 100, 0.9)');
        grad.addColorStop(0.3, m.color || '#ff6600');
        grad.addColorStop(0.7, 'rgba(255, 50, 0, 0.6)');
        grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff4400';
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Основной круг
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff4400';
        ctx.fillStyle = m.color || '#ff6600';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Пиксельный след (хвост метеорита)
        for (let j = 1; j <= 6; j++) {
            const alpha = 0.4 - j * 0.06;
            const px2 = cx + j * 5;
            const py2 = cy + (Math.sin(Date.now() * 0.001 + m.id + j) * 2);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff8844';
            ctx.shadowBlur = 0;
            ctx.fillRect(px2 - 2, py2 - 2, 4, 4);
            ctx.fillRect(px2 - 1, py2 - 1, 2, 2);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    // ===== ИГРОК (как в классике) =====
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
