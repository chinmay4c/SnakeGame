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
function createParticleEffect(x, y, color) {
    const particles = [];
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 4 + 1,
            color: color,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            life: Math.random() * 100
        });
    }
    return particles;
}

function updateParticles(particles) {
    particles.forEach((particle, index) => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life -= 1;
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
}

function drawParticles(particles) {
    particles.forEach(particle => {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.fill();
    });
}

let particles = [];

function triggerParticleEffect(x, y, color) {
    particles.push(...createParticleEffect(x, y, color));
}

// Add score multiplier for quick successive actions
let lastActionTime = 0;
let actionStreak = 0;
const streakDuration = 2000; // 2 seconds for streak

function updateScore(action) {
    const now = Date.now();
    if (now - lastActionTime < streakDuration) {
        actionStreak++;
    } else {
        actionStreak = 1;
    }
    lastActionTime = now;
    score += action * actionStreak;
    document.getElementById('score').textContent = score;
}

// Add new game modes
const gameModes = {
    'classic': {
        description: 'Classic snake game mode.',
        speed: 200
    },
    'speedrun': {
        description: 'Try to score as much as possible in limited time.',
        speed: 100,
        timeLimit: 60000 // 1 minute
    },
    'survival': {
        description: 'Endless game mode with increasing speed.',
        speed: 300,
        speedIncrement: 10
    }
};

let currentGameMode = 'classic';

function setGameMode(mode) {
    if (gameModes[mode]) {
        currentGameMode = mode;
        // Update UI to reflect game mode changes
        document.getElementById('gameModeDescription').textContent = gameModes[mode].description;
    }
}

function updateGameSpeed() {
    gameSpeed = gameModes[currentGameMode].speed;
    if (currentGameMode === 'survival') {
        gameSpeed -= Math.floor(score / 100) * gameModes[currentGameMode].speedIncrement;
    }
}

// Implement power-up effects
const powerUps = {
    'slowdown': {
        description: 'Slows down the game for 10 seconds.',
        duration: 10000,
        effect: function() {
            gameSpeed /= 2;
            setTimeout(() => {
                gameSpeed *= 2;
            }, this.duration);
        }
    },
    'doublePoints': {
        description: 'Double points for 10 seconds.',
        duration: 10000,
        effect: function() {
            let originalUpdateScore = updateScore;
            updateScore = function(action) {
                originalUpdateScore(action * 2);
            };
            setTimeout(() => {
                updateScore = originalUpdateScore;
            }, this.duration);
        }
    }
};

let activePowerUp = null;

function applyPowerUp(powerUpType) {
    if (powerUps[powerUpType]) {
        activePowerUp = powerUpType;
        powerUps[powerUpType].effect();
        document.getElementById('powerUpStatus').textContent = `Active Power-Up: ${powerUps[powerUpType].description}`;
        setTimeout(() => {
            activePowerUp = null;
            document.getElementById('powerUpStatus').textContent = '';
        }, powerUps[powerUpType].duration);
    }
}

// Add achievements
const achievements = [
    { id: 1, description: 'Score 100 points', achieved: false },
    { id: 2, description: 'Score 500 points', achieved: false },
    { id: 3, description: 'Collect 5 power-ups', achieved: false }
];

function checkAchievements() {
    achievements.forEach(achievement => {
        if (!achievement.achieved) {
            if (achievement.id === 1 && score >= 100) {
                achievement.achieved = true;
            } else if (achievement.id === 2 && score >= 500) {
                achievement.achieved = true;
            } else if (achievement.id === 3 && collectedPowerUps >= 5) {
                achievement.achieved = true;
            }
            if (achievement.achieved) {
                document.getElementById('achievementList').innerHTML += `<li>${achievement.description}</li>`;
                triggerParticleEffect(canvas.width / 2, canvas.height / 2, '#FFD700');
            }
        }
    });
}

// Add event listeners for game mode selection
document.querySelectorAll('.game-mode-button').forEach(button => {
    button.addEventListener('click', (event) => {
        setGameMode(event.target.dataset.mode);
        resetGame();
    });
});

// Main game loop enhancements
function gameLoop() {
    // Existing game loop code...

    // Update particles
    updateParticles(particles);
    drawParticles(particles);

    // Check achievements
    checkAchievements();

    requestAnimationFrame(gameLoop);
}

// Initialize the game
function initGame() {
    // Existing initialization code...

    // Add additional UI elements
    document.getElementById('gameModeDescription').textContent = gameModes[currentGameMode].description;
    document.getElementById('powerUpStatus').textContent = '';

    gameLoop();
}

initGame();
