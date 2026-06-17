// ===== БОСС (LIGHT RUNNER) =====
if (typeof boss !== 'undefined' && boss && boss.alive && boss.trail && boss.trail.length >= 2) {
    const trail = boss.trail;
    
    // Левая линия (смещение влево от направления движения)
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = boss.trailColor || '#ff2200';
    ctx.strokeStyle = boss.trailColor || '#ff2200';
    
    for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        // Смещение влево (перпендикулярно направлению)
        let offsetX = 0, offsetY = 0;
        if (i > 0 && i < trail.length - 1) {
            const dx = trail[i+1].x - trail[i-1].x;
            const dy = trail[i+1].y - trail[i-1].y;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                offsetX = -dy / len;
                offsetY = dx / len;
            }
        } else if (i === 0 && trail.length > 1) {
            const dx = trail[1].x - trail[0].x;
            const dy = trail[1].y - trail[0].y;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                offsetX = -dy / len;
                offsetY = dx / len;
            }
        } else if (i === trail.length - 1 && trail.length > 1) {
            const dx = trail[i].x - trail[i-1].x;
            const dy = trail[i].y - trail[i-1].y;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                offsetX = -dy / len;
                offsetY = dx / len;
            }
        }
        
        // Увеличиваем смещение для двойного следа
        const offsetScale = 1.5;
        const x = (p.x + offsetX * offsetScale) * CELL_SIZE + CELL_SIZE/2;
        const y = (p.y + offsetY * offsetScale) * CELL_SIZE + CELL_SIZE/2;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Правая линия (смещение вправо от направления движения)
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = boss.trailColor || '#ff2200';
    ctx.strokeStyle = boss.trailColor || '#ff2200';
    
    for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        let offsetX = 0, offsetY = 0;
        if (i > 0 && i < trail.length - 1) {
            const dx = trail[i+1].x - trail[i-1].x;
            const dy = trail[i+1].y - trail[i-1].y;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                offsetX = -dy / len;
                offsetY = dx / len;
            }
        } else if (i === 0 && trail.length > 1) {
            const dx = trail[1].x - trail[0].x;
            const dy = trail[1].y - trail[0].y;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                offsetX = -dy / len;
                offsetY = dx / len;
            }
        } else if (i === trail.length - 1 && trail.length > 1) {
            const dx = trail[i].x - trail[i-1].x;
            const dy = trail[i].y - trail[i-1].y;
            const len = Math.hypot(dx, dy);
            if (len > 0) {
                offsetX = -dy / len;
                offsetY = dx / len;
            }
        }
        
        const offsetScale = 1.5;
        const x = (p.x - offsetX * offsetScale) * CELL_SIZE + CELL_SIZE/2;
        const y = (p.y - offsetY * offsetScale) * CELL_SIZE + CELL_SIZE/2;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Корпус босса
    const size = boss.size || 2;
    const cx = boss.x * CELL_SIZE + (size * CELL_SIZE) / 2;
    const cy = boss.y * CELL_SIZE + (size * CELL_SIZE) / 2;
    
    ctx.save();
    ctx.translate(cx, cy);
    
    if (boss.dirX === 1) ctx.rotate(0);
    else if (boss.dirX === -1) ctx.rotate(Math.PI);
    else if (boss.dirY === -1) ctx.rotate(-Math.PI / 2);
    else if (boss.dirY === 1) ctx.rotate(Math.PI / 2);
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = boss.color || '#ff3300';
    
    ctx.fillStyle = boss.color || '#ff3300';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-6, -10);
    ctx.lineTo(-6, -3);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 3);
    ctx.lineTo(-6, 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // Индикатор здоровья
    if (boss.maxHealth) {
        const healthBarWidth = 50;
        const healthBarX = boss.x * CELL_SIZE - healthBarWidth/2 + (size * CELL_SIZE) / 2;
        const healthBarY = boss.y * CELL_SIZE - 14;
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, 4);
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * (boss.health / boss.maxHealth), 4);
    }
}
