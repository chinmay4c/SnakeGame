const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const levelDisplay = document.getElementById('level');
const timeDisplay = document.getElementById('time');
const powerUpList = document.getElementById('powerUpList');
const achievementList = document.getElementById('achievementList');

const gridSize = 20;
const canvasSize = 600;
const tileCount = canvasSize / gridSize;

let snake = [];
let food = {};
let powerUps = [];
let obstacles = [];
let portals = [];
let direction = { x: 1, y: 0 };
let speed = 100;
let gameInterval;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let level = 1;
let gameTime = 0;
let isPaused = false;
let gameStarted = false;

const foodTypes = ['normal', 'bonus', 'golden', 'poison'];
const powerUpTypes = ['speed', 'ghost', 'magnet', 'shrink', 'invincibility'];
const obstacleTypes = ['static', 'moving', 'blinking'];

const sounds = {
    eat: new Audio('eat.mp3'),
    die: new Audio('die.mp3'),
    powerUp: new Audio('powerup.mp3'),
    levelUp: new Audio('levelup.mp3'),
    portal: new Audio('portal.mp3')
};

const achievements = [
    { id: 'score100', name: 'Century', description: 'Score 100 points', achieved: false },
    { id: 'level5', name: 'Rising Star', description: 'Reach level 5', achieved: false },
    { id: 'golden', name: 'Midas Touch', description: 'Eat a golden apple', achieved: false },
    { id: 'noPowerUp', name: 'Pure Skill', description: 'Reach level 10 without using power-ups', achieved: false }
];

document.addEventListener('keydown', handleKeyPress);

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    score = 0;
    level = 1;
    gameTime = 0;
    updateScore();
    updateLevel();
    generateFood();
    generateObstacles();
    generatePortals();
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, speed);
    startTimer();
}

function updateGame() {
    if (isPaused) return;
    moveSnake();
    checkCollisions();
    eatFood();
    collectPowerUps();
    moveObstacles();
    blinkObstacles();
    drawGame();
    checkLevelUp();
    updateAchievements();
}

function drawGame() {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawGrid();
    drawSnake();
    drawFood();
    drawObstacles();
    drawPortals();
    drawPowerUps();
}

function drawGrid() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvasSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvasSize, i * gridSize);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((part, index) => {
        const gradient = ctx.createRadialGradient(
            (part.x + 0.5) * gridSize, (part.y + 0.5) * gridSize, 0,
            (part.x + 0.5) * gridSize, (part.y + 0.5) * gridSize, gridSize / 2
        );
        gradient.addColorStop(0, '#50C878');
        gradient.addColorStop(1, '#228B22');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
        
        if (index === 0) {
            // Draw eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc((part.x + 0.3) * gridSize, (part.y + 0.3) * gridSize, gridSize * 0.15, 0, Math.PI * 2);
            ctx.arc((part.x + 0.7) * gridSize, (part.y + 0.3) * gridSize, gridSize * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw pupils
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc((part.x + 0.3) * gridSize, (part.y + 0.3) * gridSize, gridSize * 0.07, 0, Math.PI * 2);
            ctx.arc((part.x + 0.7) * gridSize, (part.y + 0.3) * gridSize, gridSize * 0.07, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawFood() {
    const colors = {
        'normal': '#FF4500',
        'bonus': '#FFD700',
        'golden': '#FFA500',
        'poison': '#800080'
    };
    
    ctx.fillStyle = colors[food.type];
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * gridSize, (food.y + 0.5) * gridSize, gridSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc((food.x + 0.3) * gridSize, (food.y + 0.3) * gridSize, gridSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'blinking' && obstacle.visible) {
            ctx.fillStyle = '#A52A2A';
        } else if (obstacle.type === 'moving') {
            ctx.fillStyle = '#8B4513';
        } else {
            ctx.fillStyle = '#A52A2A';
        }
        ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize, gridSize);
    });
}

function drawPortals() {
    portals.forEach((portal, index) => {
        const gradient = ctx.createRadialGradient(
            (portal.x + 0.5) * gridSize, (portal.y + 0.5) * gridSize, 0,
            (portal.x + 0.5) * gridSize, (portal.y + 0.5) * gridSize, gridSize
        );
        gradient.addColorStop(0, index % 2 === 0 ? '#4B0082' : '#9400D3');
        gradient.addColorStop(1, 'black');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc((portal.x + 0.5) * gridSize, (portal.y + 0.5) * gridSize, gridSize / 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        const colors = {
            'speed': '#00FF00',
            'ghost': '#87CEEB',
            'magnet': '#FF69B4',
            'shrink': '#FF1493',
            'invincibility': '#FFD700'
        };
        
        ctx.fillStyle = colors[powerUp.type];
        ctx.beginPath();
        ctx.arc((powerUp.x + 0.5) * gridSize, (powerUp.y + 0.5) * gridSize, gridSize / 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw icon or symbol for power-up
        ctx.fillStyle = 'white';
        ctx.font = `${gridSize / 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const symbols = { 'speed': '⚡', 'ghost': '👻', 'magnet': '🧲', 'shrink': '🔍', 'invincibility': '🛡️' };
        ctx.fillText(symbols[powerUp.type], (powerUp.x + 0.5) * gridSize, (powerUp.y + 0.5) * gridSize);
    });
}

function moveSnake() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    snake.unshift(head);
    
    // Check if snake goes through portal
    const portalIndex = portals.findIndex(portal => portal.x === head.x && portal.y === head.y);
    if (portalIndex !== -1) {
        const exitPortal = portals[(portalIndex + 1) % 2];
        snake[0] = { x: exitPortal.x, y: exitPortal.y };
        sounds.portal.play();
    }
    
    if (!checkFoodCollision()) {
        snake.pop();
    }
}

function handleKeyPress(event) {
    const key = event.key.toLowerCase();
    const newDirection = {
        'arrowleft': { x: -1, y: 0 },
        'a': { x: -1, y: 0 },
        'arrowup': { x: 0, y: -1 },
        'w': { x: 0, y: -1 },
        'arrowright': { x: 1, y: 0 },
        'd': { x: 1, y: 0 },
        'arrowdown': { x: 0, y: 1 },
        's': { x: 0, y: 1 }
    }[key];

    if (newDirection && !isOppositeDirection(newDirection)) {
        direction = newDirection;
    }

    if (key === ' ') {
        togglePause();
    }

    if (key === 'enter' && !gameStarted) {
        startGame();
    }
}

function isOppositeDirection(newDir) {
    return (direction.x === -newDir.x && direction.y === -newDir.y) ||
           (direction.y === -newDir.y && direction.x === -newDir.x);
}

function checkCollisions() {
    const head = snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }
    
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            endGame();
            return;
        }
    }
    
    // Obstacle collision
    if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y && obstacle.visible !== false)) {
        endGame();
        return;
    }
}

function checkFoodCollision() {
    const head = snake[0];
    return head.x === food.x && head.y === food.y;
}

function eatFood() {
    if (checkFoodCollision()) {
        sounds.eat.play();
        
        if (food.type === 'poison') {
            // Poison food shrinks the snake
            snake.pop();
            score -= 10;
        } else {
            // Normal food behavior
            score += food.type === 'golden' ? 50 : (food.type === 'bonus' ? 20 : 10);
            if (food.type === 'golden') {
                activateAchievement('golden');
            }
        }
        
        updateScore();
        if (score > highScore) {
            highScore = score;
            updateHighScore();
        }
        generateFood();
        
        if (Math.random() < 0.2) {
            generatePowerUp();
        }
    }
}

function generateFood() {
    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            type: getRandomFoodType()
        };
    } while (isPositionOccupied(food));
}

function getRandomFoodType() {
    const rand = Math.random();
    if (rand < 0.6) return 'normal';
    if (rand < 0.8) return 'bonus';
    if (rand < 0.9) return 'golden';
    return 'poison';
}

function generatePowerUp() {
    if (powerUps.length < 3) {
        do {
            const powerUp = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount),
                type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
            };
            if (!isPositionOccupied(powerUp)) {
                powerUps.push(powerUp);
                break;
            }
        } while (true);
    }
}

function collectPowerUps() {
    const head = snake[0];
    const powerUpIndex = powerUps.findIndex(pu => pu.x === head.x && pu.y === head.y);
    
    if (powerUpIndex !== -1) {
        const powerUp = powerUps[powerUpIndex];
        sounds.powerUp.play();
        activatePowerUp(powerUp.type);
        powerUps.splice(powerUpIndex, 1);
    }
}

function activatePowerUp(type) {
    switch (type) {
        case 'speed':
            speedBoost();
            break;
        case 'ghost':
            ghostMode();
            break;
        case 'magnet':
            magnetMode();
            break;
        case 'shrink':
            shrinkSnake();
            break;
        case 'invincibility':
            invincibilityMode();
            break;
    }
    updatePowerUpDisplay();
}

function speedBoost() {
    const originalSpeed = speed;
    speed /= 2;
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, speed);
    setTimeout(() => {
        speed = originalSpeed;
        clearInterval(gameInterval);
        gameInterval = setInterval(updateGame, speed);
    }, 5000);
}

function ghostMode() {
    // Implementation for ghost mode (pass through walls)
}

function magnetMode() {
    // Implementation for magnet mode (attract food)
}

function shrinkSnake() {
    const shrinkAmount = Math.min(3, Math.floor(snake.length / 2));
    snake = snake.slice(0, snake.length - shrinkAmount);
}

function invincibilityMode() {
    // Implementation for invincibility mode
}

