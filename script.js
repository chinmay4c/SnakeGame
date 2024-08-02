document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const levelElement = document.getElementById('level');
    const timeElement = document.getElementById('time');
    const gameOverModal = document.getElementById('gameOverModal');
    const finalScoreElement = document.getElementById('finalScore');
    const finalHighScoreElement = document.getElementById('finalHighScore');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const restartButton = document.getElementById('restartButton');
    const playAgainButton = document.getElementById('playAgainButton');
    const difficultySelect = document.getElementById('difficultySelect');
    const soundToggle = document.getElementById('soundToggle');
    const themeSelect = document.getElementById('themeSelect');
    
    const gridSize = 20;
    let snake = [{ x: 200, y: 200 }];
    let direction = { x: 0, y: 0 };
    let food = { x: 300, y: 300 };
    let score = 0;
    let highScore = localStorage.getItem('highScore') || 0;
    let level = 1;
    let time = 0;
    let intervalId;
    let gameSpeed = 100;

    function startGame() {
        resetGame();
        intervalId = setInterval(update, gameSpeed);
    }

    function pauseGame() {
        clearInterval(intervalId);
    }

    function restartGame() {
        resetGame();
        intervalId = setInterval(update, gameSpeed);
    }

    function resetGame() {
        clearInterval(intervalId);
        snake = [{ x: 200, y: 200 }];
        direction = { x: 0, y: 0 };
        score = 0;
        level = 1;
        time = 0;
        spawnFood();
        updateScore();
        updateHighScore();
        updateLevel();
        updateTime();
        closeModal();
    }

    function update() {
        moveSnake();
        checkCollision();
        checkFood();
        draw();
        updateTime();
    }

    function moveSnake() {
        const head = { x: snake[0].x + direction.x * gridSize, y: snake[0].y + direction.y * gridSize };
        snake.unshift(head);
        snake.pop();
    }

    function checkCollision() {
        const head = snake[0];

        if (head.x < 0 || head.y < 0 || head.x >= canvas.width || head.y >= canvas.height || snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
        }
    }

    function checkFood() {
        const head = snake[0];

        if (head.x === food.x && head.y === food.y) {
            snake.push({ ...head });
            score += 10;
            spawnFood();
            updateScore();
            levelUp();
        }
    }

    function levelUp() {
        if (score % 50 === 0) {
            level++;
            updateLevel();
            gameSpeed -= 10;
            clearInterval(intervalId);
            intervalId = setInterval(update, gameSpeed);
        }
    }

    function spawnFood() {
        food = {
            x: Math.floor(Math.random() * canvas.width / gridSize) * gridSize,
            y: Math.floor(Math.random() * canvas.height / gridSize) * gridSize,
        };
    }

    function updateScore() {
        scoreElement.textContent = score;
    }

    function updateHighScore() {
        highScoreElement.textContent = highScore;
    }

    function updateLevel() {
        levelElement.textContent = level;
    }

    function updateTime() {
        time++;
        const minutes = String(Math.floor(time / 600)).padStart(2, '0');
        const seconds = String(Math.floor((time % 600) / 10)).padStart(2, '0');
        timeElement.textContent = `${minutes}:${seconds}`;
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawSnake();
        drawFood();
    }

    function drawSnake() {
        ctx.fillStyle = '#FFD700';
        snake.forEach(segment => ctx.fillRect(segment.x, segment.y, gridSize, gridSize));
    }

    function drawFood() {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(food.x, food.y, gridSize, gridSize);
    }

    function gameOver() {
        clearInterval(intervalId);
        finalScoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        finalHighScoreElement.textContent = highScore;
        openModal();
    }

    function openModal() {
        gameOverModal.style.display = 'block';
    }

    function closeModal() {
        gameOverModal.style.display = 'none';
    }

    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
                if (direction.y === 0) direction = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
                if (direction.y === 0) direction = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
                if (direction.x === 0) direction = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
                if (direction.x === 0) direction = { x: 1, y: 0 };
                break;
        }
    });

    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', pauseGame);
    restartButton.addEventListener('click', restartGame);
    playAgainButton.addEventListener('click', restartGame);

    // Load high score on page load
    highScoreElement.textContent = highScore;
});
