// ========== БОСС: LIGHT RUNNER (КВОРА) ==========

let boss = null;
const BOSS_MAX_HEALTH = 5;
const BOSS_SIZE = 3;

function spawnBoss() {
    if (boss && boss.alive) return;
    if (typeof players === 'undefined' || !players[0].alive) return;
    
    const player = players[0];
    let x, y;
    let dirX = 0, dirY = 0;
    
    const side = Math.floor(Math.random() * 4);
    
    switch(side) {
        case 0:
            x = 2 + Math.floor(Math.random() * (WIDTH - 4));
            y = 1;
            dirX = 0;
            dirY = 1;
            break;
        case 1:
            x = 2 + Math.floor(Math.random() * (WIDTH - 4));
            y = HEIGHT - 2;
            dirX = 0;
            dirY = -1;
            break;
        case 2:
            x = 1;
            y = 2 + Math.floor(Math.random() * (HEIGHT - 4));
            dirX = 1;
            dirY = 0;
            break;
        case 3:
            x = WIDTH - 2;
            y = 2 + Math.floor(Math.random() * (HEIGHT - 4));
            dirX = -1;
            dirY = 0;
            break;
    }
    
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
        spawnProtection: 10,
        lastDirChange: 0,
        size: BOSS_SIZE,
        trailOffsetX: Math.floor(BOSS_SIZE / 2),
        trailOffsetY: Math.floor(BOSS_SIZE / 2),
        lastDirection: { dx: dirX, dy: dirY },
        stuckCounter: 0
    };
    
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
    
    // ============================================================
    // ===== СТОЛКНОВЕНИЕ БОССА С ИГРОКОМ (ОТТАЛКИВАНИЕ) =====
    // ============================================================
    let hitPlayer = false;
    for (let dx = 0; dx < boss.size; dx++) {
        for (let dy = 0; dy < boss.size; dy++) {
            const bx = boss.x + dx;
            const by = boss.y + dy;
            if (player.alive && bx === player.x && by === player.y) {
                hitPlayer = true;
                break;
            }
        }
        if (hitPlayer) break;
    }
    
    if (hitPlayer) {
        // Игрок умирает
        player.alive = false;
        if (typeof explode === 'function') explode(player.x, player.y, player.color);
        gameActive = false;
        showMessage('💀 ВАС СБИЛ LIGHT RUNNER!');
        if (typeof stopBgMusic === 'function') stopBgMusic();
        return;
    }
    
    // ============================================================
    // ===== УРОН БОССУ ОТ ЛИНИЙ ИГРОКА =====
    // ============================================================
    const playerTrail = player.trail || [];
    for (let t = 0; t < playerTrail.length - 1; t++) {
        const seg = playerTrail[t];
        for (let dx = 0; dx < boss.size; dx++) {
            for (let dy = 0; dy < boss.size; dy++) {
                const bx = boss.x + dx;
                const by = boss.y + dy;
                if (bx === seg.x && by === seg.y) {
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
                        boss = null;
                        return;
                    } else {
                        showMessage(`💥 LIGHT RUNNER РАНЕН! ❤️ ${boss.health}/${boss.maxHealth}`);
                        // Отталкиваем босса от следа
                        boss.dirX = -boss.dirX || 1;
                        boss.dirY = -boss.dirY || 1;
                        boss.lastDirection = { dx: boss.dirX, dy: boss.dirY };
                    }
                    return;
                }
            }
        }
    }
    
    // ============================================================
    // ===== ПРОВЕРКА СТОЛКНОВЕНИЯ БОССА СО СВОИМ СЛЕДОМ =====
    // ============================================================
    for (let i = 0; i < boss.trail.length - 2; i++) {
        const seg = boss.trail[i];
        for (let dx = 0; dx < boss.size; dx++) {
            for (let dy = 0; dy < boss.size; dy++) {
                const bx = boss.x + dx;
                const by = boss.y + dy;
                if (bx === seg.x && by === seg.y) {
                    // Босс наехал на свой след — разворачиваемся
                    boss.dirX = -boss.dirX || 1;
                    boss.dirY = -boss.dirY || 1;
                    boss.lastDirection = { dx: boss.dirX, dy: boss.dirY };
                    boss.stuckCounter++;
                    if (boss.stuckCounter > 3) {
                        boss.dirX = 0;
                        boss.dirY = (Math.random() < 0.5) ? 1 : -1;
                        boss.stuckCounter = 0;
                    }
                    return;
                }
            }
        }
    }
    boss.stuckCounter = 0;
    
    // ============================================================
    // ===== ОСНОВНАЯ ЛОГИКА ДВИЖЕНИЯ =====
    // ============================================================
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
        
        // ===== ЗАПРЕТ РАЗВОРОТА НАЗАД =====
        if (boss.lastDirection) {
            const isReverseX = newDirX === -boss.lastDirection.dx && newDirY === 0;
            const isReverseY = newDirY === -boss.lastDirection.dy && newDirX === 0;
            const isFullReverse = newDirX === -boss.lastDirection.dx && newDirY === -boss.lastDirection.dy;
            
            if (isReverseX || isReverseY || isFullReverse) {
                if (newDirX !== 0) {
                    newDirX = 0;
                    newDirY = (Math.random() < 0.5) ? 1 : -1;
                } else if (newDirY !== 0) {
                    newDirY = 0;
                    newDirX = (Math.random() < 0.5) ? 1 : -1;
                } else {
                    newDirX = boss.lastDirection.dx;
                    newDirY = boss.lastDirection.dy;
                }
            }
        }
        
        boss.dirX = newDirX;
        boss.dirY = newDirY;
        boss.lastDirection = { dx: newDirX, dy: newDirY };
    }
    
    // Движение
    for (let step = 0; step < boss.speed; step++) {
        const newX = boss.x + boss.dirX;
        const newY = boss.y + boss.dirY;
        
        if (newX < 0 || newX >= WIDTH || newY < 0 || newY >= HEIGHT) {
            boss.dirX = -boss.dirX || 1;
            boss.dirY = -boss.dirY || 1;
            boss.lastDirection = { dx: boss.dirX, dy: boss.dirY };
            continue;
        }
        
        boss.x = newX;
        boss.y = newY;
        
        const trailX = boss.x + boss.trailOffsetX;
        const trailY = boss.y + boss.trailOffsetY;
        boss.trail.push({ x: trailX, y: trailY });
        if (boss.trail.length > 100) boss.trail.shift();
    }
}

function hitBoss() {
    if (!boss || !boss.alive) return;
    if (boss.spawnProtection > 0) return;
    
    const player = players[0];
    if (!player || !player.alive) return;
    
    let hit = false;
    for (let dx = 0; dx < boss.size; dx++) {
        for (let dy = 0; dy < boss.size; dy++) {
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
        boss = null;
    } else {
        showMessage(`💥 LIGHT RUNNER РАНЕН! ❤️ ${boss.health}/${boss.maxHealth}`);
    }
}

function resetBoss() {
    boss = null;
}
