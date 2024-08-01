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
const obstacleTypes = ['rock', 'tree', 'wall'];

highScoreDisplay.textContent = highScore;

const sounds = {
    eat: new Audio('eat.mp3'),
    die: new Audio('die.mp3'),
    powerup: new Audio('powerup.mp3'),
    levelup: new Audio('levelup.mp3'),
    portal: new Audio('portal.mp3')
};

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('pauseButton').addEventListener('click', togglePause);
document.getElementById('restartButton').addEventListener('click', restartGame);
document.getElementById('playAgainButton').addEventListener('click', startGame);
document.getElementById('difficultySelect').addEventListener('change', adjustDifficulty);
document.getElementById('soundToggle').addEventListener('change', toggleSound);
document.getElementById('themeSelect').addEventListener('change', changeTheme);

document.addEventListener('keydown', changeDirection);

function startGame() {
    if (gameStarted) return;
    resetGame();
    gameInterval = setInterval(gameLoop, speed);
    gameStarted = true;
    isPaused = false;
    document.getElementById('gameOverModal').style.display = 'none';
}

function gameLoop() {
    if (isPaused) return;
    updateGameTime();
    moveSnake();
    checkCollisions();
    drawGame();
}

function resetGame() {
    snake = [{ x: tileCount / 2, y: tileCount / 2 }];
    direction = { x: 1, y: 0 };
    score = 0;
    level = 1;
    gameTime = 0;
    isPaused = false;
    generateFood();
    powerUps = [];
    obstacles = [];
    portals = [];
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, speed);
    updateUI();
}

function togglePause() {
    isPaused = !isPaused;
}

function restartGame() {
    gameStarted = false;
    clearInterval(gameInterval);
    startGame();
}

function adjustDifficulty() {
    const difficulty = document.getElementById('difficultySelect').value;
    switch (difficulty) {
        case 'easy':
            speed = 150;
            break;
        case 'medium':
            speed = 100;
            break;
        case 'hard':
            speed = 75;
            break;
        case 'extreme':
            speed = 50;
            break;
    }
    if (gameStarted) {
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, speed);
    }
}

function toggleSound() {
    const soundEnabled = document.getElementById('soundToggle').checked;
    for (const sound in sounds) {
        sounds[sound].muted = !soundEnabled;
    }
}

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    switch (theme) {
        case 'classic':
            document.body.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            break;
        case 'neon':
            document.body.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
            break;
        case 'retro':
            document.body.style.background = 'linear-gradient(135deg, #fc4a1a, #f7b733)';
            break;
    }
}

function changeDirection(event) {
    const key = event.key;
    if (key === 'ArrowUp' && direction.y === 0) {
        direction = { x: 0, y: -1 };
    } else if (key === 'ArrowDown' && direction.y === 0) {
        direction = { x: 0, y: 1 };
    } else if (key === 'ArrowLeft' && direction.x === 0) {
        direction = { x: -1, y: 0 };
    } else if (key === 'ArrowRight' && direction.x === 0) {
        direction = { x: 1, y: 0 };
    }
}

function moveSnake() {
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        eatFood();
    } else {
        snake.pop();
    }
}

function checkCollisions() {
    const head = snake[0];
    if (head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount) {
        endGame();
    }
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            endGame();
        }
    }
    // Check for collisions with power-ups, obstacles, and portals
    for (const powerUp of powerUps) {
        if (head.x === powerUp.x && head.y === powerUp.y) {
            activatePowerUp(powerUp.type);
            powerUps = powerUps.filter(p => p !== powerUp);
        }
    }
    for (const obstacle of obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            endGame();
        }
    }
    for (const portal of portals) {
        if (head.x === portal.x && head.y === portal.y) {
            teleportSnake(portal);
        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSnake();
    drawFood();
    drawPowerUps();
    drawObstacles();
    drawPortals();
}

function drawSnake() {
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? 'darkgreen' : 'lightgreen';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });
}

function drawFood() {
    ctx.fillStyle = food.type === 'normal' ? 'red' : food.type === 'bonus' ? 'blue' : food.type === 'golden' ? 'yellow' : 'purple';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.type === 'speed' ? 'orange' : powerUp.type === 'ghost' ? 'white' : powerUp.type === 'magnet' ? 'pink' : powerUp.type === 'shrink' ? 'cyan' : 'lime';
        ctx.fillRect(powerUp.x * gridSize, powerUp.y * gridSize, gridSize, gridSize);
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = 'brown';
        ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize, gridSize);
    });
}

function drawPortals() {
    portals.forEach(portal => {
        ctx.fillStyle = 'orange';
        ctx.fillRect(portal.x * gridSize, portal.y * gridSize, gridSize, gridSize);
    });
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
        type: foodTypes[Math.floor(Math.random() * foodTypes.length)]
    };
}

function eatFood() {
    score += food.type === 'normal' ? 10 : food.type === 'bonus' ? 20 : food.type === 'golden' ? 50 : -10;
    generateFood();
    updateUI();
    playSound('eat');
    if (score >= level * 100) {
        levelUp();
    }
}

function levelUp() {
    level++;
    playSound('levelup');
    // Increase game speed or add new obstacles/power-ups/portals
}

function playSound(sound) {
    sounds[sound].currentTime = 0;
    sounds[sound].play();
}

function updateGameTime() {
    gameTime++;
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    timeDisplay.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function updateUI() {
    scoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
    levelDisplay.textContent = level;
}

function endGame() {
    clearInterval(gameInterval);
    gameStarted = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalHighScore').textContent = highScore;
    document.getElementById('gameOverModal').style.display = 'block';
    playSound('die');
}

function activatePowerUp(type) {
    playSound('powerup');
    switch (type) {
        case 'speed':
            speed = Math.max(speed - 10, 50);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, speed);
            break;
        case 'ghost':
            // Implement ghost mode where snake can pass through walls and itself
            break;
        case 'magnet':
            // Implement magnet mode where food is attracted to the snake
            break;
        case 'shrink':
            // Implement shrink mode where snake temporarily shrinks in size
            break;
    }
}

function teleportSnake(portal) {
    playSound('portal');
    // Implement teleportation logic
}
