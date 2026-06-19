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
            x = Math.floor(Math.random() * WIDTH);
            y = -BOSS_SIZE - 2;
            dirX = (Math.random() > 0.5) ? 1 : -1;
            dirY = 1;
            break;
        case 1:
            x = Math.floor(Math.random() * WIDTH);
            y = HEIGHT + 2;
            dirX = (Math.random() > 0.5) ? 1 : -1;
            dirY = -1;
            break;
        case 2:
            x = -BOSS_SIZE - 2;
            y = Math.floor(Math.random() * HEIGHT);
            dirX = 1;
            dirY = (Math.random() > 0.5) ? 1 : -1;
            break;
        case 3:
            x = WIDTH + 2;
            y = Math.floor(Math.random() * HEIGHT);
            dirX = -1;
            dirY = (Math.random() > 0.5) ? 1 : -1;
            break;
    }
    
    if (dirX !== 0 && dirY !== 0) {
        if (Math.abs(dirX) > Math.abs(dirY)) {
            dirY = 0;
        } else {
            dirX = 0;
        }
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
        spawnProtection: 30,
        lastDirChange: 0,
        size: BOSS_SIZE,
        trailOffsetX: Math.floor(BOSS_SIZE / 2),
        trailOffsetY: Math.floor(BOSS_SIZE / 2),
        entering: true,
        side: side,
        lastDirection: { dx: dirX, dy: dirY } // ← запоминаем направление
    };
    
    const startX = boss.x + boss.trailOffsetX;
    const startY = boss.y + boss.trailOffsetY;
    boss.trail.push({ x: startX, y: startY });
    
    showMessage(`⚠️ LIGHT RUNNER ПРИБЫВАЕТ! (❤️ ${BOSS_MAX_HEALTH})`);
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
    }
    
    // ===== ВЪЕЗД =====
    if (boss.entering) {
        boss.x += boss.dirX * boss.speed;
        boss.y += boss.dirY * boss.speed;
        
        const trailX = boss.x + boss.trailOffsetX;
        const trailY = boss.y + boss.trailOffsetY;
        boss.trail.push({ x: trailX, y: trailY });
        if (boss.trail.length > 100) boss.trail.shift();
        
        const onField = boss.x >= 0 && boss.x < WIDTH && boss.y >= 0 && boss.y < HEIGHT;
        if (onField) {
            boss.entering = false;
            showMessage(`🔥 LIGHT RUNNER В ПОЛЕ! ❤️ ${boss.health}/${boss.maxHealth}`);
        }
        return;
    }
    
    // ===== ОСНОВНАЯ ЛОГИКА =====
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
        
        // ===== ЗАПРЕТ НА РАЗВОРОТ НАЗАД (нельзя поехать обратно) =====
        // Если новое направление противоположно последнему — запрещаем
        if (boss.lastDirection) {
            const isReverseX = newDirX === -boss.lastDirection.dx && newDirY === 0;
            const isReverseY = newDirY === -boss.lastDirection.dy && newDirX === 0;
            const isFullReverse = newDirX === -boss.lastDirection.dx && newDirY === -boss.lastDirection.dy;
            
            if (isReverseX || isReverseY || isFullReverse) {
                // Пытаемся выбрать другое направление (не разворот)
                const alternatives = [];
                if (newDirX !== 0) {
                    // Если пытались развернуться по X, пробуем вверх/вниз
                    alternatives.push({ dx: 0, dy: -1 });
                    alternatives.push({ dx: 0, dy: 1 });
                } else if (newDirY !== 0) {
                    alternatives.push({ dx: -1, dy: 0 });
                    alternatives.push({ dx: 1, dy: 0 });
                }
                // Добавляем текущее направление как запасное
                alternatives.push({ dx: boss.lastDirection.dx, dy: boss.lastDirection.dy });
                
                // Выбираем первое безопасное
                for (let alt of alternatives) {
                    const testX = boss.x + alt.dx;
                    const testY = boss.y + alt.dy;
                    if (testX >= 1 && testX < WIDTH - BOSS_SIZE && testY >= 1 && testY < HEIGHT - BOSS_SIZE) {
                        newDirX = alt.dx;
                        newDirY = alt.dy;
                        break;
                    }
                }
            }
        }
        
        boss.dirX = newDirX;
        boss.dirY = newDirY;
        boss.lastDirection = { dx: newDirX, dy: newDirY }; // ← обновляем последнее направление
    }
    
    // Движение
    for (let step = 0; step < boss.speed; step++) {
        const newX = boss.x + boss.dirX;
        const newY = boss.y + boss.dirY;
        
        if (newX < 1 || newX >= WIDTH - BOSS_SIZE || newY < 1 || newY >= HEIGHT - BOSS_SIZE) {
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
        
        // ===== ПРОВЕРКА СТОЛКНОВЕНИЯ СО СЛЕДАМИ ИГРОКА (без изменений) =====
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
                boss.lastDirection = { dx: boss.dirX, dy: boss.dirY };
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
    if (boss.entering) return;
    
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
