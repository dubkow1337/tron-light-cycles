// ========== ИГРОКИ ==========

// Константы
const CELL_SIZE = 16;
const WIDTH = 75;   // 1200 / 16
const HEIGHT = 50;  // 800 / 16

// Массив игроков
const players = [
    { 
        color: '#00ffff',
        trailColor: '#0066aa',
        name: 'Синий', 
        x: 5, y: Math.floor(HEIGHT / 2), 
        dirX: 1, dirY: 0, 
        trail: [], 
        alive: true, 
        score: 0 
    },
    { 
        color: '#ffaa00',
        trailColor: '#aa3300',
        name: 'Оранжевый', 
        x: WIDTH - 6, y: Math.floor(HEIGHT / 2), 
        dirX: -1, dirY: 0, 
        trail: [], 
        alive: true, 
        score: 0 
    }
];

// Сброс игроков
function resetPlayers() {
    players[0].x = 5;
    players[0].y = Math.floor(HEIGHT / 2);
    players[0].dirX = 1;
    players[0].dirY = 0;
    players[0].trail = [{ x: players[0].x, y: players[0].y }];
    players[0].alive = true;
    
    players[1].x = WIDTH - 6;
    players[1].y = Math.floor(HEIGHT / 2);
    players[1].dirX = -1;
    players[1].dirY = 0;
    players[1].trail = [{ x: players[1].x, y: players[1].y }];
    players[1].alive = true;
}
