// ========== ИИ ДЛЯ РЕЖИМА VS AI ==========

function aiMove() {
    // Отладочный лог — покажет, вызывается ли функция
    try { console.log('aiMove called. opponentType=', opponentType, 'player alive=', players[1] && players[1].alive); } catch(e) {}

    if (typeof opponentType === 'undefined' || opponentType !== 'ai') return;
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
        // Проверка границ (добавлен отступ в 1 клетку)
        if (x < 1 || x >= WIDTH - 1 || y < 1 || y >= HEIGHT - 1) {
            return false;
        }
        // Проверка своего следа (кроме последней точки)
        for (let i = 0; i < trail.length - 1; i++) {
            if (trail[i].x === Math.round(x) && trail[i].y === Math.round(y)) {
                return false;
            }
        }
        // Проверка следа противника
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
        
        // Проверка на выход за границы
        if (newX < 1 || newX >= WIDTH - 1 || newY < 1 || newY >= HEIGHT - 1) {
            moveScores.push({ dir: dir, score: -999 });
            continue;
        }
        
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
    const bestMove = moveScores[0]; // берём весь объект
    
    if (bestMove && bestMove.score > -999) {
        p.dirX = bestMove.dir.dx;
        p.dirY = bestMove.dir.dy;
    } else {
        // Запасной вариант — безопасное направление
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

    // Примечание: движение игрока выполняется в updateGame(), здесь только выбираем направление (dirX/dirY).
}
