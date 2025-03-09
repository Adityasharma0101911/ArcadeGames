document.addEventListener('DOMContentLoaded', () => {
    console.log("Tetris initializing...");
    
    // Initialize particles.js
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#00ffff" },
            shape: { type: "square", stroke: { width: 0, color: "#000000" } },
            opacity: { value: 0.5, random: false },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#00ffff", opacity: 0.4, width: 1 },
            move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out", bounce: false }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" },
                resize: true
            },
            modes: {
                repulse: { distance: 100, duration: 0.4 },
                push: { particles_nb: 4 }
            }
        },
        retina_detect: true
    });

    // Get the canvas and context
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const nextPieceCanvas = document.getElementById('nextPiece');
    const nextPieceContext = nextPieceCanvas.getContext('2d');
    const nextPiece2Canvas = document.getElementById('nextPiece2');
    const nextPiece2Context = nextPiece2Canvas.getContext('2d');
    const nextPiece3Canvas = document.getElementById('nextPiece3');
    const nextPiece3Context = nextPiece3Canvas.getContext('2d');
    const holdPieceCanvas = document.getElementById('holdPiece');
    const holdPieceContext = holdPieceCanvas.getContext('2d');
    
    // Set canvas dimensions based on container size
    function resizeCanvas() {
        console.log("Resizing canvas...");
        const gameContainer = document.querySelector('.main-game');
        const containerWidth = gameContainer.clientWidth;
        const containerHeight = gameContainer.clientHeight;
        
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        
        // Scale based on container size while maintaining aspect ratio
        // Use a 12:20 grid (standard Tetris board is 10:20, but we have 12 width)
        const gridWidth = 12;
        const gridHeight = 20;
        const blockSize = Math.min(
            containerWidth / gridWidth,
            containerHeight / gridHeight
        );
        
        // Reset transform and set new scale
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(blockSize, blockSize);
        
        // Center the game board horizontally
        const xOffset = (containerWidth / blockSize - gridWidth) / 2;
        if (xOffset > 0) {
            context.translate(xOffset, 0);
        }
        
        console.log("Canvas resized to:", containerWidth, "x", containerHeight, "with blockSize:", blockSize);
    }
    
    
    // Call resize on load and window resize
    resizeCanvas();
    window.addEventListener('resize', () => {
        context.setTransform(1, 0, 0, 1, 0, 0); // Reset scale
        resizeCanvas();
    });
    
    // Set scale for preview canvases
    nextPieceContext.scale(20, 20);
    nextPiece2Context.scale(16, 16);
    nextPiece3Context.scale(12, 12);
    holdPieceContext.scale(20, 20);
    
    // Game variables
    let dropCounter = 0;
    let dropInterval = 1000; // 1 second
    let lastTime = 0;
    let paused = true;
    let gameOver = false;
    let score = 0;
    let level = 1;
    let lines = 0;
    let combo = 0;
    let holdPiece = null;
    let canHold = true;
    let animatingClear = false;
    let animatingLevel = false;
    let animationRows = [];
    let gameStarted = false;
    let soundEnabled = true;
    let pieceQueue = [];
    let lastTap = 0; // For mobile double tap detection
    
    // DOM elements
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const comboElement = document.getElementById('combo');
    const startButton = document.getElementById('start-button');
    const soundButton = document.getElementById('sound-button');
    const pauseIndicator = document.getElementById('pauseIndicator');
    const gameOverIndicator = document.getElementById('gameOverIndicator');
    const levelUpIndicator = document.getElementById('levelUpIndicator');
    const comboIndicator = document.getElementById('comboIndicator');
    const tetrisIndicator = document.getElementById('tetrisIndicator');
    const perfectClearIndicator = document.getElementById('perfectClear');
    const countdownElement = document.getElementById('countdown');
    const confettiContainer = document.getElementById('confetti-container');
    
    // Mobile control buttons
    const mobileLeft = document.getElementById('mobile-left');
    const mobileRight = document.getElementById('mobile-right');
    const mobileRotate = document.getElementById('mobile-rotate');
    const mobileDown = document.getElementById('mobile-down');
    const mobileDrop = document.getElementById('mobile-drop');
    const mobileHold = document.getElementById('mobile-hold');
    
    // Tetris pieces
    const pieces = [
        // T piece
        [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        // O piece
        [
            [2, 2],
            [2, 2],
        ],
        // L piece
        [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ],
        // J piece
        [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ],
        // I piece
        [
            [0, 0, 0, 0],
            [5, 5, 5, 5],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        // S piece
        [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ],
        // Z piece
        [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ],
    ];
    
    // Colors
    const colors = [
        null,
        '#FF0D72', // T - pink
        '#0DC2FF', // O - light blue
        '#0DFF72', // L - light green
        '#F538FF', // J - purple
        '#FF8E0D', // I - orange
        '#FFE138', // S - yellow
        '#FF0000'  // Z - red
    ];
    
    // Create player
    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        score: 0,
        ghostPos: { x: 0, y: 0 }
    };
    
    // Sounds (creating placeholders - in a real game you'd load actual sounds)
    const sounds = {
        move: { play: () => {}, currentTime: 0 },
        rotate: { play: () => {}, currentTime: 0 },
        drop: { play: () => {}, currentTime: 0 },
        clear: { play: () => {}, currentTime: 0 },
        tetris: { play: () => {}, currentTime: 0 },
        levelUp: { play: () => {}, currentTime: 0 },
        gameOver: { play: () => {}, currentTime: 0 },
        hold: { play: () => {}, currentTime: 0 },
        combo: { play: () => {}, currentTime: 0 },
        perfect: { play: () => {}, currentTime: 0 }
    };
    
    // Create the arena (playing field)
    const arena = createMatrix(12, 20);
    
    // Functions
    
    function createMatrix(w, h) {
        console.log(`Creating matrix ${w}x${h}`);
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }
    
    function createPiece(type) {
        console.log(`Creating piece type ${type}`);
        return JSON.parse(JSON.stringify(pieces[type]));
    }
    
    // Initialize pieceQueue with random pieces
    function initPieceQueue() {
        console.log("Initializing piece queue");
        pieceQueue = [];
        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * pieces.length);
            const newPiece = createPiece(randomIndex);
            pieceQueue.push(newPiece);
        }
        console.log("Piece queue initialized with length:", pieceQueue.length);
    }
    
    // Function to get next piece from queue and add a new one
    function getNextPiece() {
        if (pieceQueue.length === 0) {
            console.warn("Piece queue is empty, reinitializing...");
            initPieceQueue();
        }
        
        const nextPiece = pieceQueue.shift();
        console.log("Getting next piece:", nextPiece);
        
        // Generate a new piece for the queue
        const randomIndex = Math.floor(Math.random() * pieces.length);
        pieceQueue.push(createPiece(randomIndex));
        
        return nextPiece;
    }
    
    function createConfetti(count = 50) {
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random properties
            const size = Math.random() * 8 + 6;
            const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
            const left = Math.random() * 100;
            const animDuration = Math.random() * 3 + 2;
            
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.backgroundColor = color;
            confetti.style.left = `${left}%`;
            confetti.style.animationDuration = `${animDuration}s`;
            
            confettiContainer.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                confetti.remove();
            }, animDuration * 1000);
        }
    }
    
    function playSound(soundName) {
        if (soundEnabled) {
            try {
                sounds[soundName].currentTime = 0;
                sounds[soundName].play();
            } catch (e) {
                console.log("Sound not loaded yet");
            }
        }
    }
    
    function draw() {
        // Clear the canvas
        context.fillStyle = '#000';
        context.fillRect(
            -1, // Add extra space for grid
            0, 
            canvas.width / context.getTransform().a + 2, // Add extra space for grid
            canvas.height / context.getTransform().d
        );
        
        // Draw grid lines
        context.strokeStyle = '#333';
        context.lineWidth = 0.02;
        
        // Vertical grid lines
        for (let x = 0; x <= arena[0].length; x++) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, arena.length);
            context.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 0; y <= arena.length; y++) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(arena[0].length, y);
            context.stroke();
        }
        
        // Draw the arena (placed pieces)
        drawMatrix(arena, { x: 0, y: 0 }, context);
        
        // Draw the ghost piece
        if (!paused && !gameOver && !animatingClear && gameStarted && player.matrix) {
            drawGhost();
        }
        
        // Draw animation for line clear if active
        if (animatingClear) {
            drawClearAnimation();
        } else if (gameStarted && player.matrix) {
            // Draw the player's current piece if not animating and it exists
            drawMatrix(player.matrix, player.pos, context);
        }
        
        // Draw the next pieces
        drawNextPieces();
        
        // Draw the hold piece
        drawHoldPiece();
        
        // Update UI
        updateGameUI();
    }

    function drawNextPieces() {
        // Clear next piece canvases
        nextPieceContext.fillStyle = '#000';
        nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        
        nextPiece2Context.fillStyle = '#000';
        nextPiece2Context.fillRect(0, 0, nextPiece2Canvas.width, nextPiece2Canvas.height);
        
        nextPiece3Context.fillStyle = '#000';
        nextPiece3Context.fillRect(0, 0, nextPiece3Canvas.width, nextPiece3Canvas.height);
        
        // Draw pieces if they exist
        if (pieceQueue.length >= 1) {
            const offsetX = (5 - pieceQueue[0][0].length) / 2;
            const offsetY = (5 - pieceQueue[0].length) / 2;
            drawMatrix(pieceQueue[0], { x: offsetX, y: offsetY }, nextPieceContext);
        }
        
        if (pieceQueue.length >= 2) {
            const offsetX = (5 - pieceQueue[1][0].length) / 2;
            const offsetY = (5 - pieceQueue[1].length) / 2;
            drawMatrix(pieceQueue[1], { x: offsetX, y: offsetY }, nextPiece2Context);
        }
        
        if (pieceQueue.length >= 3) {
            const offsetX = (5 - pieceQueue[2][0].length) / 2;
            const offsetY = (5 - pieceQueue[2].length) / 2;
            drawMatrix(pieceQueue[2], { x: offsetX, y: offsetY }, nextPiece3Context);
        }
    }
    
    function drawHoldPiece() {
        holdPieceContext.fillStyle = '#000';
        holdPieceContext.fillRect(0, 0, holdPieceCanvas.width, holdPieceCanvas.height);
        
        if (holdPiece) {
            const offsetX = (5 - holdPiece[0].length) / 2;
            const offsetY = (5 - holdPiece.length) / 2;
            
            // Draw with reduced opacity if can't hold
            if (!canHold) {
                holdPieceContext.globalAlpha = 0.5;
                drawMatrix(holdPiece, { x: offsetX, y: offsetY }, holdPieceContext);
                holdPieceContext.globalAlpha = 1.0;
            } else {
                drawMatrix(holdPiece, { x: offsetX, y: offsetY }, holdPieceContext);
            }
        }
    }
    
    function updateGameUI() {
        // Update overlay displays
        if (paused && !gameOver && gameStarted) {
            pauseIndicator.style.display = 'block';
        } else {
            pauseIndicator.style.display = 'none';
        }
        
        if (gameOver) {
            gameOverIndicator.style.display = 'block';
        } else {
            gameOverIndicator.style.display = 'none';
        }
    }
    
    function drawMatrix(matrix, offset, ctx) {
        if (!matrix) {
            console.error("Attempted to draw null or undefined matrix");
            return;
        }
        
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    // Fill the main color
                    ctx.fillStyle = colors[value];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    
                    // Add white highlight to the top-left
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.fillRect(x + offset.x, y + offset.y, 0.3, 0.3);
                    
                    // Add dark shadow to the bottom-right
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fillRect(x + offset.x + 0.7, y + offset.y + 0.7, 0.3, 0.3);
                    
                    // Add grid lines
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            });
        });
    }
    
    function drawGhost() {
        // Calculate ghost position (where the piece would land)
        calculateGhostPosition();
        
        // Draw the ghost piece with transparency
        context.globalAlpha = 0.2;
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = colors[value];
                    context.fillRect(x + player.ghostPos.x, y + player.ghostPos.y, 1, 1);
                    
                    // Add grid lines
                    context.strokeStyle = colors[value];
                    context.lineWidth = 0.05;
                    context.strokeRect(x + player.ghostPos.x, y + player.ghostPos.y, 1, 1);
                }
            });
        });
        context.globalAlpha = 1.0;
    }
    
    function calculateGhostPosition() {
        player.ghostPos.x = player.pos.x;
        player.ghostPos.y = player.pos.y;
        
        while (!collide(arena, { pos: { x: player.ghostPos.x, y: player.ghostPos.y + 1 }, matrix: player.matrix })) {
            player.ghostPos.y++;
        }
    }
    
    function drawClearAnimation() {
        // Animate each row being cleared
        animationRows.forEach(rowIndex => {
            const scale = 1 - ((Date.now() - rowIndex.startTime) / 500);
            if (scale > 0) {
                context.fillStyle = '#FFF';
                for (let x = 0; x < arena[0].length; x++) {
                    context.fillRect(x, rowIndex.y, 1, scale);
                }
            }
        });
    }
    
    function merge(arena, player) {
        if (!player.matrix) {
            console.error("Cannot merge null player matrix");
            return;
        }
        
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
        
        playSound('drop');
    }
    
    function rotate(matrix, dir) {
        if (!matrix) {
            console.error("Cannot rotate null matrix");
            return;
        }
        
        // Transpose the matrix
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }
        
        // Reverse each row to rotate
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
        
        playSound('rotate');
    }
    
    function playerDrop() {
        if (!player.matrix) {
            console.error("Cannot drop null player matrix");
            return;
        }
        
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }
    
    function playerHardDrop() {
        if (!player.matrix) {
            console.error("Cannot hard drop null player matrix");
            return;
        }
        
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        dropCounter = 0;
        
        // Add extra points for hard drop
        player.score += (player.ghostPos.y - player.pos.y) * 2;
        updateScore();
    }
    
    function playerMove(offset) {
        if (!player.matrix) {
            console.error("Cannot move null player matrix");
            return;
        }
        
        player.pos.x += offset;
        if (collide(arena, player)) {
            player.pos.x -= offset;
        } else {
            playSound('move');
        }
    }
    
    function playerReset() {
        console.log("Resetting player with piece queue length:", pieceQueue.length);
        
        // Ensure pieceQueue has pieces
        if (pieceQueue.length === 0) {
            console.warn("Piece queue is empty during reset, reinitializing...");
            initPieceQueue();
        }
        
        // Get the next piece from queue
        player.matrix = getNextPiece();
        console.log("New player piece:", player.matrix);
        
        // Position the piece at the top center
        player.pos.y = 0;
        player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
        
        // Reset hold flag
        canHold = true;
        
        // Check if the game is over
        if (collide(arena, player)) {
            console.log("Game over detected");
            gameOver = true;
        // Add this code in the playerReset function in tetris.js right after gameOver = true
        if (gameOver) {
            console.log("Game over, dispatching event with score:", player.score);
            // Create a custom event to notify about game over
            const gameOverEvent = new CustomEvent('gameOver', {
                detail: {
                    score: player.score
                }
            });
            window.dispatchEvent(gameOverEvent);
        }            
            paused = true;
            gameStarted = false;
            startButton.innerHTML = '<i class="fas fa-redo"></i> RESTART';
            gameOverIndicator.style.display = 'block';
            playSound('gameOver');
            
            // Reset combo
            combo = 0;
            updateScore();
        }
    }
    
    
    function playerRotate(dir) {
        if (!player.matrix) {
            console.error("Cannot rotate null player matrix");
            return;
        }
        
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        
        // Handle collision during rotation
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }
    
    function playerHold() {
        if (!canHold || paused || gameOver || !player.matrix) {
            console.log("Hold not available:", { canHold, paused, gameOver, hasMatrix: !!player.matrix });
            return;
        }
        
        if (holdPiece === null) {
            // First time holding a piece
            holdPiece = player.matrix;
            
            // Get new piece from queue
            player.matrix = getNextPiece();
        } else {
            // Swap with existing hold piece
            const temp = player.matrix;
            player.matrix = holdPiece;
            holdPiece = temp;
        }
        
        // Reset position
        player.pos.y = 0;
        player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
        
        // Set hold cooldown
        canHold = false;
        playSound('hold');
    }
    
    function collide(arena, player) {
        if (!player.matrix) {
            console.error("Cannot check collision with null player matrix");
            return false;
        }
        
        const m = player.matrix;
        const o = player.pos;
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && 
                    (arena[y + o.y] === undefined || 
                     arena[y + o.y][x + o.x] === undefined || 
                     arena[y + o.y][x + o.x] !== 0)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function arenaSweep() {
        let rowCount = 0;
        const rowsToRemove = [];
        
        // Find completed rows
        for (let y = arena.length - 1; y >= 0; --y) {
            let rowFilled = true;
            
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    rowFilled = false;
                    break;
                }
            }
            
            if (rowFilled) {
                rowsToRemove.push({
                    y: y,
                    startTime: Date.now()
                });
                rowCount++;
            }
        }
        
        if (rowCount > 0) {
            console.log(`Clearing ${rowCount} rows`);
            
            // Start animation
            animatingClear = true;
            animationRows = rowsToRemove;
            
            // Play sound based on number of rows cleared
            if (rowCount === 4) {
                playSound('tetris');
                tetrisIndicator.style.display = 'block';
                setTimeout(() => {
                    tetrisIndicator.style.display = 'none';
                }, 1500);
            } else {
                playSound('clear');
            }
            
            // After a delay, remove the rows and continue
            setTimeout(() => {
                // IMPORTANT FIX: Create a copy of the rows to remove to prevent issues
                const rowIndices = rowsToRemove.map(row => row.y).sort((a, b) => b - a); // Sort in descending order
                
                // Remove the completed rows one by one from bottom to top
                rowIndices.forEach(y => {
                    arena.splice(y, 1);
                    // Add a new empty row at the top
                    arena.unshift(new Array(arena[0].length).fill(0));
                });
                
                // Update combo
                combo++;
                comboElement.textContent = combo;
                
                if (combo > 1) {
                    comboIndicator.textContent = `${combo}x COMBO!`;
                    comboIndicator.style.display = 'block';
                    setTimeout(() => {
                        comboIndicator.style.display = 'none';
                    }, 1000);
                    playSound('combo');
                }
                
                // Check for perfect clear
                const isPerfectClear = arena.every(row => row.some(cell => cell === 0));
                if (isPerfectClear) {
                    player.score += 800 * level;
                    perfectClearIndicator.style.display = 'block';
                    createConfetti(100);
                    playSound('perfect');
                    setTimeout(() => {
                        perfectClearIndicator.style.display = 'none';
                    }, 2000);
                }
                
                // Update lines and level
                const oldLevel = level;
                lines += rowCount;
                level = Math.floor(lines / 10) + 1;
                
                // Check for level up
                if (level > oldLevel) {
                    animatingLevel = true;
                    levelUpIndicator.style.display = 'block';
                    createConfetti(50);
                    playSound('levelUp');
                    
                    setTimeout(() => {
                        animatingLevel = false;
                        levelUpIndicator.style.display = 'none';
                    }, 2000);
                }
                
                dropInterval = 1000 * Math.pow(0.8, level - 1);
                
                // Award points based on the number of rows cleared
                const lineScores = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
                const baseScore = lineScores[rowCount] * level;
                // Add combo bonus
                const comboBonus = combo > 1 ? (combo - 1) * 50 : 0;
                player.score += baseScore + comboBonus;
                
                // End animation
                animatingClear = false;
                animationRows = [];
                
                updateScore();
            }, 500); // Animation duration
        } else {
            // Reset combo if no lines were cleared
            combo = 0;
            comboElement.textContent = combo;
            updateScore();
        }
    }
    
    function updateScore() {
        score = player.score;
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = lines;
        comboElement.textContent = combo;
    }
    
    function startCountdown(callback) {
        let count = 3;
        countdownElement.textContent = count;
        countdownElement.style.display = 'block';
        
        console.log("Starting countdown...");
        
        const countInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownElement.textContent = count;
                countdownElement.style.animation = 'none';
                void countdownElement.offsetWidth; // Trigger reflow
                countdownElement.style.animation = 'countdownAnim 1s ease-in-out';
            } else {
                clearInterval(countInterval);
                countdownElement.textContent = "GO!";
                setTimeout(() => {
                    countdownElement.style.display = 'none';
                    console.log("Countdown complete, executing callback");
                    callback();
                }, 800);
            }
        }, 1000);
    }
    
    function update(time = 0) {
        const deltaTime = time - lastTime;
        
        // Only drop pieces if we're playing (game started, not paused or game over)
        if (!paused && !gameOver && !animatingClear && gameStarted) {
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
        }
        
        lastTime = time;
        draw();
        requestAnimationFrame(update);
    }
    
    function startGame() {
        console.log("Starting game...");
        
        if (gameOver) {
            init();
        }
        
        // Always ensure we have a filled piece queue
        if (pieceQueue.length === 0) {
            console.log("Empty piece queue, initializing...");
            initPieceQueue();
        }
        
        startCountdown(() => {
            console.log("Game starting after countdown");
            gameStarted = true;
            paused = false;
            
            // Ensure player has a valid piece after countdown
            if (!player.matrix) {
                console.log("No player matrix, getting new piece");
                player.matrix = getNextPiece();
                player.pos.y = 0;
                player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
            }
            
            startButton.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
            console.log("Game started:", { 
                gameStarted, 
                paused, 
                playerMatrix: !!player.matrix,
                pieceQueueLength: pieceQueue.length 
            });
        });
    }
    
    function init() {
        console.log("Initializing game...");
        
        // Initialize or reset game
        player.score = 0;
        score = 0;
        lines = 0;
        level = 1;
        combo = 0;
        holdPiece = null;
        canHold = true;
        animatingClear = false;
        animatingLevel = false;
        gameOver = false;
        dropInterval = 1000;
        
        // Clear the arena
        for (let y = 0; y < arena.length; y++) {
            arena[y].fill(0);
        }
        
        // Initialize piece queue
        pieceQueue = []; // Ensure we start with an empty queue
        initPieceQueue();
        
        // Get the first piece
        player.matrix = getNextPiece();
        
        // Position the piece
        player.pos.y = 0;
        player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
        
        // Reset UI
        startButton.innerHTML = '<i class="fas fa-play"></i> START';
        gameOverIndicator.style.display = 'none';
        pauseIndicator.style.display = 'none';
        levelUpIndicator.style.display = 'none';
        tetrisIndicator.style.display = 'none';
        comboIndicator.style.display = 'none';
        perfectClearIndicator.style.display = 'none';
        
        // Set default game state
        gameStarted = false;
        paused = true;
        
        // Update the score display
        updateScore();
        
        console.log("Game initialized:", {
            pieceQueueLength: pieceQueue.length,
            hasPlayerMatrix: !!player.matrix,
            playerMatrixDimensions: player.matrix ? `${player.matrix.length}x${player.matrix[0].length}` : 'none'
        });
    }
    
    // Keyboard input event listeners
    document.addEventListener('keydown', event => {
        if (animatingClear) return; // Prevent input during animations
        
        if (event.keyCode === 80) { // P key - Pause
            if (!gameOver && gameStarted) {
                paused = !paused;
                startButton.innerHTML = paused ? '<i class="fas fa-play"></i> START' : '<i class="fas fa-pause"></i> PAUSE';
            }
            return;
        }
        
        if (paused || gameOver || !gameStarted) return;
        
        switch (event.keyCode) {
            case 37: // Left arrow
                playerMove(-1);
                break;
            case 39: // Right arrow
                playerMove(1);
                break;
            case 40: // Down arrow
                playerDrop();
                break;
            case 38: // Up arrow
                playerRotate(1);
                break;
            case 32: // Space bar
                playerHardDrop();
                break;
            case 67: // C key - Hold piece
                playerHold();
                break;
        }
    });
    
    // Button event listeners
    startButton.addEventListener('click', () => {
        console.log("Start button clicked. Game state:", { gameOver, gameStarted });
        
        if (gameOver || !gameStarted) {
            startGame();
        } else {
            paused = !paused;
            startButton.innerHTML = paused ? 
                '<i class="fas fa-play"></i> START' : 
                '<i class="fas fa-pause"></i> PAUSE';
        }
    });
    
    soundButton.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundButton.innerHTML = soundEnabled ? 
            '<i class="fas fa-volume-up"></i>' : 
            '<i class="fas fa-volume-mute"></i>';
    });
    
    // Mobile controls
    mobileLeft.addEventListener('click', () => {
        if (!paused && !gameOver && gameStarted && !animatingClear) {
            playerMove(-1);
        }
    });
    
    mobileRight.addEventListener('click', () => {
        if (!paused && !gameOver && gameStarted && !animatingClear) {
            playerMove(1);
        }
    });
    
    mobileRotate.addEventListener('click', () => {
        if (!paused && !gameOver && gameStarted && !animatingClear) {
            playerRotate(1);
        }
    });
    
    mobileDown.addEventListener('click', () => {
        if (!paused && !gameOver && gameStarted && !animatingClear) {
            playerDrop();
        }
    });
    
    mobileDrop.addEventListener('click', () => {
        if (!paused && !gameOver && gameStarted && !animatingClear) {
            playerHardDrop();
        }
    });
    
    mobileHold.addEventListener('click', () => {
        if (!paused && !gameOver && gameStarted && !animatingClear) {
            playerHold();
        }
    });
    
    // Touch controls for mobile
    let touchStartX = null;
    let touchStartY = null;
    
    canvas.addEventListener('touchstart', event => {
        if (paused || gameOver || !gameStarted) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        event.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', event => {
        if (paused || gameOver || !gameStarted || !touchStartX || !touchStartY) return;
        
        const touchX = event.touches[0].clientX;
        const touchY = event.touches[0].clientY;
        
        const diffX = touchX - touchStartX;
        const diffY = touchY - touchStartY;
        
        // Horizontal swipe detection
        if (Math.abs(diffX) > 30) {
            if (diffX > 0) {
                playerMove(1); // Move right
            } else {
                playerMove(-1); // Move left
            }
            touchStartX = touchX;
            touchStartY = touchY;
        }
        
        // Vertical swipe detection
        if (diffY > 30) {
            playerDrop(); // Soft drop
            touchStartY = touchY;
        }
        
        event.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', event => {
        // Double tap detection for rotation
        if (event.touches.length === 0 && event.changedTouches.length === 1) {
            const now = Date.now();
            if (now - lastTap < 300) {
                playerRotate(1);
            }
            lastTap = now;
        }
        
        touchStartX = null;
        touchStartY = null;
    });
    
    // Initialize the game
    init();
    
    // Start the game loop
    update();
    
    console.log("Game setup complete");
});