// ========== ОТРИСОВКА ==========

let particles = [];
let crashEffect = { active: false, x: 0, y: 0, color: '#ffffff', timer: 0 };
// boss объявлен в boss.js

// Эффекты взрыва - используем глобальную переменную
if (typeof window.explosionEffects === 'undefined') {
    window.explosionEffects = [];
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Единые настройки следа
const TRAIL_LENGTH = 50;
const TRAIL_FADE = true;

// ===== ЗВЕЗДЫ ДЛЯ ФОНА =====
let stars = [];
function initStars() {
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 0.3 + 0.1,
            alpha: Math.random() * 0.5 + 0.2,
            twinkle: Math.random() * Math.PI * 2
        });
    }
}
initStars();

// cloneData объявлен в bonuses.js — НЕ ОБЪЯВЛЯЕМ ЕГО ЗДЕСЬ!

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
    if (typeof updateFireworks === 'function') {
        updateFireworks();
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

// ===== УНИВЕРСАЛЬНАЯ ОТРИСОВКА СЛЕДА С ЗАТУХАНИЕМ =====
function drawTrail(trail, color, shadowColor, lineWidth) {
    if (!trail || trail.length < 2) return;
    
    const len = trail.length;
    const maxLen = TRAIL_LENGTH;
    const start = Math.max(0, len - maxLen);
    const points = trail.slice(start);
    const pointsLen = points.length;
    
    if (pointsLen < 2) return;
    
    for (let i = 0; i < pointsLen - 1; i++) {
        const progress = i / pointsLen;
        const alpha = TRAIL_FADE ? Math.pow(progress, 0.6) : 1;
        
        ctx.beginPath();
        ctx.lineWidth = lineWidth || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 6 * alpha;
        ctx.shadowColor = shadowColor || color;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        
        const p1 = points[i];
        const p2 = points[i+1];
        ctx.moveTo(p1.x * CELL_SIZE + CELL_SIZE/2, p1.y * CELL_SIZE + CELL_SIZE/2);
        ctx.lineTo(p2.x * CELL_SIZE + CELL_SIZE/2, p2.y * CELL_SIZE + CELL_SIZE/2);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// ========== ЭФФЕКТЫ ВЗРЫВА ==========
function createExplosionEffect(centerX, centerY, radius) {
    const effects = window.explosionEffects;
    
    effects.push({
        x: centerX * CELL_SIZE + CELL_SIZE / 2,
        y: centerY * CELL_SIZE + CELL_SIZE / 2,
        radius: 0,
        maxRadius: radius * CELL_SIZE,
        life: 1.0,
        color: '#ff4400'
    });
    
    const count = 60 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        const colors = ['#ff4400', '#ff8800', '#ffcc00', '#ff2200', '#ffffff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
            x: centerX * CELL_SIZE + CELL_SIZE / 2,
            y: centerY * CELL_SIZE + CELL_SIZE / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: color,
            size: Math.random() * 6 + 2
        });
    }
}

function updateExplosionEffects() {
    const effects = window.explosionEffects;
    for (let i = effects.length - 1; i >= 0; i--) {
        const e = effects[i];
        e.radius += 2;
        e.life -= 0.02;
        
        if (e.life <= 0 || e.radius >= e.maxRadius) {
            effects.splice(i, 1);
        }
    }
}

function drawExplosionEffects() {
    const effects = window.explosionEffects;
    for (let e of effects) {
        ctx.save();
        ctx.globalAlpha = e.life * 0.6;
        
        ctx.shadowBlur = 40;
        ctx.shadowColor = e.color;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 60;
        ctx.shadowColor = '#ff8800';
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        if (e.radius < e.maxRadius * 0.3) {
            ctx.shadowBlur = 80;
            ctx.shadowColor = '#ffffff';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 4 * (1 - e.radius / (e.maxRadius * 0.3)), 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

function draw() {
    if (!ctx) return;
    
    // ============================================================
    // ===== 1. ФОН: ГЛУБОКИЙ КОСМОС СО ЗВЕЗДАМИ =====
    // ============================================================
    // Градиент от темно-синего к черному
    const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width * 0.7
    );
    gradient.addColorStop(0, '#0a1a2a');
    gradient.addColorStop(0.7, '#050d18');
    gradient.addColorStop(1, '#020408');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Мерцающие звезды
    const time = Date.now() * 0.001;
    for (let s of stars) {
        const alpha = s.alpha * (0.7 + 0.3 * Math.sin(time * s.twinkle + s.x));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#88ccff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Неоновая дымка в центре
    const glow = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, 0,
        canvas.width/2, canvas.height/2, canvas.width * 0.3
    );
    glow.addColorStop(0, 'rgba(0, 200, 255, 0.03)');
    glow.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ============================================================
    // ===== 2. ИГРОВОЕ ПОЛЕ ПОВЕРХ =====
    // ============================================================
    
    // Салют
    if (typeof drawFireworks === 'function') {
        drawFireworks();
    }
    
    ctx.shadowBlur = 0;
    
    // Сетка (полупрозрачная)
    ctx.strokeStyle = 'rgba(15, 63, 58, 0.25)';
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
            drawTrail(p.trail, p.trailColor, p.trailColor, 3);
        }
    }
    
    // ===== СЛЕД КЛОНА =====
    if (typeof cloneData !== 'undefined' && cloneData && cloneData.active && cloneData.trail && cloneData.trail.length > 1) {
        drawTrail(cloneData.trail, '#ff44ff', '#ff44ff', 3);
    }
    
    // ===== СЛЕДЫ ВРАГОВ =====
    if (typeof survivalEnemies !== 'undefined') {
        for (let e of survivalEnemies) {
            drawTrail(e.trail, e.trailColor, e.trailColor, 3);
        }
        for (let e of survivalEnemies) {
            const cx = e.x * CELL_SIZE + CELL_SIZE / 2;
            const cy = e.y * CELL_SIZE + CELL_SIZE / 2;
            ctx.save();
            ctx.translate(cx, cy);
            if (e.dirX === 1) ctx.rotate(0);
            else if (e.dirX === -1) ctx.rotate(Math.PI);
            else if (e.dirY === -1) ctx.rotate(-Math.PI / 2);
            else if (e.dirY === 1) ctx.rotate(Math.PI / 2);
            ctx.shadowBlur = 8;
            ctx.shadowColor = e.color;
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-4, -5);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
    
    // ===== БОСС =====
    if (typeof boss !== 'undefined' && boss && boss.alive) {
        drawTrail(boss.trail, boss.trailColor || '#ff2200', boss.trailColor || '#ff2200', 5);
        const size = boss.size || 3;
        const cx = boss.x * CELL_SIZE + (size * CELL_SIZE) / 2;
        const cy = boss.y * CELL_SIZE + (size * CELL_SIZE) / 2;
        ctx.save();
        ctx.translate(cx, cy);
        if (boss.dirX === 1) ctx.rotate(0);
        else if (boss.dirX === -1) ctx.rotate(Math.PI);
        else if (boss.dirY === -1) ctx.rotate(-Math.PI / 2);
        else if (boss.dirY === 1) ctx.rotate(Math.PI / 2);
        ctx.shadowBlur = 25;
        ctx.shadowColor = boss.color || '#ff3300';
        ctx.fillStyle = boss.color || '#ff3300';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -14);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-10, 5);
        ctx.lineTo(-10, 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        if (boss.maxHealth) {
            const healthBarWidth = 60;
            const healthBarX = boss.x * CELL_SIZE - healthBarWidth/2 + (size * CELL_SIZE) / 2;
            const healthBarY = boss.y * CELL_SIZE - 16;
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, 4);
            ctx.fillStyle = '#ff3300';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth * (boss.health / boss.maxHealth), 4);
        }
    }
    
    // ===== БОНУСЫ =====
    if (typeof drawBonuses === 'function') {
        drawBonuses();
    }
    
    // ===== ИНДИКАТОРЫ БОНУСОВ =====
    if (typeof drawBonusIndicators === 'function') {
        drawBonusIndicators();
    }
    
    // ===== ЧАСТИЦЫ =====
    drawParticles();
    
    // ===== ЭФФЕКТЫ ВЗРЫВА =====
    if (typeof drawExplosionEffects === 'function') {
        drawExplosionEffects();
    }
    
    // ===== ЭФФЕКТ СТОЛКНОВЕНИЯ =====
    if (crashEffect.active) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = crashEffect.color;
        ctx.fillRect(crashEffect.x * CELL_SIZE, crashEffect.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        crashEffect.timer--;
        if (crashEffect.timer <= 0) crashEffect.active = false;
    }
    
    // ===== МОТОЦИКЛ ИГРОКА =====
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
    
    // ===== КЛОН =====
    if (typeof cloneData !== 'undefined' && cloneData && cloneData.active && players[0] && players[0].alive) {
        const cloneX = players[0].x + (cloneData.offsetX || 2);
        const cloneY = players[0].y + (cloneData.offsetY || 0);
        
        if (cloneX >= 0 && cloneX < WIDTH && cloneY >= 0 && cloneY < HEIGHT) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.translate(cloneX * CELL_SIZE + CELL_SIZE/2, cloneY * CELL_SIZE + CELL_SIZE/2);
            
            if (players[0].dirX === 1) ctx.rotate(0);
            else if (players[0].dirX === -1) ctx.rotate(Math.PI);
            else if (players[0].dirY === -1) ctx.rotate(-Math.PI / 2);
            else if (players[0].dirY === 1) ctx.rotate(Math.PI / 2);
            
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff44ff';
            ctx.fillStyle = '#ff44ff';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-5, -6);
            ctx.lineTo(-5, 6);
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
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
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

// ========== САЛЮТ ==========

let fireworkParticles = [];
let fireworkActive = false;

function startFireworks(color, count = 6) {
    try {
        if (!canvas || !ctx) return;
        fireworkParticles = [];
        fireworkActive = true;
        const colors = color === '#00ffff' ? ['#00ffff', '#0088ff', '#00ffcc'] : ['#ffaa00', '#ff6600', '#ffcc44'];
        
        for (let burst = 0; burst < count; burst++) {
            const x1 = 50 + Math.random() * 150;
            const y1 = 50 + Math.random() * (canvas.height - 100);
            createFireworkBurst(x1, y1, colors);
            const x2 = canvas.width - 50 - Math.random() * 150;
            const y2 = 50 + Math.random() * (canvas.height - 100);
            createFireworkBurst(x2, y2, colors);
        }
        
        setTimeout(() => {
            fireworkActive = false;
            fireworkParticles = [];
        }, 5000);
    } catch(e) {
        console.warn('Салют не удался:', e);
    }
}

function createFireworkBurst(x, y, colors) {
    const count = 50 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 2 + Math.random() * 4;
        fireworkParticles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: 0.005 + Math.random() * 0.012,
            color: color,
            size: size
        });
    }
}

function updateFireworks() {
    if (!fireworkActive) return;
    try {
        for (let i = fireworkParticles.length - 1; i >= 0; i--) {
            const p = fireworkParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.03;
            p.vx *= 0.99;
            p.life -= p.decay;
            if (p.life <= 0) {
                fireworkParticles.splice(i, 1);
            }
        }
    } catch(e) {}
}

function drawFireworks() {
    if (!fireworkActive || fireworkParticles.length === 0) return;
    try {
        for (const p of fireworkParticles) {
            ctx.globalAlpha = p.life;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    } catch(e) {}
}
