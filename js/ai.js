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
    
    // Функция проверки безопасности клетки
    function isSafeCell(x, y, trail, enemyTrail) {
        // Границы
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return false;
        // Свой след (кроме последней точки)
        for (let i = 0; i < trail.length - 1; i++) {
            if (trail[i].x === Math.round(x) && trail[i].y === Math.round(y)) {
                return false;
            }
        }
        // След противника
        for (let i = 0; i < enemyTrail.length - 1; i++) {
            if (enemyTrail[i].x === Math.round(x) && enemyTrail[i].y === Math.round(y)) {
                return false;
            }
        }
        return true;
    }
    
    for (const dir of dirs) {
        let newX = p.x + dir.dx;
        let newY = p.y + dir.dy;
        
        if (!isSafeCell(newX, newY, p.trail, enemy.trail)) {
            moveScores.push({ dir: dir, score: -999 });
            continue;
        }
        
        // Симуляция на 30 шагов вперёд
        let simX = newX, simY = newY;
        let simTrail = [...p.trail, { x: Math.round(simX), y: Math.round(simY) }];
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
                if (isSafeCell(nextX, nextY, simTrail, enemy.trail)) {
                    simX = nextX; simY = nextY;
                    simDirX = move.dx; simDirY = move.dy;
                    simTrail.push({ x: Math.round(simX), y: Math.round(simY) });
                    steps++;
                    moved = true;
                    break;
                }
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
    
    // Проверяем, что направление безопасно
    if (bestDir && bestDir.score > -999) {
        p.dirX = bestDir.dx;
        p.dirY = bestDir.dy;
    } else {
        // Если все направления опасны — пытаемся двигаться в безопасное
        const fallbackDirs = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        for (let d of fallbackDirs) {
            const newX = p.x + d.dx;
            const newY = p.y + d.dy;
            if (isSafeCell(newX, newY, p.trail, enemy.trail)) {
                p.dirX = d.dx;
                p.dirY = d.dy;
                break;
            }
        }
    }
    
    // ===== ДВИЖЕНИЕ =====
    const BOT_SPEED = 0.7;
    const newX = p.x + p.dirX * BOT_SPEED;
    const newY = p.y + p.dirY * BOT_SPEED;
    
    // Проверяем, что новое положение безопасно
    if (isSafeCell(newX, newY, p.trail, enemy.trail)) {
        p.x = newX;
        p.y = newY;
    } else {
        // Если небезопасно — стоим на месте (или пробуем другое направление)
        // Находим безопасное направление
        const dirs2 = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        for (let d of dirs2) {
            const testX = p.x + d.dx * BOT_SPEED;
            const testY = p.y + d.dy * BOT_SPEED;
            if (isSafeCell(testX, testY, p.trail, enemy.trail)) {
                p.x = testX;
                p.y = testY;
                p.dirX = d.dx;
                p.dirY = d.dy;
                break;
            }
        }
    }
    
    // ===== СЛЕД =====
    const trailX = Math.round(p.x);
    const trailY = Math.round(p.y);
    // Добавляем след только если он изменился
    if (p.trail.length === 0 || 
        p.trail[p.trail.length-1].x !== trailX || 
        p.trail[p.trail.length-1].y !== trailY) {
        p.trail.push({ x: trailX, y: trailY });
        if (p.trail.length > 20) p.trail.shift();
    }
}
