// ========== БОСС: LIGHT RUNNER (КВОРА) ==========

let boss = null;
let bossSpawnTimer = 0;
const BOSS_SPAWN_INTERVAL = 30000;
const BOSS_MAX_HEALTH = 5;
const BOSS_SIZE = 2;

function spawnBoss() {
    if (boss && boss.alive) return;
    if (typeof players === 'undefined' || !players[0].alive) return;
    
    const player = players[0];
    let x, y;
    let attempts = 0;
    let found = false;
    
    while (!found && attempts < 50) {
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0:
                x = 4 + Math.floor(Math.random() * (WIDTH - 8));
                y = 3;
                break;
            case 1:
                x = 4 + Math.floor(Math.random() * (WIDTH - 8));
                y = HEIGHT - 4;
                break;
            case 2:
                x = 3;
                y = 4 + Math.floor(Math.random() * (HEIGHT - 8));
                break;
            case 3:
                x = WIDTH - 4;
                y = 4 + Math.floor(Math.random() * (HEIGHT - 8));
                break;
        }
        
        if (player) {
            const dx = Math.abs(x - player.x);
            const dy = Math.abs(y - player.y);
            if (dx < 4 && dy < 4) {
                attempts++;
                continue;
            }
        }
        
        if (x < 1 || x >= WIDTH - 2 || y < 1 || y >= HEIGHT - 2) {
            attempts++;
            continue;
        }
        
        found = true;
        break;
    }
    
    if (!found) {
        x = Math.floor(WIDTH / 2);
        y = Math.floor(HEIGHT / 2);
    }
    
    boss = {
        x: x, y: y,
        dirX: 1,
        dirY: 0,
        trail: [],
        alive: true,
        color: '#ff3300',
        trailColor: '#ff2200',
        health: BOSS_MAX_HEALTH,
        maxHealth: BOSS_MAX_HEALTH,
        speed: 1.0,
        doubleTrail: true,
        spawnProtection: 60,
        lastDirChange: 0,
        size: BOSS_SIZE,
        moveCounter: 0 // ← счётчик для плавности
    };
    
    for (let dx = 0; dx < BOSS_SIZE; dx++) {
        for (let dy = 0; dy < BOSS_SIZE; dy++) {
            boss.trail.push({ x: x + dx, y: y + dy });
        }
    }
    
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
    
    if (boss.spawnProtection > 0) {
        boss.spawnProtection--;
        return;
    }
    
    // ===== ПЛАВНОЕ ДВИЖЕНИЕ =====
    boss.moveCounter++;
    
    // Меняем направление реже (каждые 10-15 шагов)
    if (boss.moveCounter % 10 === 0) {
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const distToPlayer = Math.hypot(dx, dy);
        
        // Если далеко — идём к игроку
        if (distToPlayer > 5) {
            if (Math.abs(dx) > Math.abs(dy)) {
                boss.dirX = dx > 0 ? 1 : -1;
                boss.dirY = 0;
            } else {
                boss.dirX = 0;
                boss.dirY = dy > 0 ? 1 : -1;
            }
        } else {
            // Если близко — уходим в сторону (фланговый манёвр)
            const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1.2 : -1.2);
            boss.dirX = Math.round(Math.cos(angle));
            boss.dirY = Math.round(Math.sin(angle));
            if (boss.dirX === 0 && boss.dirY === 0) {
                boss.dirX = 1;
            }
        }
    }
    
    // Движение (каждый шаг)
    const newX = boss.x + boss.dirX;
    const newY = boss.y + boss.dirY;
    
    // Проверка границ
    if (newX < 1 || newX >= WIDTH - BOSS_SIZE || newY < 1 || newY >= HEIGHT - BOSS_SIZE) {
        boss.dirX = -boss.dirX || 1;
        boss.dirY = -boss.dirY || 1;
        return;
    }
    
    boss.x = newX;
    boss.y = newY;
    
    // След
    if (boss.doubleTrail) {
        for (let dx = 0; dx < BOSS_SIZE; dx++) {
            for (let dy = 0; dy < BOSS_SIZE; dy++) {
                boss.trail.push({ x: boss.x + dx, y: boss.y + dy });
            }
        }
    } else {
        boss.trail.push({ x: boss.x, y: boss.y });
    }
    
    if (boss.trail.length > 60) {
        boss.trail.splice(0, 20);
    }
    
    // ===== ПРОВЕРКА СТОЛКНОВЕНИЯ С ИГРОКОМ =====
    for (let dx = 0; dx < BOSS_SIZE; dx++) {
        for (let dy = 0; dy < BOSS_SIZE; dy++) {
            const bx = boss.x + dx;
            const by = boss.y + dy;
            
            if (bx === player.x && by === player.y) {
                player.alive = false;
                if (typeof explode === 'function') explode(player.x, player.y, player.color);
                gameActive = false;
                showMessage('💀 ВАС СБИЛ LIGHT RUNNER!');
                if (typeof stopBgMusic === 'function') stopBgMusic();
                return;
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
