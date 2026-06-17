// ========== ОТРИСОВКА ==========

let particles = [];
let crashEffect = { active: false, x: 0, y: 0, color: '#ffffff', timer: 0 };

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// КОНСТАНТЫ БЕРУТСЯ ИЗ player.js

function explode(x, y, color) {
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push({
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2,
            vx: vx, vy: vy,
            life: 0.8,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

function addParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 0.5,
            color: color,
            size: Math.random() * 3 + 1
        });
    }
}

function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life -= 0.02;
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

function drawParticles() {
    for (let p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

function draw() {
    if (!ctx) return;
    
    // ===== ФОН =====
    ctx.fillStyle = '#03050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowBlur = 0;
    
    // ===== СЕТКА =====
    ctx.strokeStyle = '#0f3f3a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= WIDTH; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
    
    // ===== СЛЕДЫ ИГРОКОВ =====
    if (typeof players !== 'undefined') {
        for (let p of players) {
            if (p.trail && p.trail.length >= 2) {
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowBlur = 6;
                ctx.shadowColor = p.trailColor;
                ctx.strokeStyle = p.trailColor;
                ctx.moveTo(p.trail[0].x * CELL_SIZE + CELL_SIZE/2, p.trail[0].y * CELL_SIZE + CELL_SIZE/2);
                for (let i = 1; i < p.trail.length; i++) {
                    ctx.lineTo(p.trail[i].x * CELL_SIZE + CELL_SIZE/2, p.trail[i].y * CELL_SIZE + CELL_SIZE/2);
                }
                ctx.stroke();
            }
        }
    }
    
    // ===== СЛЕДЫ ВРАГОВ (ВЫЖИВАНИЕ) =====
    if (typeof survivalEnemies !== 'undefined') {
        for (let e of survivalEnemies) {
            if (e.trail && e.trail.length >= 2) {
                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowBlur = 4;
                ctx.shadowColor = e.trailColor;
                ctx.strokeStyle = e.trailColor;
                ctx.moveTo(e.trail[0].x * CELL_SIZE + CELL_SIZE/2, e.trail[0].y * CELL_SIZE + CELL_SIZE/2);
                for (let i = 1; i < e.trail.length; i++) {
                    ctx.lineTo(e.trail[i].x * CELL_SIZE + CELL_SIZE/2, e.trail[i].y * CELL_SIZE + CELL_SIZE/2);
                }
                ctx.stroke();
            }
        }
        
        // Враги — ТРЕУГОЛЬНИКИ
        for (let e of survivalEnemies) {
            const cx = e.x * CELL_SIZE + CELL_SIZE / 2;
            const cy = e.y * CELL_SIZE + CELL_SIZE / 2;
            
            ctx.save();
            ctx.translate(cx, cy);
            
            // Поворот в сторону движения
            if (e.dirX === 1) ctx.rotate(0);
            else if (e.dirX === -1) ctx.rotate(Math.PI);
            else if (e.dirY === -1) ctx.rotate(-Math.PI / 2);
            else if (e.dirY === 1) ctx.rotate(Math.PI / 2);
            
            ctx.shadowBlur = 8;
            ctx.shadowColor = e.color;
            ctx.fillStyle = e.color;
            
            // Треугольник (острая стрелка)
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-4, -5);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }
    
// ===== БОСС (LIGHT RUNNER) =====
if (typeof boss !== 'undefined' && boss && boss.alive) {
    // Левая линия (пропускаем точки с break)
    if (boss.trailLeft && boss.trailLeft.length >= 2) {
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = boss.trailColor || '#ff2200';
        ctx.strokeStyle = boss.trailColor || '#ff2200';
        
        let started = false;
        for (let i = 0; i < boss.trailLeft.length; i++) {
            const p = boss.trailLeft[i];
            if (p.break) {
                started = false;
                continue;
            }
            if (!started) {
                ctx.moveTo(p.x * CELL_SIZE + CELL_SIZE/2, p.y * CELL_SIZE + CELL_SIZE/2);
                started = true;
            } else {
                ctx.lineTo(p.x * CELL_SIZE + CELL_SIZE/2, p.y * CELL_SIZE + CELL_SIZE/2);
            }
        }
        ctx.stroke();
    }
    
    // Правая линия (пропускаем точки с break)
    if (boss.trailRight && boss.trailRight.length >= 2) {
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = boss.trailColor || '#ff2200';
        ctx.strokeStyle = boss.trailColor || '#ff2200';
        
        let started = false;
        for (let i = 0; i < boss.trailRight.length; i++) {
            const p = boss.trailRight[i];
            if (p.break) {
                started = false;
                continue;
            }
            if (!started) {
                ctx.moveTo(p.x * CELL_SIZE + CELL_SIZE/2, p.y * CELL_SIZE + CELL_SIZE/2);
                started = true;
            } else {
                ctx.lineTo(p.x * CELL_SIZE + CELL_SIZE/2, p.y * CELL_SIZE + CELL_SIZE/2);
            }
        }
        ctx.stroke();
    }
    
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
    
    // ===== ЧАСТИЦЫ =====
    drawParticles();
    
    // ===== ЭФФЕКТ СТОЛКНОВЕНИЯ =====
    if (crashEffect.active) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = crashEffect.color;
        ctx.fillRect(crashEffect.x * CELL_SIZE, crashEffect.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        crashEffect.timer--;
        if (crashEffect.timer <= 0) crashEffect.active = false;
    }
    
    // ===== БОНУСЫ (ЕСЛИ ЕСТЬ) =====
    if (typeof drawBonuses === 'function') {
        drawBonuses();
    }
    
    // ===== МОТОЦИКЛЫ ИГРОКОВ =====
    if (typeof players !== 'undefined') {
        for (let p of players) {
            if (p.alive) {
                const cx = p.x * CELL_SIZE + CELL_SIZE / 2;
                const cy = p.y * CELL_SIZE + CELL_SIZE / 2;
                
                ctx.save();
                ctx.translate(cx, cy);
                
                if (p.dirX === 1) ctx.rotate(0);
                else if (p.dirX === -1) ctx.rotate(Math.PI);
                else if (p.dirY === -1) ctx.rotate(-Math.PI / 2);
                else if (p.dirY === 1) ctx.rotate(Math.PI / 2);
                
                ctx.shadowBlur = 12 + 3 * Math.sin(Date.now() * 0.01);
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-5, -7);
                ctx.lineTo(-5, 7);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.moveTo(5, 0);
                ctx.lineTo(-2, -3);
                ctx.lineTo(-2, 3);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        }
    }
    
    // ===== ОБРАТНЫЙ ОТСЧЁТ =====
    if (typeof countdownActive !== 'undefined' && countdownActive) {
        ctx.font = 'bold 64px "Courier New"';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        let text = countdownValue > 0 ? countdownValue.toString() : '';
        if (countdownValue === 0) text = 'GO!';
        if (text) {
            let scale = 1 + Math.sin(Date.now() * 0.02) * 0.2;
            ctx.save();
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.scale(scale, scale);
            ctx.fillText(text, -ctx.measureText(text).width/2, 20);
            ctx.restore();
        }
    }
    
    // ===== ПАУЗА =====
    if (paused && gameActive && !countdownActive) {
        ctx.font = 'bold 36px "Courier New"';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('⏸ ПАУЗА', canvas.width/2 - 70, canvas.height/2);
    }
    
    ctx.shadowBlur = 0;
}
