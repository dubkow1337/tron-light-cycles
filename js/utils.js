// ========== УТИЛИТЫ ==========

// Показ сообщения
function showMessage(msg) {
    const messageDiv = document.getElementById('gameMessage');
    if (messageDiv) messageDiv.innerText = msg;
}

// Расстояние от точки до отрезка
function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const ax = px - x1;
    const ay = py - y1;
    const bx = x2 - x1;
    const by = y2 - y1;
    const dot = ax * bx + ay * by;
    const len2 = bx * bx + by * by;
    if (len2 === 0) return Math.hypot(ax, ay);
    let t = dot / len2;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    const projX = x1 + t * bx;
    const projY = y1 + t * by;
    return Math.hypot(px - projX, py - projY);
}

// Безопасная проверка клетки
function isSafe(x, y, selfTrail, opponentTrail, width, height) {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    for (let i = 0; i < selfTrail.length - 1; i++) {
        if (selfTrail[i].x === x && selfTrail[i].y === y) return false;
    }
    for (let i = 0; i < opponentTrail.length; i++) {
        if (opponentTrail[i].x === x && opponentTrail[i].y === y) return false;
    }
    return true;
}
