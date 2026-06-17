// ========== БОСС: LIGHT RUNNER (КВОРА) ==========

let boss = null;
let bossSpawnTimer = 0;
const BOSS_SPAWN_INTERVAL = 30000;
const BOSS_MAX_HEALTH = 5;
const BOSS_SIZE = 3;

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
    if (dirX === 0 && dirY === 0) dirX = 1;
    
    boss = {
        x: x, y: y,
        dirX: dirX,
        dirY: dirY,
        trail: [],
        alive: true,
        color: '#ff3300',
        trailColor: '#ff2200',
        health: BOSS_MAX_HEALTH,
        maxHealth: BOSS_MAX_HEALTH,
        speed: 0.8,
        spawnProtection: 60,
        lastDirChange: 0,
        size: BOSS_SIZE,
        trailOffsetX: 0,
        trailOffsetY: 0
    };
    
    // Вычисляем смещение для центральной линии (центр 3x3 = смещение +1)
    boss.trailOffsetX = Math.floor(BOSS_SIZE / 2);
    boss.trailOffsetY = Math.floor(BOSS_SIZE / 2);
    
    // Начальная точка следа (центр босса)
    const startX = boss.x + boss.trailOffsetX;
    const startY = boss.y + boss.trailOffsetY;
    boss.trail.push({ x: startX, y: startY });
    
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
    
    // ===== ИИ БОССА =====
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const distToPlayer = Math.hypot(dx, dy);
    
    boss.lastDirChange++;
    if (boss.lastDirChange > 4 + Math.floor(Math.random() * 4)) {
        boss.lastDirChange = 0;
        
        const futureX = player.x + player.dirX * 5;
        const futureY = player.y + player.dirY * 5;
        
        let newDirX = 0, newDirY = 0;
        if (distToPlayer < 6) {
            const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 1.2 : -1.2);
            newDirX = Math.round(Math.cos(angle));
            newDirY = Math.round(Math.sin(angle));
        } else {
            const angle = Math.atan2(futureY - boss.y, futureX - boss.x);
            const offset = (Math.random() - 0.5) * 0.8;
            newDirX = Math.round(Math.cos(angle + offset));
            newDirY = Math.round(Math.sin(angle + offset));
        }
        
        if (newDirX !== 0 && newDirY !== 0) {
            if (Math.abs(newDirX) > Math.abs(newDirY)) {
                newDirY = 0;
            } else {
                newDirX = 0;
            }
        }
        
        if (newDirX === 0 && newDirY === 0) {
            newDirX = 1;
        }
        
        boss.dirX = newDirX;
        boss.dirY = newDirY;
    }
    
    // Движение
    for (let step = 0; step < boss.speed; step++) {
        const newX = boss.x + boss.dirX;
        const newY = boss.y + boss.dirY;
        
        if (newX < 1 || newX >= WIDTH - BOSS_SIZE || newY < 1 || newY >= HEIGHT - BOSS_SIZE) {
            boss.dirX = -boss.dirX || 1;
            boss.dirY = -boss.dirY || 1;
            continue;
        }
        
        boss.x = newX;
        boss.y = newY;
        
        // ===== ЦЕНТРАЛЬНАЯ ЛИНИЯ (СМЕЩЕНИЕ В ЦЕНТР 3x3) =====
        const trailX = boss.x + boss.trailOffsetX;
        const trailY = boss.y + boss.trailOffsetY;
        boss.trail.push({ x: trailX, y: trailY });
        if (boss.trail.length > 100) boss.trail.shift();
        
        // ===== ПРОВЕРКА СТОЛКНОВЕНИЯ СО СЛЕДАМИ ИГРОКА =====
        let hitPlayerTrail = false;
        const playerTrail = player.trail || [];
        
        for (let dx = 0; dx < BOSS_SIZE; dx++) {
            for (let dy = 0; dy < BOSS_SIZE; dy++) {
                const bx = boss.x + dx;
                const by = boss.y + dy;
                
                for (let t = 0; t < playerTrail.length - 1; t++) {
                    if (playerTrail[t].x === bx && playerTrail[t].y === by) {
                        hitPlayerTrail = true;
                        break;
                    }
                }
                if (hitPlayerTrail) break;
            }
            if (hitPlayerTrail) break;
        }
        
        if (hitPlayerTrail) {
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
                return;
            } else {
                showMessage(`💥 LIGHT RUNNER ВРЕЗАЛСЯ В СЛЕД! ❤️ ${boss.health}/${boss.maxHealth}`);
                boss.dirX = -boss.dirX || 1;
                boss.dirY = -boss.dirY || 1;
                continue;
            }
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
}

function hitBoss() {
    if (!boss || !boss.alive) return;
    
    const player = players[0];
    if (!player || !player.alive) return;
    
    let hit = false;
    for (let dx = 0; dx < BOSS_SIZE; dx++) {
        for (let dy = 0; dy < BOSS_SIZE; dy++) {
            const bx = boss.x + dx;
            const by = boss.y + dy;
            if (player.x === bx && player.y === by) {
                hit = true;
                break;
            }
        }
        if (hit) break;
    }
    
    if (!hit) return;
    
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
