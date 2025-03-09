// Simple Connect Four Game
document.addEventListener('DOMContentLoaded', function() {
    // Game constants
    const ROWS = 6;
    const COLS = 7;
    const EMPTY = 0;
    const PLAYER_1 = 1;
    const PLAYER_2 = 2;
    
    // Game state
    let currentPlayer = PLAYER_1;
    let gameActive = true;
    let gameMode = 'local'; // 'local', 'ai', or 'online'
    let aiDifficulty = 'medium'; // 'easy', 'medium', or 'hard'
    let board = [];
    
    // DOM Elements
    const gameBoard = document.getElementById('game-board');
    const gameStatus = document.getElementById('game-status');
    const player1Info = document.getElementById('player1-info');
    const player2Info = document.getElementById('player2-info');
    const resetButton = document.getElementById('reset-game');
    const undoButton = document.getElementById('undo-move');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    
    // Initialize the game
    function initGame(mode = 'local', difficulty = 'medium') {
        console.log("Initializing game:", mode, difficulty);
        
        // Set game mode and difficulty
        gameMode = mode;
        aiDifficulty = difficulty;
        
        // Reset game state
        currentPlayer = PLAYER_1;
        gameActive = true;
        
        // Create the board - a 2D array filled with zeros (empty)
        board = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
        
        // Create the HTML board if it doesn't exist yet
        if (!document.querySelector('.game-grid')) {
            createBoardHTML();
        } else {
            // Just clear the existing board
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.className = 'cell empty';
                cell.innerHTML = '';
            });
        }
        
        // Update the UI
        updateGameStatus();
        updatePlayerInfo();
        
        // If AI mode and AI goes first (player 2), make AI move
        if (gameMode === 'ai' && currentPlayer === PLAYER_2) {
            setTimeout(makeAIMove, 500);
        }
    }
    
    // Create the HTML structure for the board
    function createBoardHTML() {
        // Clear any existing board
        while (gameBoard.firstChild) {
            gameBoard.removeChild(gameBoard.firstChild);
        }
        
        // Create column selection buttons
        const buttonRow = document.createElement('div');
        buttonRow.className = 'button-row';
        
        for (let col = 0; col < COLS; col++) {
            const button = document.createElement('button');
            button.className = 'column-button';
            button.textContent = '↓';
            button.dataset.col = col;
            button.addEventListener('click', () => makeMove(col));
            buttonRow.appendChild(button);
        }
        
        gameBoard.appendChild(buttonRow);
        
        // Create the game grid
        const grid = document.createElement('div');
        grid.className = 'game-grid';
        
        for (let row = 0; row < ROWS; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'row';
            
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell empty';
                cell.dataset.row = row;
                cell.dataset.col = col;
                rowDiv.appendChild(cell);
            }
            
            grid.appendChild(rowDiv);
        }
        
        gameBoard.appendChild(grid);
    }
    
    // Make a move in the specified column
    function makeMove(col) {
        if (!gameActive) return;
        if (gameMode === 'online' && currentPlayer !== PLAYER_1) return;
        
        // Find the lowest empty row
        const row = findLowestEmptyRow(col);
        if (row === -1) return; // Column is full
        
        // Update the board array
        board[row][col] = currentPlayer;
        
        // Update the UI
        updateCell(row, col);
        
        // Check for win or draw
        if (checkWin(row, col)) {
            gameActive = false;
            const winner = currentPlayer === PLAYER_1 ? 
                (gameMode === 'ai' ? 'You win!' : 'Player 1 wins!') : 
                (gameMode === 'ai' ? 'AI wins!' : 'Player 2 wins!');
            
            gameStatus.textContent = winner;
            showWinnerUI(currentPlayer);
            return;
        }
        
        if (checkDraw()) {
            gameActive = false;
            gameStatus.textContent = "It's a draw!";
            return;
        }
        
        // Switch players
        currentPlayer = currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1;
        updateGameStatus();
        updatePlayerInfo();
        
        // If it's AI's turn, make AI move
        if (gameMode === 'ai' && currentPlayer === PLAYER_2 && gameActive) {
            setTimeout(makeAIMove, 500);
        }
    }
    
    // Find the lowest empty row in a column
    function findLowestEmptyRow(col) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][col] === EMPTY) {
                return row;
            }
        }
        return -1; // Column is full
    }
    
    // Update a cell in the UI based on the current player
    function updateCell(row, col) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.className = `cell player${currentPlayer}`;
        
        // Add piece with animation
        const piece = document.createElement('div');
        piece.className = `piece player${currentPlayer}`;
        cell.appendChild(piece);
    }
    
    // Update game status text
    function updateGameStatus() {
        if (!gameActive) return;
        
        if (gameMode === 'local') {
            gameStatus.textContent = `Player ${currentPlayer}'s turn`;
        } else if (gameMode === 'ai') {
            gameStatus.textContent = currentPlayer === PLAYER_1 ? "Your turn" : "AI thinking...";
        } else {
            gameStatus.textContent = currentPlayer === PLAYER_1 ? "Your turn" : "Opponent's turn";
        }
    }
    
    // Update player info highlighting
    function updatePlayerInfo() {
        if (currentPlayer === PLAYER_1) {
            player1Info.classList.add('active-player');
            player2Info.classList.remove('active-player');
        } else {
            player1Info.classList.remove('active-player');
            player2Info.classList.add('active-player');
        }
    }
    
    // Show winner UI
    function showWinnerUI(winner) {
        const winnerInfo = winner === PLAYER_1 ? player1Info : player2Info;
        winnerInfo.classList.add('winner');
    }
    
    // Check if the last move resulted in a win
    function checkWin(row, col) {
        const player = board[row][col];
        
        // Check horizontal
        let count = 0;
        for (let c = 0; c < COLS; c++) {
            count = (board[row][c] === player) ? count + 1 : 0;
            if (count >= 4) return true;
        }
        
        // Check vertical
        count = 0;
        for (let r = 0; r < ROWS; r++) {
            count = (board[r][col] === player) ? count + 1 : 0;
            if (count >= 4) return true;
        }
        
        // Check diagonal (top-left to bottom-right)
        const directions = [
            [0, 1],  // horizontal
            [1, 0],  // vertical
            [1, 1],  // diagonal down-right
            [1, -1]  // diagonal down-left
        ];
        
        for (const [dx, dy] of directions) {
            count = 1;  // Start with 1 for the current piece
            
            // Check in the positive direction
            for (let i = 1; i < 4; i++) {
                const r = row + i * dx;
                const c = col + i * dy;
                
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // Check in the negative direction
            for (let i = 1; i < 4; i++) {
                const r = row - i * dx;
                const c = col - i * dy;
                
                if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 4) {
                return true;
            }
        }
        
        return false;
    }
    
    // Check if the game is a draw
    function checkDraw() {
        for (let col = 0; col < COLS; col++) {
            if (board[0][col] === EMPTY) {
                return false;
            }
        }
        return true; // No empty cells in top row
    }
    
    // Make a move for the AI
    function makeAIMove() {
        if (!gameActive || currentPlayer !== PLAYER_2) return;
        
        let col;
        
        // Different strategies based on difficulty
        switch (aiDifficulty) {
            case 'easy':
                col = makeRandomMove();
                break;
            case 'medium':
                col = makeMediumAIMove();
                break;
            case 'hard':
                col = makeHardAIMove();
                break;
            default:
                col = makeRandomMove();
        }
        
        makeMove(col);
    }
    
    // Random AI strategy (easy)
    function makeRandomMove() {
        const validCols = [];
        
        for (let col = 0; col < COLS; col++) {
            if (findLowestEmptyRow(col) !== -1) {
                validCols.push(col);
            }
        }
        
        return validCols[Math.floor(Math.random() * validCols.length)];
    }
    
    // Medium AI strategy
    function makeMediumAIMove() {
        // First check if AI can win in the next move
        for (let col = 0; col < COLS; col++) {
            const row = findLowestEmptyRow(col);
            if (row === -1) continue;
            
            // Try the move
            board[row][col] = PLAYER_2;
            const isWin = checkWin(row, col);
            // Undo the move
            board[row][col] = EMPTY;
            
            if (isWin) {
                return col; // Winning move found
            }
        }
        
        // Check if player can win in the next move and block it
        for (let col = 0; col < COLS; col++) {
            const row = findLowestEmptyRow(col);
            if (row === -1) continue;
            
            // Try the move as player
            board[row][col] = PLAYER_1;
            const isWin = checkWin(row, col);
            // Undo the move
            board[row][col] = EMPTY;
            
            if (isWin) {
                return col; // Blocking move found
            }
        }
        
        // Otherwise, prefer center and nearby columns
        const centerCol = Math.floor(COLS / 2);
        if (findLowestEmptyRow(centerCol) !== -1) {
            return centerCol;
        }
        
        // Try columns in order of preference (center first, then outwards)
        const colPreference = [3, 2, 4, 1, 5, 0, 6];
        for (const col of colPreference) {
            if (findLowestEmptyRow(col) !== -1) {
                return col;
            }
        }
        
        return makeRandomMove();
    }
    
    // Hard AI strategy
    function makeHardAIMove() {
        // Similar to medium but with more advanced evaluation
        // Check for immediate win
        for (let col = 0; col < COLS; col++) {
            const row = findLowestEmptyRow(col);
            if (row === -1) continue;
            
            board[row][col] = PLAYER_2;
            const isWin = checkWin(row, col);
            board[row][col] = EMPTY;
            
            if (isWin) return col;
        }
        
        // Block immediate player win
        for (let col = 0; col < COLS; col++) {
            const row = findLowestEmptyRow(col);
            if (row === -1) continue;
            
            board[row][col] = PLAYER_1;
            const isWin = checkWin(row, col);
            board[row][col] = EMPTY;
            
            if (isWin) return col;
        }
        
        // Check for two-move win setup
        for (let col = 0; col < COLS; col++) {
            const row = findLowestEmptyRow(col);
            if (row === -1) continue;
            
            // Make this move
            board[row][col] = PLAYER_2;
            
            // Check if this creates a winning threat on next move
            let winningThreats = 0;
            for (let nextCol = 0; nextCol < COLS; nextCol++) {
                const nextRow = findLowestEmptyRow(nextCol);
                if (nextRow === -1) continue;
                
                board[nextRow][nextCol] = PLAYER_2;
                if (checkWin(nextRow, nextCol)) {
                    winningThreats++;
                }
                board[nextRow][nextCol] = EMPTY;
            }
            
            // Undo the move
            board[row][col] = EMPTY;
            
            // If this creates multiple winning threats, it's a good move
            if (winningThreats >= 2) {
                return col;
            }
        }
        
        // Prefer center and nearby columns
        const colPreference = [3, 2, 4, 1, 5, 0, 6];
        for (const col of colPreference) {
            if (findLowestEmptyRow(col) !== -1) {
                return col;
            }
        }
        
        return makeRandomMove();
    }
    
    // Event Listeners
    resetButton.addEventListener('click', function() {
        console.log("Reset button clicked");
        initGame(gameMode, aiDifficulty);
    });
    
    undoButton.addEventListener('click', function() {
        console.log("Undo not implemented in this version");
        // Undo functionality would be more complex
    });
    
    // If we have difficulty buttons, set up listeners
    if (difficultyButtons.length > 0) {
        difficultyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const difficulty = this.dataset.difficulty;
                console.log("Setting difficulty:", difficulty);
                
                // Update button styling
                difficultyButtons.forEach(btn => {
                    btn.classList.remove('btn-primary', 'btn-danger');
                    btn.classList.add('btn-outline-primary', 'btn-outline-danger');
                });
                
                if (difficulty === 'easy' || difficulty === 'medium') {
                    this.classList.remove('btn-outline-primary');
                    this.classList.add('btn-primary');
                } else if (difficulty === 'hard') {
                    this.classList.remove('btn-outline-danger');
                    this.classList.add('btn-danger');
                }
                
                // Restart game with new difficulty
                aiDifficulty = difficulty;
                initGame(gameMode, difficulty);
            });
        });
    }
    
    // Handle online mode
    if (gameMode === 'online') {
        const findGameBtn = document.getElementById('find-game');
        const cancelSearchBtn = document.getElementById('cancel-search');
        
        if (findGameBtn) {
            findGameBtn.addEventListener('click', function() {
                // Simulate finding an opponent
                findGameBtn.style.display = 'none';
                cancelSearchBtn.style.display = 'block';
                document.getElementById('connection-status').innerHTML = 
                    'Searching for opponent<span class="waiting-animation"></span>';
                
                setTimeout(() => {
                    document.getElementById('connection-status').style.display = 'none';
                    document.getElementById('game-board').style.display = 'block';
                    document.querySelector('.game-info').style.display = 'flex';
                    cancelSearchBtn.style.display = 'none';
                    
                    // Initialize game
                    gameMode = 'online';
                    initGame('online');
                }, 2000);
            });
        }
        
        if (cancelSearchBtn) {
            cancelSearchBtn.addEventListener('click', function() {
                findGameBtn.style.display = 'block';
                cancelSearchBtn.style.display = 'none';
                document.getElementById('connection-status').innerHTML = 'Search canceled';
            });
        }
    }
    
    // Determine game mode from the URL or HTML
    const pathname = window.location.pathname;
    if (pathname.includes('ai')) {
        gameMode = 'ai';
    } else if (pathname.includes('online')) {
        gameMode = 'online';
    } else {
        gameMode = 'local';
    }
    
    // Initialize the game with the appropriate mode
    console.log("Starting game with mode:", gameMode);
    initGame(gameMode, aiDifficulty);
});