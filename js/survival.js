// ========== РЕЖИМ ВЫЖИВАНИЯ (КОМАНДНЫЙ ИИ) ==========

let survivalEnemies = [];
let spawnTimer = 0;
const SPAWN_INTERVAL = 12000; // 12 секунд между волнами
const MAX_ENEMIES = 3;

function spawnSurvivalEnemies() {
    survivalEnemies = [];
    spawnTimer = 0;
    spawnWave();
}

function spawnWave() {
    if (typeof players === 'undefined' || !players[0].alive) return;
    
    const player = players[0];
    const count = MAX_ENEMIES - survivalEnemies.filter(e => e.alive).length;
    
    for (let i = 0; i < count; i++) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0:
                x = 5 + Math.floor(Math.random() * (WIDTH - 10));
                y = 2;
                break;
            case 1:
                x = 5 + Math.floor(Math.random() * (WIDTH - 10));
                y = HEIGHT - 3;
                break;
            case 2:
                x = 2;
                y = 5 + Math.floor(Math.random() * (HEIGHT - 10));
                break;
            case 3:
                x = WIDTH - 3;
                y = 5 + Math.floor(Math.random() * (HEIGHT - 10));
                break;
        }
        
        if (player && Math.abs(x - player.x) < 4 && Math.abs(y - player.y) < 4) {
            x = (x + 5) % WIDTH;
            y = (y + 5) % HEIGHT;
        }
        
        const colors = ['#ff3366', '#ff6633', '#ff9933', '#ff33aa', '#ffaa33'];
        const trailColors = ['#882222', '#884422', '#886622', '#882266', '#886622'];
        const colorIndex = Math.floor(Math.random() * colors.length);
        
        survivalEnemies.push({
            x: x, y: y,
            dirX: 0,
            dirY: 0,
            trail: [{ x: x, y: y }],
            alive: true,
            color: colors[colorIndex],
            trailColor: trailColors[colorIndex],
            spawnProtection: 30,
            role: i === 0 ? 'hunter' : 'flanker' // лидер и фланговые
        });
    }
}

function updateSurvival() {
    if (opponentType !== 'survival') return;
    
    const player = players[0];
    if (!player.alive) {
        survivalEnemies = [];
        return;
    }
    
    // ===== КОМАНДНАЯ ЛОГИКА =====
    const aliveEnemies = survivalEnemies.filter(e => e.alive);
    const enemyCount = aliveEnemies.length;
    
    // Определяем центр группы
    let centerX = 0, centerY = 0;
    for (let e of aliveEnemies) {
        centerX += e.x;
        centerY += e.y;
    }
    if (enemyCount > 0) {
        centerX /= enemyCount;
        centerY /= enemyCount;
    }
    
    for (let i = 0; i < survivalEnemies.length; i++) {
        let e = survivalEnemies[i];
        if (!e.alive) continue;
        
        if (e.spawnProtection > 0) {
            e.spawnProtection--;
        }
        
        // ===== КОМАНДНАЯ ТАКТИКА =====
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const distToPlayer = Math.hypot(dx, dy);
        
        // Дистанция до центра группы
        const distToCenter = Math.hypot(centerX - e.x, centerY - e.y);
        
        let targetX = player.x;
        let targetY = player.y;
        
        // Роли врагов
        if (e.role === 'hunter' && enemyCount >= 2) {
            // Лидер преследует игрока, но не лезет на рожон
            if (distToPlayer < 4) {
                // Если близко — отступает и заманивает
                targetX = e.x - dx * 0.5;
                targetY = e.y - dy * 0.5;
            } else {
                targetX = player.x;
                targetY = player.y;
            }
        } else if (e.role === 'flanker' || enemyCount === 1) {
            // Фланговые заходят сбоку и стараются отрезать путь
            const angle = Math.atan2(dy, dx);
            const flankAngle = angle + (e === aliveEnemies[0] ? 1 : -1) * 0.8;
            
            // Предугадываем движение игрока
            const futureX = player.x + player.dirX * 3;
            const futureY = player.y + player.dirY * 3;
            
            targetX = futureX + Math.cos(flankAngle) * 3;
            targetY = futureY + Math.sin(flankAngle) * 3;
        } else {
            targetX = player.x;
            targetY = player.y;
        }
        
        // Ограничиваем целевые координаты
        targetX = Math.max(1, Math.min(WIDTH - 2, targetX));
        targetY = Math.max(1, Math.min(HEIGHT - 2, targetY));
        
        // Выбираем направление к цели
        const targetDx = targetX - e.x;
        const targetDy = targetY - e.y;
        const distToTarget = Math.hypot(targetDx, targetDy);
        
        let newDirX = e.dirX;
        let newDirY = e.dirY;
        
        if (distToTarget > 0.5) {
            const prob = Math.random();
            if (prob < 0.15) {
                // Случайное движение для непредсказуемости
                const dirs = [
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
                ];
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                newDirX = dir.dx;
                newDirY = dir.dy;
            } else if (Math.abs(targetDx) > Math.abs(targetDy)) {
                newDirX = targetDx > 0 ? 1 : -1;
                newDirY = 0;
            } else {
                newDirX = 0;
                newDirY = targetDy > 0 ? 1 : -1;
            }
        }
        
        // Проверка, не ведёт ли направление в тупик
        let newX = e.x + newDirX;
        let newY = e.y + newDirY;
        
        // Проверяем безопасность клетки
        let isSafe = true;
        for (let t of e.trail) {
            if (t.x === newX && t.y === newY) { isSafe = false; break; }
        }
        if (!isSafe) {
            // Ищем альтернативное направление
            const altDirs = [
                { dx: newDirY, dy: -newDirX },
                { dx: -newDirY, dy: newDirX },
                { dx: -newDirX, dy: -newDirY }
            ];
            for (let alt of altDirs) {
                const testX = e.x + alt.dx;
                const testY = e.y + alt.dy;
                let altSafe = true;
                for (let t of e.trail) {
                    if (t.x === testX && t.y === testY) { altSafe = false; break; }
                }
                if (altSafe) {
                    newDirX = alt.dx;
                    newDirY = alt.dy;
                    break;
                }
            }
        }
        
        e.dirX = newDirX;
        e.dirY = newDirY;
        
        // Движение
        e.x += e.dirX;
        e.y += e.dirY;
        e.trail.push({ x: e.x, y: e.y });
        
        if (e.trail.length > 25) {
            e.trail.shift();
        }
        
        // ===== ПРОВЕРКА СМЕРТИ ВРАГА =====
        let enemyDied = false;
        
        if (e.x < 0 || e.x >= WIDTH || e.y < 0 || e.y >= HEIGHT) {
            enemyDied = true;
        }
        
        if (!enemyDied) {
            for (let t = 0; t < e.trail.length - 2; t++) {
                if (e.trail[t].x === e.x && e.trail[t].y === e.y) {
                    enemyDied = true;
                    break;
                }
            }
        }
        
        if (!enemyDied) {
            for (let other of survivalEnemies) {
                if (other === e || !other.alive) continue;
                for (let t = 0; t < other.trail.length - 1; t++) {
                    if (other.trail[t].x === e.x && other.trail[t].y === e.y) {
                        enemyDied = true;
                        break;
                    }
                }
                if (enemyDied) break;
            }
        }
        
        if (!enemyDied && e.spawnProtection === 0) {
            for (let t = 0; t < player.trail.length - 1; t++) {
                if (player.trail[t].x === e.x && player.trail[t].y === e.y) {
                    enemyDied = true;
                    break;
                }
            }
        }
        
        if (!enemyDied && e.spawnProtection === 0 && e.x === player.x && e.y === player.y) {
            player.alive = false;
            enemyDied = true;
            if (typeof explode === 'function') explode(player.x, player.y, player.color);
            gameActive = false;
            showMessage('ВЫ ПРОИГРАЛИ! Нажмите ИГРАТЬ');
            if (typeof stopBgMusic === 'function') stopBgMusic();
            return;
        }
        
        if (enemyDied) {
            e.alive = false;
            if (typeof explode === 'function') explode(e.x, e.y, e.color);
        }
    }
    
    survivalEnemies = survivalEnemies.filter(e => e.alive);
    
    // ===== СПАВН НОВЫХ ВОЛН =====
    if (typeof spawnTimer !== 'undefined') {
        spawnTimer += 16;
        if (spawnTimer >= SPAWN_INTERVAL) {
            spawnTimer = 0;
            const aliveCount = survivalEnemies.filter(e => e.alive).length;
            if (aliveCount < MAX_ENEMIES) {
                spawnWave();
                showMessage(`⚠️ НОВАЯ ВОЛНА! (${MAX_ENEMIES - aliveCount} врагов)`);
            }
        }
    }
}

function resetSurvivalTimer() {
    spawnTimer = 0;
}
