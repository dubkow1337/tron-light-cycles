// ========== БОНУСЫ ==========

// 1. Объявление переменных (совместимо с script.js)
let bonuses = [];
let bonusTimer = 0;
let bonusShieldActive = false;
let bonusShieldEndTime = 0;
let bonusSpeedActive = false;
let bonusSpeedEndTime = 0;
let bonusSlowActive = false;
let bonusSlowEndTime = 0;
let bonusNoTrailActive = false;
let bonusNoTrailEndTime = 0;

// 2. Функция спавна бонусов
function spawnBonus() {
    if (bonuses.length >= 3) return;
    if (typeof WIDTH === 'undefined' || typeof HEIGHT === 'undefined') return;
    
    const types = ['speed', 'shield', 'slowEnemies', 'noTrail'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let x, y;
    let free = false;
    let attempts = 0;
    while (!free && attempts < 50) {
        x = Math.floor(Math.random() * WIDTH);
        y = Math.floor(Math.random() * HEIGHT);
        free = true;
        for (let p of players) {
            if (p.alive && p.x === x && p.y === y) free = false;
        }
        for (let e of survivalEnemies) {
            if (e.alive && e.x === x && e.y === y) free = false;
        }
        for (let b of bonuses) {
            if (b.x === x && b.y === y) free = false;
        }
        attempts++;
    }
    
    if (free) {
        const colors = {
            speed: '#00ff00',
            shield: '#0088ff',
            slowEnemies: '#ff6600',
            noTrail: '#aa00ff'
        };
        const symbols = {
            speed: '⚡',
            shield: '🛡️',
            slowEnemies: '🐢',
            noTrail: '✂️'
        };
        bonuses.push({ 
            x: x, y: y, 
            type: type, 
            life: 300,
            color: colors[type],
            symbol: symbols[type]
        });
    }
}

// 3. Обновление бонусов (вызывается в updateGame)
function updateBonuses() {
    // Удаление просроченных бонусов
    for (let i = 0; i < bonuses.length; i++) {
        bonuses[i].life--;
        if (bonuses[i].life <= 0) {
            bonuses.splice(i, 1);
            i--;
        }
    }
    
    // Спавн новых
    bonusTimer++;
    if (bonusTimer > 70 && bonuses.length < 3) {
        bonusTimer = 0;
        spawnBonus();
    }
    
    // Сброс эффектов по таймеру
    const now = Date.now();
    if (bonusSpeedActive && now > bonusSpeedEndTime) {
        bonusSpeedActive = false;
        showMessage('⚡ Ускорение закончилось');
    }
    if (bonusShieldActive && now > bonusShieldEndTime) {
        bonusShieldActive = false;
        showMessage('🛡️ Щит исчез!');
    }
    if (bonusSlowActive && now > bonusSlowEndTime) {
        bonusSlowActive = false;
        showMessage('🐢 Враги ускорились!');
    }
    if (bonusNoTrailActive && now > bonusNoTrailEndTime) {
        bonusNoTrailActive = false;
        showMessage('✂️ У врагов снова появился след!');
    }
}

// 4. Сбор бонуса игроком
function collectBonus(bonus, player) {
    const now = Date.now();
    const type = bonus.type;
    
    switch(type) {
        case 'speed':
            bonusSpeedActive = true;
            bonusSpeedEndTime = now + 5000;
            showMessage('⚡ СКОРОСТЬ УВЕЛИЧЕНА!');
            break;
        case 'shield':
            bonusShieldActive = true;
            bonusShieldEndTime = now + 8000;
            showMessage('🛡️ ЩИТ АКТИВИРОВАН! (Неуязвимость)');
            break;
        case 'slowEnemies':
            bonusSlowActive = true;
            bonusSlowEndTime = now + 6000;
            showMessage('🐢 ВРАГИ ЗАМЕДЛЕНЫ!');
            break;
        case 'noTrail':
            bonusNoTrailActive = true;
            bonusNoTrailEndTime = now + 7000;
            if (opponentType === 'survival') {
                for (let e of survivalEnemies) {
                    e.trail = [{ x: e.x, y: e.y }];
                }
            }
            if (opponentType === 'ai' && players[1].alive) {
                players[1].trail = [{ x: players[1].x, y: players[1].y }];
            }
            showMessage('✂️ СЛЕД ПРОТИВНИКА СТЁРТ!');
            break;
    }
}

// 5. Отрисовка бонусов (вызывается в draw)
function drawBonuses() {
    // Рисуем бонусы на поле
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
    
    // Индикаторы эффектов (левый верхний угол)
    let offsetX = 10;
    let offsetY = 25;
    const now = Date.now();
    
    if (bonusSpeedActive) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('⚡', offsetX, offsetY);
        const remaining = Math.max(0, Math.ceil((bonusSpeedEndTime - now) / 1000));
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${remaining}s`, offsetX + 20, offsetY);
        offsetX += 50;
    }
    if (bonusShieldActive) {
        ctx.fillStyle = '#0088ff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('🛡️', offsetX, offsetY);
        const remaining = Math.max(0, Math.ceil((bonusShieldEndTime - now) / 1000));
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${remaining}s`, offsetX + 25, offsetY);
        offsetX += 50;
    }
    if (bonusSlowActive) {
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('🐢', offsetX, offsetY);
        const remaining = Math.max(0, Math.ceil((bonusSlowEndTime - now) / 1000));
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${remaining}s`, offsetX + 20, offsetY);
        offsetX += 50;
    }
    if (bonusNoTrailActive) {
        ctx.fillStyle = '#aa00ff';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('✂️', offsetX, offsetY);
        const remaining = Math.max(0, Math.ceil((bonusNoTrailEndTime - now) / 1000));
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`${remaining}s`, offsetX + 20, offsetY);
    }
}

// 6. Сброс бонусов при новом раунде
function resetBonuses() {
    bonuses = [];
    bonusTimer = 0;
    bonusShieldActive = false;
    bonusSpeedActive = false;
    bonusSlowActive = false;
    bonusNoTrailActive = false;
}

// 7. ПЕРЕХВАТ ФУНКЦИЙ ИЗ script.js (внедрение бонусов без правок)

// Сохраняем оригинальные функции
const _origInitGame = initGame;
const _origUpdateGame = updateGame;
const _origUpdateSurvival = updateSurvival;
const _origDraw = draw;
const _origResetGame = resetGame;

// Переопределяем initGame
initGame = function() {
    resetBonuses();
    _origInitGame();
};

// Переопределяем updateGame
updateGame = function() {
    _origUpdateGame();
    
    // Если игра активна, обновляем бонусы и проверяем сбор
    if (gameActive) {
        updateBonuses();
        
        // Сбор бонусов игроком (синим)
        for (let i = 0; i < bonuses.length; i++) {
            let b = bonuses[i];
            if (players[0].alive && players[0].x === b.x && players[0].y === b.y) {
                collectBonus(b, players[0]);
                bonuses.splice(i, 1);
                i--;
            }
        }
    }
};

// Переопределяем updateSurvival (добавляем эффекты)
updateSurvival = function() {
    // Сохраняем оригинальную логику
    _origUpdateSurvival();
    
    // Дополнительные эффекты для врагов
    // (замедление уже в оригинале, здесь можно добавить что-то ещё)
};

// Переопределяем draw (добавляем отрисовку бонусов)
draw = function() {
    _origDraw();
    
    // Рисуем бонусы поверх всего
    drawBonuses();
};

// Переопределяем resetGame (чтобы сбрасывать бонусы)
resetGame = function() {
    resetBonuses();
    _origResetGame();
};

// 8. Добавляем поддержку щита в проверку столкновений
// Переопределяем updateGame для щита (полная неуязвимость)
// Это уже сделано выше, но добавим дополнительную проверку
const _origUpdateGameCollision = updateGame;

// Запускаем бонусы после загрузки страницы
console.log('✅ Бонусы успешно загружены!');
