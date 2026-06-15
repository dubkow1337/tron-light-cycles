// ========== РЕЖИМ ВЫЖИВАНИЯ ==========

let survivalEnemies = [];

function spawnSurvivalEnemies() {
    survivalEnemies = [];
    const spawnPoints = [
        { x: WIDTH - 4, y: 5, dirX: -1, dirY: 0, color: '#ff3366', trailColor: '#882222' },
        { x: WIDTH - 4, y: Math.floor(HEIGHT / 2), dirX: -1, dirY: 0, color: '#ff6633', trailColor: '#882222' },
        { x: WIDTH - 4, y: HEIGHT - 6, dirX: -1, dirY: 0, color: '#ff9933', trailColor: '#882222' }
    ];
    
    for (let i = 0; i < 3; i++) {
        let sp = spawnPoints[i];
        survivalEnemies.push({
            x: sp.x, y: sp.y, dirX: sp.dirX, dirY: sp.dirY,
            trail: [{ x: sp.x, y: sp.y }], alive: true,
            color: sp.color, trailColor: sp.trailColor
        });
    }
}

function updateSurvival() {
    if (typeof opponentType === 'undefined' || opponentType !== 'survival') return;
    
    const player = players[0];
    if (!player.alive) return;
    
    for (let i = 0; i < survivalEnemies.length; i++) {
        let e = survivalEnemies[i];
        if (!e.alive) continue;
        
        let bestDir = null;
        let bestScore = -Infinity;
        const dirs = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        
        for (let dir of dirs) {
            let nx = e.x + dir.dx;
            let ny = e.y + dir.dy;
            if (nx < 1 || nx >= WIDTH-1 || ny < 1 || ny >= HEIGHT-1) continue;
            
            let hitSelf = false;
            for (let seg of e.trail) {
                if (seg.x === nx && seg.y === ny) { hitSelf = true; break; }
            }
            if (hitSelf) continue;
            
            let hitEnemyTrail = false;
            for (let other of survivalEnemies) {
                if (other === e || !other.alive) continue;
                for (let seg of other.trail) {
                    if (seg.x === nx && seg.y === ny) { hitEnemyTrail = true; break; }
                }
                if (hitEnemyTrail) break;
            }
            if (hitEnemyTrail) continue;
            
            let hitPlayerTrail = false;
            for (let seg of player.trail) {
                if (seg.x === nx && seg.y === ny) { hitPlayerTrail = true; break; }
            }
            if (hitPlayerTrail) continue;
            
            let score = 0;
            const distToPlayer = Math.abs(nx - player.x) + Math.abs(ny - player.y);
            score += (WIDTH + HEIGHT - distToPlayer) * 3;
            
            const enemyIndex = survivalEnemies.indexOf(e);
            const angleToPlayer = Math.atan2(ny - player.y, nx - player.x);
            const targetAngle = (enemyIndex * Math.PI * 2 / Math.max(1, survivalEnemies.length));
            score -= Math.abs(angleToPlayer - targetAngle) * 2;
            
            if (score > bestScore) {
                bestScore = score;
                bestDir = dir;
            }
        }
        
        if (bestDir) {
            e.dirX = bestDir.dx;
            e.dirY = bestDir.dy;
        }
        
        e.x += e.dirX;
        e.y += e.dirY;
        e.trail.push({ x: e.x, y: e.y });
        
        if (e.trail.length > 15) {
            e.trail.shift();
        }
        
        let enemyDied = false;
        if (e.x < 0 || e.x >= WIDTH || e.y < 0 || e.y >= HEIGHT) enemyDied = true;
        
        if (!enemyDied) {
            for (let i = 0; i < e.trail.length - 1; i++) {
                if (e.trail[i].x === e.x && e.trail[i].y === e.y) { enemyDied = true; break; }
            }
        }
        if (!enemyDied) {
            for (let seg of player.trail) {
                if (seg.x === e.x && seg.y === e.y) { enemyDied = true; break; }
            }
        }
        if (!enemyDied) {
            for (let other of survivalEnemies) {
                if (other === e || !other.alive) continue;
                for (let seg of other.trail) {
                    if (seg.x === e.x && seg.y === e.y) { enemyDied = true; break; }
                }
                if (enemyDied) break;
            }
        }
        
        if (!enemyDied && e.x === player.x && e.y === player.y) {
            player.alive = false;
            enemyDied = true;
            if (typeof explode === 'function') explode(player.x, player.y, player.color);
            return;
        }
        
        if (enemyDied) {
            e.alive = false;
            if (typeof explode === 'function') explode(e.x, e.y, e.color);
        }
    }
    
    survivalEnemies = survivalEnemies.filter(e => e.alive);
}
