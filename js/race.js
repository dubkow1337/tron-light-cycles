// ========== РЕЖИМ "ГОНКИ" (СМЕРТЕЛЬНЫЕ СТЕНЫ, УМНЫЙ ИИ) ==========

let raceState = {
    active: false,
    phase: 'restricted',       // 'restricted' | 'unrestricted' | 'finished'
    player: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    ai: { x: 0, y: 0, dirX: 1, dirY: 0, trail: [] },
    obstacles: [],
    gameOver: false,
    win: false,
    finishX: 0,
    wallX: 0,
    countdown: 0,
    countdownActive: false,
    speed: 0.7,
    startTime: 0,
    timer: 0,
    phaseTime: 30,
    finishRevealed: false
};

const RACE_CONFIG = {
    playerStartX: 2,
    playerY: Math.floor(HEIGHT / 4),
    aiStartX: 2,
    aiY: Math.floor(HEIGHT * 3 / 4),
    finishX: WIDTH - 4,
    wallX: Math.floor(WIDTH / 2) - 2,
    obstacleSpeed: 1.5,
    speed: 0.7,
    spawnRate: 0.05,
    doubleChance: 0.3,
    playerAimChance: 0.6,
    phaseTime: 30
};

function initRace() {
    raceState.active = false;
    raceState.phase = 'restricted';
    raceState.gameOver = false;
    raceState.win = false;
    raceState.countdown = 3;
    raceState.countdownActive = true;
    raceState.speed = RACE_CONFIG.speed;
    raceState.timer = 0;
    raceState.startTime = 0;
    raceState.finishRevealed = false;
    raceState.wallX = RACE_CONFIG.wallX;
    
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
            raceState.startTime = Date.now();
            clearInterval(countdownInterval);
            setTimeout(() => {
                showMessage('⏳ СТЕНА БЛОКИРУЕТ ПРОХОД! ЖДИТЕ 30 СЕКУНД!');
            }, 1000);
        }
    }, 1000);
}

function updateRace() {
    if (!raceState.active || raceState.gameOver || raceState.win) return;
    
    // ===== ТАЙМЕР =====
    if (raceState.phase === 'restricted') {
        const now = Date.now();
        raceState.timer = (now - raceState.startTime) / 1000;
        if (raceState.timer >= RACE_CONFIG.phaseTime) {
            raceState.phase = 'unrestricted';
            raceState.finishRevealed = true;
            showMessage('🚨 СТЕНА РАЗРУШЕНА! ФИНИШ ОТКРЫТ!');
            raceState.speed = 0.9;
        }
    }
    
    const player = raceState.player;
    const ai = raceState.ai;
    const speed = raceState.speed;
    const wallX = raceState.wallX;
    const isRestricted = raceState.phase === 'restricted';
    
    // ============================================================
    // ===== ДВИЖЕНИЕ ИГРОКА (с проверкой на смерть от стен) =====
    // ============================================================
    let newX = player.x + player.dirX * speed;
    let newY = player.y + player.dirY * speed;
    
    // Проверка на выход за границы поля
    if (newX < 0 || newX >= WIDTH || newY < 0 || newY >= HEIGHT) {
        raceState.gameOver = true;
        showMessage('💥 ВЫ ВРЕЗАЛИСЬ В ГРАНИЦУ!');
        return;
    }
    
    // Проверка на пересечение разделительной линии (если restricted)
    if (isRestricted) {
        // Игрок не должен пересекать середину поля (по Y)
        const maxY = Math.floor(HEIGHT / 2) - 1;
        if (newY > maxY) {
            raceState.gameOver = true;
            showMessage('💥 ВЫ ПЕРЕСЕКЛИ РАЗДЕЛИТЕЛЬ!');
            return;
        }
        // Нельзя пересечь вертикальную стену
        if (player.dirX > 0 && newX >= wallX) {
            raceState.gameOver = true;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В СТЕНУ!');
            return;
        }
        if (player.dirX < 0 && newX < 0) {
            raceState.gameOver = true;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В ГРАНИЦУ!');
            return;
        }
    } else {
        // В unrestricted режиме только границы поля
        // (уже проверено выше)
    }
    
    // Применяем новую позицию игрока
    player.x = newX;
    player.y = newY;
    
    // След игрока
    const px = Math.round(player.x);
    const py = Math.round(player.y);
    if (player.trail.length === 0 || 
        player.trail[player.trail.length-1].x !== px || 
        player.trail[player.trail.length-1].y !== py) {
        player.trail.push({ x: px, y: py });
        if (player.trail.length > 40) player.trail.shift();
    }
    
    // Проверка столкновения со своим следом
    for (let i = 0; i < player.trail.length - 2; i++) {
        if (player.trail[i].x === px && player.trail[i].y === py) {
            raceState.gameOver = true;
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В СВОЙ СЛЕД!');
            return;
        }
    }
    
    // ============================================================
    // ===== УМНЫЙ ИИ (выбирает безопасное направление) =====
    // ============================================================
    const aiX = Math.round(ai.x);
    const aiY = Math.round(ai.y);
    
    // Проверяем все 4 направления и выбираем лучшее
    const directions = [
        { dx: 1, dy: 0, label: 'right' },
        { dx: 0, dy: -1, label: 'up' },
        { dx: 0, dy: 1, label: 'down' },
        { dx: -1, dy: 0, label: 'left' }
    ];
    
    let bestDir = null;
    let bestScore = -Infinity;
    
    for (let dir of directions) {
        // Следующая позиция при этом направлении
        let testX = ai.x + dir.dx * speed;
        let testY = ai.y + dir.dy * speed;
        
        // Проверяем, не приведёт ли это к смерти
        let safe = true;
        
        // Границы поля
        if (testX < 0 || testX >= WIDTH || testY < 0 || testY >= HEIGHT) {
            safe = false;
        }
        
        // Разделитель (в restricted)
        if (isRestricted) {
            const minAIY = Math.floor(HEIGHT / 2) + 1;
            if (testY < minAIY) safe = false;
            // Вертикальная стена
            if (dir.dx > 0 && testX >= wallX) safe = false;
            if (dir.dx < 0 && testX < 0) safe = false;
        }
        
        // Проверка на столкновение с препятствиями (на следующей позиции)
        if (safe) {
            for (let obs of raceState.obstacles) {
                const ox = Math.floor(obs.x);
                const oy = obs.y;
                for (let dx = 0; dx < obs.size; dx++) {
                    for (let dy = 0; dy < obs.size; dy++) {
                        if (ox + dx === Math.round(testX) && oy + dy === Math.round(testY)) {
                            safe = false;
                            break;
                        }
                    }
                    if (!safe) break;
                }
                if (!safe) break;
            }
        }
        
        // Если безопасно, считаем оценку (приоритет — движение вправо к финишу)
        if (safe) {
            // Бонус за движение вправо
            let score = dir.dx * 10;
            // Бонус за движение вверх/вниз для манёвра
            if (dir.dy !== 0) score += 2;
            // Штраф за движение влево
            if (dir.dx < 0) score -= 5;
            // Случайный фактор для разнообразия
            score += Math.random() * 1.5;
            
            // Дополнительно: если есть препятствие впереди, предпочитаем уклоняться
            // (уже учтено через проверку безопасности)
            
            if (score > bestScore) {
                bestScore = score;
                bestDir = dir;
            }
        }
    }
    
    // Если нашли безопасное направление — применяем его
    if (bestDir) {
        ai.dirX = bestDir.dx;
        ai.dirY = bestDir.dy;
    } else {
        // Если нет безопасного направления (заблокирован), остаёмся на месте
        // (это крайний случай, лучше попытаться повернуть обратно)
        ai.dirX = -ai.dirX || 1;
        ai.dirY = 0;
    }
    
    // Движение ИИ с проверкой на смерть
    let aiNewX = ai.x + ai.dirX * speed;
    let aiNewY = ai.y + ai.dirY * speed;
    
    // Проверка на смерть ИИ (аналогично игроку)
    if (aiNewX < 0 || aiNewX >= WIDTH || aiNewY < 0 || aiNewY >= HEIGHT) {
        // ИИ погибает
        raceState.obstacles = []; // просто удаляем препятствия, но можно показать сообщение
        showMessage('🤖 ИИ РАЗБИЛСЯ!');
        // ИИ умирает, но игра продолжается (можно сделать проигрыш, если хотим)
        // Для упрощения просто удалим ИИ с поля
        raceState.ai.alive = false;
        // но мы не используем alive, поэтому просто остановим его движение
        // чтобы он не двигался дальше
        ai.dirX = 0;
        ai.dirY = 0;
        // Игрок может победить, если ИИ мёртв?
        // Пока просто покажем сообщение и продолжим
    } else {
        // Проверка на стену и разделитель
        if (isRestricted) {
            const minAIY = Math.floor(HEIGHT / 2) + 1;
            if (aiNewY < minAIY) {
                // ИИ пересек разделитель — смерть
                showMessage('🤖 ИИ ПЕРЕСЕК РАЗДЕЛИТЕЛЬ!');
                ai.dirX = 0; ai.dirY = 0;
                // можно объявить поражение игрока? пока просто остановим ИИ
            }
            if (ai.dirX > 0 && aiNewX >= wallX) {
                showMessage('🤖 ИИ ВРЕЗАЛСЯ В СТЕНУ!');
                ai.dirX = 0; ai.dirY = 0;
            }
        }
        ai.x = aiNewX;
        ai.y = aiNewY;
    }
    
    // След ИИ (если жив)
    if (ai.dirX !== 0 || ai.dirY !== 0) {
        if (ai.trail.length === 0 || 
            ai.trail[ai.trail.length-1].x !== Math.round(ai.x) || 
            ai.trail[ai.trail.length-1].y !== Math.round(ai.y)) {
            ai.trail.push({ x: Math.round(ai.x), y: Math.round(ai.y) });
            if (ai.trail.length > 30) ai.trail.shift();
        }
    }
    
    // ===== ДВИЖЕНИЕ ПРЕПЯТСТВИЙ =====
    for (let i = raceState.obstacles.length - 1; i >= 0; i--) {
        const obs = raceState.obstacles[i];
        obs.x -= RACE_CONFIG.obstacleSpeed;
        
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
            showMessage('💥 ВЫ ВРЕЗАЛИСЬ В ПРЕПЯТСТВИЕ!');
            return;
        }
        
        // Столкновение с ИИ (если он ещё активен)
        if (ai.dirX !== 0 || ai.dirY !== 0) {
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
                raceState.obstacles.splice(i, 1);
                showMessage('🤖 ИИ ВРЕЗАЛСЯ В ПРЕПЯТСТВИЕ!');
                // Останавливаем ИИ
                ai.dirX = 0; ai.dirY = 0;
                continue;
            }
        }
        
        if (obs.x < 0) {
            raceState.obstacles.splice(i, 1);
        }
    }
    
    // ===== СПАВН ПРЕПЯТСТВИЙ =====
    if (Math.random() < RACE_CONFIG.spawnRate) {
        let y;
        if (Math.random() < RACE_CONFIG.playerAimChance) {
            y = Math.round(player.y);
            y += Math.floor(Math.random() * 3 - 1);
            if (isRestricted) {
                y = Math.max(0, Math.min(Math.floor(HEIGHT/2)-1, y));
            } else {
                y = Math.max(0, Math.min(HEIGHT-1, y));
            }
        } else {
            if (isRestricted) {
                const maxY = Math.floor(HEIGHT/2)-1;
                y = Math.random() > 0.5 ? 1 + Math.floor(Math.random()*(maxY-1)) : 
                    Math.floor(HEIGHT/2)+1 + Math.floor(Math.random()*(HEIGHT - Math.floor(HEIGHT/2)-2));
            } else {
                y = Math.floor(Math.random() * HEIGHT);
            }
        }
        const size = Math.random() < RACE_CONFIG.doubleChance ? 2 : 1;
        if (size === 2) {
            if (isRestricted) {
                if (y + 1 >= Math.floor(HEIGHT/2)) y = Math.floor(HEIGHT/2) - 2;
            } else {
                if (y + 1 >= HEIGHT) y = HEIGHT - 2;
            }
        }
        raceState.obstacles.push({
            x: WIDTH - 2,
            y: y,
            color: '#ff4444',
            size: size
        });
    }
    
    // ===== ПРОВЕРКА ФИНИША =====
    if (raceState.phase === 'unrestricted') {
        if (player.x >= raceState.finishX) {
            raceState.win = true;
            raceState.active = false;
            showMessage('🏆 ВЫ ПОБЕДИЛИ! ФИНИШ!');
            return;
        }
        if (ai.dirX !== 0 || ai.dirY !== 0) {
            if (Math.round(ai.x) >= raceState.finishX) {
                raceState.gameOver = true;
                showMessage('💀 ИИ ДОШЁЛ ДО ФИНИША РАНЬШЕ!');
                return;
            }
        }
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
    
    // ===== ГОРИЗОНТАЛЬНАЯ РАЗДЕЛИТЕЛЬНАЯ ЛИНИЯ (всегда) =====
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
    
    // ===== ВЕРТИКАЛЬНАЯ КРАСНАЯ СТЕНА =====
    if (raceState.phase === 'restricted') {
        const wallX = raceState.wallX * CELL_SIZE;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0000';
        ctx.fillRect(wallX - 4, 0, 8, canvas.height);
        ctx.shadowBlur = 0;
        // Мигающие огни
        for (let y = 0; y < canvas.height; y += 30) {
            ctx.fillStyle = (Math.floor(Date.now() / 300) % 2 === 0) ? '#ff0000' : '#ff6666';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0000';
            ctx.beginPath();
            ctx.arc(wallX, y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
    
    // ===== ФИНИШ =====
    if (raceState.phase === 'unrestricted') {
        const fx = raceState.finishX * CELL_SIZE;
        for (let y = 0; y < canvas.height; y += 10) {
            ctx.fillStyle = (Math.floor(y / 10) % 2 === 0) ? '#ffff00' : '#000000';
            ctx.fillRect(fx, y, 8, 10);
        }
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px Orbitron';
        ctx.fillText('🏁', fx + 12, 30);
        ctx.shadowBlur = 0;
    }
    
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
    if (raceState.ai.dirX !== 0 || raceState.ai.dirY !== 0) {
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
    }
    
    ctx.shadowBlur = 0;
    
    // ===== ТАЙМЕР =====
    if (raceState.phase === 'restricted') {
        const remaining = Math.max(0, RACE_CONFIG.phaseTime - raceState.timer);
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 20px Orbitron';
        ctx.fillText(`⏳ ${Math.ceil(remaining)}с`, 20, 40);
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 16px Orbitron';
        ctx.fillText('🚧 СТЕНА', raceState.wallX * CELL_SIZE - 40, 30);
    }
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
