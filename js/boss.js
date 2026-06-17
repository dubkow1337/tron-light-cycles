// ========== БОСС: LIGHT RUNNER (КВОРА) ==========

let boss = null;
let bossSpawnTimer = 0;
const BOSS_SPAWN_INTERVAL = 5000; // 5 секунд между появлениями
const BOSS_MAX_HEALTH = 5;

function spawnBoss() {
    if (boss && boss.alive) return;
    if (typeof players === 'undefined' || !players[0].alive) return;
    
    const player = players[0];
    
    // Спавним босса на противоположной стороне от игрока
    let x, y;
    const side = Math.floor(Math.random() * 4);
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
    
    boss = {
        x: x, y: y,
        dirX: 0,
        dirY: 0,
        trail: [{ x: x, y: y }],
        alive: true,
        color: '#ff3300',
        trailColor: '#ff2200',
        health: BOSS_MAX_HEALTH,
        maxHealth: BOSS_MAX_HEALTH,
        speed: 1.3, // на 30% быстрее
        doubleTrail: true,
        spawnProtection: 60,
        lastDirChange: 0
    };
    
    showMessage(`⚠️ LIGHT RUNNER ПОЯВИЛСЯ! (❤️ ${BOSS_MAX_HEALTH})`);
}

function updateBoss() {
    if (!boss || !boss.alive) return;
    
    const player = players[0];
    if (!player.alive) {
        boss.alive = false;
        boss = null;
        return;
    }
    
    // Снимаем защиту после спавна
    if (boss.spawnProtection > 0) {
        boss.spawnProtection--;
        return;
    }
    
    // ===== ИИ БОССА (агрессивный) =====
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distToPlayer = Math.hypot(dx, dy);
    
    // Меняем направление каждые 5-10 шагов
    boss.lastDirChange++;
    if (boss.lastDirChange > 5 + Math.floor(Math.random() * 5)) {
        boss.lastDirChange = 0;
        
        // Предугадываем движение игрока
        const futureX = player.x + player.dirX * 5;
        const futureY = player.y + player.dirY * 5;
        
        // Если близко — уходим в сторону и заходим с фланга
        if (distToPlayer < 6) {
            const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1.2 : -1.2);
            boss.dirX = Math.round(Math.cos(angle));
            boss.dirY = Math.round(Math.sin(angle));
        } else {
            // Идём на игрока с небольшим смещением
            const angle = Math.atan2(futureY - boss.y, futureX - boss.x);
            const offset = (Math.random() - 0.5) * 0.8;
            boss.dirX = Math.round(Math.cos(angle + offset));
            boss.dirY = Math.round(Math.sin(angle + offset));
        }
        
        // Убеждаемся, что направление не нулевое
        if (boss.dirX === 0 && boss.dirY === 0) {
            boss.dirX = 1;
        }
    }
    
    // Движение (с ускоренной скоростью)
    for (let step = 0; step < boss.speed; step++) {
        boss.x += boss.dirX;
        boss.y += boss.dirY;
        
        // Двойной след
        if (boss.doubleTrail) {
            // Основной след
            boss.trail.push({ x: boss.x, y: boss.y });
            // Параллельный след (смещение в зависимости от направления)
            if (boss.dirX !== 0) {
                boss.trail.push({ x: boss.x, y: boss.y + 1 });
                boss.trail.push({ x: boss.x, y: boss.y - 1 });
            } else {
                boss.trail.push({ x: boss.x + 1, y: boss.y });
                boss.trail.push({ x: boss.x - 1, y: boss.y });
            }
        } else {
            boss.trail.push({ x: boss.x, y: boss.y });
        }
        
        // Ограничиваем длину следа
        if (boss.trail.length > 40) {
            boss.trail.splice(0, 10);
        }
        
        // Проверка столкновения босса со стенами
        if (boss.x < 0 || boss.x >= WIDTH || boss.y < 0 || boss.y >= HEIGHT) {
            boss.alive = false;
            if (typeof explode === 'function') explode(boss.x, boss.y, boss.color);
            showMessage('💥 LIGHT RUNNER ВРЕЗАЛСЯ В СТЕНУ!');
            return;
        }
        
        // Проверка столкновения босса со своим следом
        for (let t = 0; t < boss.trail.length - 5; t++) {
            if (boss.trail[t].x === boss.x && boss.trail[t].y === boss.y) {
                boss.alive = false;
                if (typeof explode === 'function') explode(boss.x, boss.y, boss.color);
                showMessage('💥 LIGHT RUNNER ВРЕЗАЛСЯ В СВОЙ СЛЕД!');
                return;
            }
        }
        
        // Проверка столкновения босса с игроком
        if (boss.x === player.x && boss.y === player.y) {
            player.alive = false;
            if (typeof explode === 'function') explode(player.x, player.y, player.color);
            gameActive = false;
            showMessage('💀 ВАС СБИЛ LIGHT RUNNER!');
            if (typeof stopBgMusic === 'function') stopBgMusic();
            return;
        }
        
        // Проверка столкновения босса с другими врагами
        for (let e of survivalEnemies) {
            if (!e.alive) continue;
            if (e.x === boss.x && e.y === boss.y) {
                e.alive = false;
                if (typeof explode === 'function') explode(e.x, e.y, e.color);
            }
        }
    }
}

function hitBoss() {
    if (!boss || !boss.alive) return;
    
    boss.health--;
    if (typeof explode === 'function') explode(boss.x, boss.y, '#ffaa00');
    
    if (boss.health <= 0) {
        boss.alive = false;
        // Большой взрыв
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (typeof explode === 'function') {
                    explode(
                        boss.x + (Math.random() - 0.5) * 5,
                        boss.y + (Math.random() - 0.5) * 5,
                        '#ff3300'
                    );
                }
            }, i * 100);
        }
        showMessage(`🎉 LIGHT RUNNER УНИЧТОЖЕН! +10 шагов к рекорду`);
        currentSteps += 10;
        // Сбрасываем таймер спавна босса
        bossSpawnTimer = 0;
        boss = null;
    } else {
        showMessage(`💥 LIGHT RUNNER РАНЕН! ❤️ ${boss.health}/${boss.maxHealth}`);
    }
}

function resetBoss() {
    boss = null;
    bossSpawnTimer = 0;
}
