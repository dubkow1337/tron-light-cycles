// ========== ИИ ДЛЯ РЕЖИМА VS AI ==========

function aiMove() {
    if (opponentType !== 'ai') return;
    if (!players[1].alive) return;
    
    const p = players[1];
    const enemy = players[0];
    const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ];
    let moveScores = [];
    
    for (const dir of dirs) {
        let newX = p.x + dir.dx;
        let newY = p.y + dir.dy;
        
        // Проверка границ
        if (newX < 0 || newX >= WIDTH || newY < 0 || newY >= HEIGHT) {
            moveScores.push({ dir: dir, score: -999 });
            continue;
        }
        
        // Проверка своего следа
        let hitSelf = false;
        for (let i = 0; i < p.trail.length - 1; i++) {
            if (p.trail[i].x === newX && p.trail[i].y === newY) {
                hitSelf = true;
                break;
            }
        }
        if (hitSelf) {
            moveScores.push({ dir: dir, score: -999 });
            continue;
        }
        
        // Проверка следа противника
        let hitEnemy = false;
        for (let i = 0; i < enemy.trail.length - 1; i++) {
            if (enemy.trail[i].x === newX && enemy.trail[i].y === newY) {
                hitEnemy = true;
                break;
            }
        }
        if (hitEnemy) {
            moveScores.push({ dir: dir, score: -999 });
            continue;
        }
        
        // Симуляция на 30 шагов вперёд
        let simX = newX, simY = newY;
        let simTrail = [...p.trail, { x: simX, y: simY }];
        let simDirX = dir.dx, simDirY = dir.dy;
        let steps = 0;
        
        for (let step = 0; step < 30; step++) {
            const possibleMoves = [
                { dx: simDirX, dy: simDirY },
                { dx: -simDirY, dy: simDirX },
                { dx: simDirY, dy: -simDirX },
                { dx: -simDirX, dy: -simDirY }
            ];
            let moved = false;
            for (const move of possibleMoves) {
                const nextX = simX + move.dx;
                const nextY = simY + move.dy;
                
                // Проверка границ
                if (nextX < 0 || nextX >= WIDTH || nextY < 0 || nextY >= HEIGHT) continue;
                
                // Проверка своего следа
                let hitSelfSim = false;
                for (let i = 0; i < simTrail.length - 1; i++) {
                    if (simTrail[i].x === nextX && simTrail[i].y === nextY) {
                        hitSelfSim = true;
                        break;
                    }
                }
                if (hitSelfSim) continue;
                
                // Проверка следа противника
                let hitEnemySim = false;
                for (let i = 0; i < enemy.trail.length - 1; i++) {
                    if (enemy.trail[i].x === nextX && enemy.trail[i].y === nextY) {
                        hitEnemySim = true;
                        break;
                    }
                }
                if (hitEnemySim) continue;
                
                simX = nextX; simY = nextY;
                simDirX = move.dx; simDirY = move.dy;
                simTrail.push({ x: simX, y: simY });
                steps++;
                moved = true;
                break;
            }
            if (!moved) break;
        }
        
        const distToEnemy = Math.abs(simX - enemy.x) + Math.abs(simY - enemy.y);
        const aggressionBonus = (30 - distToEnemy) * 2;
        const randomBonus = Math.floor(Math.random() * 7) - 3;
        moveScores.push({ dir: dir, score: steps * 10 + aggressionBonus + randomBonus });
    }
    
    moveScores.sort((a, b) => b.score - a.score);
    const bestDir = moveScores[0].dir;
    
    // Проверяем, что направление безопасно (чтобы бот не застревал)
    if (bestDir && bestDir.score > -999) {
        p.dirX = bestDir.dx;
        p.dirY = bestDir.dy;
    } else {
        // Если все направления опасны — пытаемся двигаться вперёд или разворачиваемся
        const dirs2 = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        for (let d of dirs2) {
            const newX = p.x + d.dx;
            const newY = p.y + d.dy;
            if (newX >= 0 && newX < WIDTH && newY >= 0 && newY < HEIGHT) {
                // Проверяем, не врежется ли в свой след
                let hitSelf = false;
                for (let i = 0; i < p.trail.length - 1; i++) {
                    if (p.trail[i].x === newX && p.trail[i].y === newY) {
                        hitSelf = true;
                        break;
                    }
                }
                if (!hitSelf) {
                    p.dirX = d.dx;
                    p.dirY = d.dy;
                    break;
                }
            }
        }
    }
    
    // ===== ДВИЖЕНИЕ (НОРМАЛЬНАЯ СКОРОСТЬ) =====
    const BOT_SPEED = 0.7;
    p.x += p.dirX * BOT_SPEED;
    p.y += p.dirY * BOT_SPEED;
    
    // ===== СЛЕД (НОРМАЛЬНАЯ ДЛИНА) =====
    p.trail.push({ x: Math.round(p.x), y: Math.round(p.y) });
    if (p.trail.length > 20) p.trail.shift();
}
