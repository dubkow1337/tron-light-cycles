// ========== РЕЖИМ ВЫЖИВАНИЯ (БЕСКОНЕЧНЫЕ ВОЛНЫ) ==========

let survivalEnemies = [];
let spawnTimer = 0;
const SPAWN_INTERVAL = 12000; // 12 секунд между волнами
const MAX_ENEMIES = 3; // максимум врагов на поле

function spawnSurvivalEnemies() {
    survivalEnemies = [];
    spawnTimer = 0;
    
    // Первая волна — сразу 3 врага
    spawnWave();
}

function spawnWave() {
    if (typeof players === 'undefined' || !players[0].alive) return;
    
    const player = players[0];
    const count = MAX_ENEMIES - survivalEnemies.filter(e => e.alive).length;
    
    for (let i = 0; i < count; i++) {
        // Выбираем случайную сторону для спавна
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch(side) {
            case 0: // сверху
                x = 5 + Math.floor(Math.random() * (WIDTH - 10));
                y = 2;
                break;
            case 1: // снизу
                x = 5 + Math.floor(Math.random() * (WIDTH - 10));
                y = HEIGHT - 3;
                break;
            case 2: // слева
                x = 2;
                y = 5 + Math.floor(Math.random() * (HEIGHT - 10));
                break;
            case 3: // справа
                x = WIDTH - 3;
                y = 5 + Math.floor(Math.random() * (HEIGHT - 10));
                break;
        }
        
        // Убеждаемся, что враг не спавнится на игроке
        if (player && Math.abs(x - player.x) < 4 && Math.abs(y - player.y) < 4) {
            x = (x + 5) % WIDTH;
            y = (y + 5) % HEIGHT;
        }
        
        // Направление к игроку (приблизительно)
        let dirX = 0, dirY = 0;
        if (player) {
            const dx = player.x - x;
            const dy = player.y - y;
            if (Math.abs(dx) > Math.abs(dy)) {
                dirX = dx > 0 ? 1 : -1;
            } else {
                dirY = dy > 0 ? 1 : -1;
            }
        }
        
        const colors = ['#ff3366', '#ff6633', '#ff9933', '#ff33aa', '#ffaa33'];
        const trailColors = ['#882222', '#884422', '#886622', '#882266', '#886622'];
        const colorIndex = Math.floor(Math.random() * colors.length);
        
        survivalEnemies.push({
            x: x, y: y,
            dirX: dirX || -1,
            dirY: dirY || 0,
            trail: [{ x: x, y: y }],
            alive: true,
            color: colors[colorIndex],
            trailColor: trailColors[colorIndex],
            spawnProtection: 30 // кадров неуязвимости после спавна
        });
    }
}

function updateSurvival() {
    if (opponentType !== 'survival') return;
    
    const player = players[0];
    if (!player.alive) {
        // Если игрок умер — враги исчезают
        survivalEnemies = [];
        return;
    }
    
    // ===== ОБНОВЛЕНИЕ ВРАГОВ =====
    for (let i = 0; i < survivalEnemies.length; i++) {
        let e = survivalEnemies[i];
        if (!e.alive) continue;
        
        // Снимаем защиту после спавна
        if (e.spawnProtection > 0) {
            e.spawnProtection--;
        }
        
        // Простой AI — движение к игроку с небольшим хаосом
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const distance = Math.abs(dx) + Math.abs(dy);
        
        let newDirX = e.dirX;
        let newDirY = e.dirY;
        
        if (distance > 3 && Math.random() < 0.1) {
            if (Math.abs(dx) > Math.abs(dy)) {
                newDirX = dx > 0 ? 1 : -1;
                newDirY = 0;
            } else {
                newDirX = 0;
                newDirY = dy > 0 ? 1 : -1;
            }
        } else if (Math.random() < 0.02) {
            // Случайный манёвр
            const dirs = [
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
            ];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            newDirX = dir.dx;
            newDirY = dir.dy;
        }
        
        e.dirX = newDirX;
        e.dirY = newDirY;
        
        // Движение
        e.x += e.dirX;
        e.y += e.dirY;
        e.trail.push({ x: e.x, y: e.y });
        
        if (e.trail.length > 20) {
            e.trail.shift();
        }
        
        // Проверка смерти врага
        let enemyDied = false;
        
        // Столкновение с границами
        if (e.x < 0 || e.x >= WIDTH || e.y < 0 || e.y >= HEIGHT) {
            enemyDied = true;
        }
        
        // Столкновение со своим следом
        if (!enemyDied) {
            for (let t = 0; t < e.trail.length - 2; t++) {
                if (e.trail[t].x === e.x && e.trail[t].y === e.y) {
                    enemyDied = true;
                    break;
                }
            }
        }
        
        // Столкновение со следами других врагов
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
        
        // Столкновение со следом игрока (если не защищён)
        if (!enemyDied && e.spawnProtection === 0) {
            for (let t = 0; t < player.trail.length - 1; t++) {
                if (player.trail[t].x === e.x && player.trail[t].y === e.y) {
                    enemyDied = true;
                    break;
                }
            }
        }
        
        // Столкновение с игроком
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
    
    // Удаляем мёртвых врагов
    survivalEnemies = survivalEnemies.filter(e => e.alive);
    
    // ===== СПАВН НОВЫХ ВОЛН =====
    spawnTimer += 1000; // каждый кадр ~16мс, но мы считаем в updateGame
    if (spawnTimer >= SPAWN_INTERVAL) {
        spawnTimer = 0;
        const aliveCount = survivalEnemies.filter(e => e.alive).length;
        if (aliveCount < MAX_ENEMIES) {
            spawnWave();
            showMessage(`⚠️ НОВАЯ ВОЛНА! (${MAX_ENEMIES - aliveCount} врагов)`);
        }
    }
}

// Функция для сброса таймера при перезапуске
function resetSurvivalTimer() {
    spawnTimer = 0;
}
