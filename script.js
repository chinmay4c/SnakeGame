const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreDisplay = document.getElementById('score');

const gridSize = 30;
const canvasSize = 600;
const tileCount = canvasSize / gridSize;

let snake = [];
let food = {};
let direction = { x: 1, y: 0 };
let speed = 100;
let gameInterval;
let score = 0;

startButton.addEventListener('click', startGame);
document.addEventListener('keydown', changeDirection);

function startGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    score = 0;
    updateScore();
    generateFood();
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, speed);
}

function updateGame() {
    moveSnake();
    if (checkCollision()) {
        clearInterval(gameInterval);
        alert('Game Over!');
        return;
    }
    if (checkFoodCollision()) {
        growSnake();
        generateFood();
        increaseSpeed();
        updateScore();
    }
    drawGame();
}

function drawGame() {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawSnake();
    drawFood();
}

function drawSnake() {
    ctx.fillStyle = '#32CD32';
    snake.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
    });
}

function drawFood() {
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function moveSnake() {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    snake.unshift(head);
    snake.pop();
}

function changeDirection(event) {
    const keyPressed = event.keyCode;
    const directions = {
        37: { x: -1, y: 0 }, // left arrow
        38: { x: 0, y: -1 }, // up arrow
        39: { x: 1, y: 0 },  // right arrow
        40: { x: 0, y: 1 }   // down arrow
    };
    if (directions[keyPressed] && (directions[keyPressed].x !== -direction.x && directions[keyPressed].y !== -direction.y)) {
        direction = directions[keyPressed];
    }
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
    return false;
}

function checkFoodCollision() {
    const head = snake[0];
    return head.x === food.x && head.y === food.y;
}

function growSnake() {
    const tail = snake[snake.length - 1];
    snake.push({ x: tail.x, y: tail.y });
    score += 10;
}

function increaseSpeed() {
    if (speed > 50) {
        speed -= 5;
        clearInterval(gameInterval);
        gameInterval = setInterval(updateGame, speed);
    }
}

function updateScore() {
    scoreDisplay.textContent = score;
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
}
