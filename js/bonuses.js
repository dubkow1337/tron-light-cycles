// ========== БОНУСЫ ==========

let bonuses = [];
let bonusTimer = 0;

// Активные эффекты (глобальные флаги)
let shieldActive = false;
let shieldEndTime = 0;
let speedActive = false;
let speedEndTime = 0;
let slowActive = false;
let slowEndTime = 0;
let noTrailActive = false;
let noTrailEndTime = 0;

// Настройки бонусов
const BONUS_CONFIG = {
    speed: {
        name: 'Ускорение',
        color: '#00ff00',
        symbol: '⚡',
        duration: 5000,        // 5 секунд
        effect: () => {
            speedActive = true;
            speedEndTime = Date.now() + BONUS_CONFIG.speed.duration;
            showMessage('⚡ СКОРОСТЬ УВЕЛИЧЕНА!');
        }
    },
    shield: {
        name: 'Щит',
        color: '#0088ff',
        symbol: '🛡️',
        duration: 8000,        // 8 секунд
        effect: () => {
            shieldActive = true;
            shieldEndTime = Date.now() + BONUS_CONFIG.shield.duration;
            showMessage('🛡️ ЩИТ АКТИВИРОВАН! (Полная неуязвимость)');
        }
    },
    slowEnemies: {
        name: 'Замедление врагов',
        color: '#ff6600',
        symbol: '🐢',
        duration: 6000,        // 6 секунд
        effect: () => {
            slowActive = true;
            slowEndTime = Date.now() + BONUS_CONFIG.slowEnemies.duration;
            showMessage('🐢 ВРАГИ ЗАМЕДЛЕНЫ!');
        }
    },
    noTrail: {
        name: 'Стереть след врага',
        color: '#aa00ff',
        symbol: '✂️',
        duration: 7000,        // 7 секунд
        effect: () => {
            noTrailActive = true;
            noTrailEndTime = Date.now() + BONUS_CONFIG.noTrail.duration;
            // Очищаем следы врагов
            if (opponentType === 'survival') {
                for (let e of survivalEnemies) {
                    e.trail = [{ x: e.x, y: e.y }];
                }
            }
            if (opponentType === 'ai' && players[1] && players[1].alive) {
                players[1].trail = [{ x: players[1].x, y: players[1].y }];
            }
            showMessage('✂️ СЛЕД ПРОТИВНИКА СТЁРТ!');
        }
    }
};

function spawnBonus() {
    if (bonuses.length >= 3) return;
    
    const types = ['speed', 'shield', 'slowEnemies', 'noTrail'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let x, y;
    let free = false;
    let attempts = 0;
    while (!free && attempts < 50) {
        x = Math.floor(Math.random() * WIDTH);
        y = Math.floor(Math.random() * HEIGHT);
        free = true;
        
        // Не спавнить на игроках
        for (let p of players) {
            if (p.alive && p.x === x && p.y === y) free = false;
        }
        // Не спавнить на врагах
        for (let e of survivalEnemies) {
            if (e.alive && e.x === x && e.y === y) free = false;
        }
        // Не спавнить на других бонусах
        for (let b of bonuses) {
            if (b.x === x && b.y === y) free = false;
        }
        attempts++;
    }
    
    if (free) {
        bonuses.push({ 
            x: x, y: y, 
            type: type, 
            life: 300,  // 300 кадров ~5 секунд на поле
            color: BONUS_CONFIG[type].color,
            symbol: BONUS_CONFIG[type].symbol
        });
    }
}

function updateBonuses() {
    // Обновление таймеров бонусов на поле
    for (let i = 0; i < bonuses.length; i++) {
        bonuses[i].life--;
        if (bonuses[i].life <= 0) {
            bonuses.splice(i, 1);
            i--;
        }
    }
    
    // Спавн новых бонусов (каждые ~5 секунд)
    bonusTimer++;
    if (bonusTimer > 70 && bonuses.length < 3) {
        bonusTimer = 0;
        spawnBonus();
    }
    
    const now = Date.now();
    
    // Сброс эффектов по таймеру
    if (speedActive && now > speedEndTime) {
        speedActive = false;
        showMessage('⚡ Ускорение закончилось');
    }
    
    if (shieldActive && now > shieldEndTime) {
        shieldActive = false;
        showMessage('🛡️ Щит исчез!');
    }
    
    if (slowActive && now > slowEndTime) {
        slowActive = false;
        showMessage('🐢 Враги ускорились!');
    }
    
    if (noTrailActive && now > noTrailEndTime) {
        noTrailActive = false;
        showMessage('✂️ У врагов снова появился след!');
    }
}

function collectBonus(bonus, player) {
    const type = bonus.type;
    const config = BONUS_CONFIG[type];
    
    showMessage(`✨ ${config.name}! ${config.symbol}`);
    config.effect();  // ← применяем эффект
    
    // Специальная логика для ножниц (дополнительная очистка)
    if (type === 'noTrail') {
        // Очищаем следы врагов
        if (opponentType === 'survival') {
            for (let e of survivalEnemies) {
                e.trail = [{ x: e.x, y: e.y }];
            }
        }
        if (opponentType === 'ai' && players[1] && players[1].alive) {
            players[1].trail = [{ x: players[1].x, y: players[1].y }];
        }
    }
}

function drawBonuses() {
    // Отрисовка бонусов на поле
    for (let b of bonuses) {
        const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
        ctx.fillStyle = b.color;
        ctx.globalAlpha = pulse;
        ctx.fillRect(b.x * CELL_SIZE, b.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#000000';
        ctx.font = `${CELL_SIZE-4}px monospace`;
        ctx.fillText(b.symbol, b.x * CELL_SIZE + 3, b.y * CELL_SIZE + CELL_SIZE - 5);
    }
    
    // Индикаторы эффектов (в левом верхнем углу)
    let offsetX = 10;
    let offsetY = 25;
    const now = Date.now();
    
    if (speedActive) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('⚡', offsetX, offsetY);
        const remaining = Math.max(0, Math.ceil((speedEndTime - now) / 1000));
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${remaining}s`, offsetX + 20, offsetY);
        offsetX += 50;
    }
    
    if (shieldActive) {
        ctx.fillStyle = '#0088ff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('🛡️', offsetX, offsetY);
        const remaining = Math.max(0, Math.ceil((shieldEndTime - now) / 1000));
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${remaining}s`, offsetX + 25, offsetY);
        offsetX += 50;
    }
    
    if (slowActive) {
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('🐢', offsetX, offsetY);
        const remaining = Math.max(0, Math.ceil((slowEndTime - now) / 1000));
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${remaining}s`, offsetX + 20, offsetY);
        offsetX += 50;
    }
    
    if (noTrailActive) {
        ctx.fillStyle = '#aa00ff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('✂️', offsetX, offsetY);
        const remaining = Math.max(0, Math.ceil((noTrailEndTime - now) / 1000));
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${remaining}s`, offsetX + 20, offsetY);
    }
}

function resetBonuses() {
    bonuses = [];
    bonusTimer = 0;
    shieldActive = false;
    speedActive = false;
    slowActive = false;
    noTrailActive = false;
}
