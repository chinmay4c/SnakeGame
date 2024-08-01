const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const levelDisplay = document.getElementById('level');
const difficultySelect = document.getElementById('difficultySelect');
const soundToggle = document.getElementById('soundToggle');

const gridSize = 20;
const canvasSize = 600;
const tileCount = canvasSize / gridSize;

let snake = [];
let food = {};
let powerUp = {};
let obstacles = [];
let direction = { x: 1, y: 0 };
let speed = 100;
let gameInterval;
let score = 0;
let highScore = 0;
let level = 1;
let isPaused = false;
let gameStarted = false;
let powerUpActive = false;
let powerUpTimer = null;

const foodTypes = ['normal', 'bonus', 'speed', 'shrink'];
const obstacleTypes = ['static', 'moving'];

const sounds = {
    eat: new Audio('eat.mp3'),
    die: new Audio('die.mp3'),
    powerUp: new Audio('powerup.mp3'),
    levelUp: new Audio('levelup.mp3')
};

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', restartGame);
document.addEventListener('keydown', handleKeyPress);
difficultySelect.addEventListener('change', updateDifficulty);

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    score = 0;
    level = 1;
    updateScore();
    updateLevel();
    generateFood();
    generateObstacles();
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, speed);
    startButton.disabled = true;
    pauseButton.disabled = false;
}

function updateGame() {
    if (isPaused) return;
    moveSnake();
    if (checkCollision()) {
        endGame();
        return;
    }
    if (checkFoodCollision()) {
        eatFood();
    }
    if (powerUpActive && checkPowerUpCollision()) {
        activatePowerUp();
    }
    moveObstacles();
    drawGame();
}

function drawGame() {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawGrid();
    drawSnake();
    drawFood();
    drawObstacles();
    if (powerUpActive) drawPowerUp();
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
    ctx.fillStyle = '#32CD32';
    snake.forEach((part, index) => {
        if (index === 0) {
            // Draw snake head
            ctx.fillStyle = '#228B22';
        } else {
            // Draw snake body
            ctx.fillStyle = `hsl(${120 + index * 5}, 100%, ${50 - index * 0.5}%)`;
        }
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
        
        // Draw eyes
        if (index === 0) {
            ctx.fillStyle = 'white';
            ctx.fillRect(part.x * gridSize + gridSize * 0.2, part.y * gridSize + gridSize * 0.2, gridSize * 0.2, gridSize * 0.2);
            ctx.fillRect(part.x * gridSize + gridSize * 0.6, part.y * gridSize + gridSize * 0.2, gridSize * 0.2, gridSize * 0.2);
        }
    });
}

function drawFood() {
    ctx.fillStyle = food.type === 'bonus' ? '#FFD700' : '#FF4500';
    ctx.beginPath();
    ctx.arc((food.x + 0.5) * gridSize, (food.y + 0.5) * gridSize, gridSize / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.type === 'moving' ? '#8B4513' : '#A52A2A';
        ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize, gridSize);
    });
}

function drawPowerUp() {
    ctx.fillStyle = '#00FFFF';
    ctx.beginPath();
    ctx.arc((powerUp.x + 0.5) * gridSize, (powerUp.y + 0.5) * gridSize, gridSize / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function moveSnake() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    snake.unshift(head);
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
}

function isOppositeDirection(newDir) {
    return (direction.x === -newDir.x && direction.y === -newDir.y) ||
           (direction.y === -newDir.y && direction.x === -newDir.x);
}

function checkCollision() {
    const head = snake[0];
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    return obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y);
}

function checkFoodCollision() {
    const head = snake[0];
    return head.x === food.x && head.y === food.y;
}

function checkPowerUpCollision() {
    const head = snake[0];
    return head.x === powerUp.x && head.y === powerUp.y;
}

function eatFood() {
    if (soundToggle.checked) {
        sounds.eat.play();
    }
    score += food.type === 'bonus' ? 20 : 10;
    updateScore();
    if (score > highScore) {
        highScore = score;
        updateHighScore();
    }
    if (score % 100 === 0) {
        levelUp();
    }
    generateFood();
    if (Math.random() < 0.1) {
        generatePowerUp();
    }
}

function generateFood() {
    do {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            type: Math.random() < 0.2 ? 'bonus' : 'normal'
        };
    } while (isPositionOccupied(food));
}

function generatePowerUp() {
    powerUpActive = true;
    do {
        powerUp = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount),
            type: Math.random() < 0.5 ? 'speed' : 'shrink'
        };
    } while (isPositionOccupied(powerUp));

    powerUpTimer = setTimeout(() => {
        powerUpActive = false;
    }, 5000);
}

function activatePowerUp() {
    if (soundToggle.checked) {
        sounds.powerUp.play();
    }
    clearTimeout(powerUpTimer);
    powerUpActive = false;

    if (powerUp.type === 'speed') {
        speed = Math.max(50, speed - 10);
        clearInterval(gameInterval);
        gameInterval = setInterval(updateGame, speed);
        setTimeout(() => {
            speed = Math.min(100, speed + 10);
            clearInterval(gameInterval);
            gameInterval = setInterval(updateGame, speed);
        }, 5000);
    } else if (powerUp.type === 'shrink') {
        const shrinkAmount = Math.min(3, Math.floor(snake.length / 2));
        snake = snake.slice(0, snake.length - shrinkAmount);
    }
}

function generateObstacles() {
    obstacles = [];
    const obstacleCount = Math.min(5, Math.floor(level / 2));
    for (let i = 0; i < obstacleCount; i++) {
        let obstacle;
        do {
            obstacle = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount),
                type: Math.random() < 0.3 ? 'moving' : 'static',
                direction: { x: Math.random() < 0.5 ? 1 : -1, y: 0 }
            };
        } while (isPositionOccupied(obstacle));
        obstacles.push(obstacle);
    }
}

function moveObstacles() {
    obstacles.forEach(obstacle => {