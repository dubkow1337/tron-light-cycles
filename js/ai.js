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
        if (!isSafe(newX, newY, p.trail, enemy.trail)) {
            moveScores.push({ dir: dir, score: -999 });
            continue;
        }
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
                if (isSafe(nextX, nextY, simTrail, enemy.trail)) {
                    simX = nextX; simY = nextY;
                    simDirX = move.dx; simDirY = move.dy;
                    simTrail.push({ x: simX, y: simY });
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
    p.dirX = bestDir.dx;
    p.dirY = bestDir.dy;
    
    // Движение (оригинальная скорость)
    p.x += p.dirX;
    p.y += p.dirY;
    
    // След
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 15) p.trail.shift();
}
