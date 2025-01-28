class SudokuGame {
    constructor() {
        this.board = null;
        this.solution = null;
        this.selectedCell = null;
        this.selectedNumber = null;
        this.startTime = null;
        this.timerInterval = null;
        this.isNotesMode = false;
        this.moves = [];
        this.difficulty = 'medium';
        this.elements = {};
    }

    init() {
        // Initialize DOM elements
        this.initializeElements();
        
        // Only proceed if all required elements are found
        if (this.validateElements()) {
            this.initTheme();
            this.setupEventListeners();
            this.showDifficultyScreen();
        } else {
            console.error('Failed to initialize game: Missing required elements');
        }
    }

    initializeElements() {
        this.elements = {
            board: document.querySelector('.game-board'),
            gameScreen: document.getElementById('gameScreen'),
            difficultyScreen: document.getElementById('difficultyScreen'),
            timer: document.querySelector('.timer'),
            numberButtons: document.querySelectorAll('.num-btn'),
            themeToggle: document.getElementById('themeToggle'),
            notesBtn: document.getElementById('notesBtn'),
            undoBtn: document.getElementById('undoBtn'),
            hintBtn: document.getElementById('hintBtn'),
            solveBtn: document.getElementById('solveBtn'),
            newGameBtn: document.getElementById('newGame'),
            winModal: document.getElementById('winModal'),
            playAgainBtn: document.getElementById('playAgain')
        };
    }

    validateElements() {
        const requiredElements = [
            'board',
            'gameScreen',
            'difficultyScreen',
            'timer',
            'themeToggle',
            'notesBtn',
            'undoBtn',
            'hintBtn',
            'solveBtn',
            'newGameBtn',
            'winModal',
            'playAgainBtn'
        ];

        return requiredElements.every(element => {
            if (!this.elements[element]) {
                console.error(`Missing required element: ${element}`);
                return false;
            }
            return true;
        });
    }

    initTheme() {
        const isDark = localStorage.getItem('theme') === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        const themeIcon = this.elements.themeToggle.querySelector('.material-icons');
        if (themeIcon) {
            themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
        }
    }

    showDifficultyScreen() {
        this.elements.difficultyScreen.classList.remove('hidden');
        this.elements.gameScreen.classList.add('hidden');
        this.elements.winModal.classList.add('hidden');
    }

    setupEventListeners() {
        // Difficulty buttons
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficulty = btn.dataset.difficulty;
                this.startNewGame();
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const icon = themeToggle.querySelector('.material-icons');
            icon.textContent = document.body.classList.contains('dark-theme') ? 'light_mode' : 'dark_mode';
        });

        // New game button
        document.getElementById('newGame').addEventListener('click', () => {
            this.elements.difficultyScreen.classList.remove('hidden');
            this.elements.gameScreen.classList.add('hidden');
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
        });

        // Play again button
        document.getElementById('playAgain').addEventListener('click', () => {
            this.elements.winModal.classList.add('hidden');
            this.elements.difficultyScreen.classList.remove('hidden');
            this.elements.gameScreen.classList.add('hidden');
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
        });

        // Board cell clicks
        this.elements.board.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                this.handleCellClick(cell);
            }
        });

        // Handle double click to deselect
        this.elements.board.addEventListener('dblclick', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                this.clearSelection();
            }
        });

        // Number buttons
        const numBtns = document.querySelectorAll('.num-btn');
        numBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const number = parseInt(btn.dataset.number);
                this.handleNumberClick(number);
            });
        });

        // Notes mode
        document.getElementById('notesBtn').addEventListener('click', (e) => {
            this.isNotesMode = !this.isNotesMode;
            e.currentTarget.classList.toggle('active', this.isNotesMode);
        });

        // Undo button
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undoMove();
        });

        // Hint button
        document.getElementById('hintBtn').addEventListener('click', () => {
            this.getHint();
        });

        // Solve button
        document.getElementById('solveBtn').addEventListener('click', () => {
            this.solvePuzzle();
        });

        // Keyboard input
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                this.handleNumberClick(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === '0') {
                this.handleNumberClick(0);
            }
        });
    }

    startNewGame() {
        this.elements.difficultyScreen.classList.add('hidden');
        this.elements.gameScreen.classList.remove('hidden');
        this.resetGame();
        this.createBoard();
        this.generatePuzzle();
        this.renderBoard();
        this.startTimer();
    }

    resetGame() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.selectedNumber = null;
        this.moves = [];
        this.isNotesMode = false;
        this.elements.notesBtn.classList.remove('active');
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.startTime = null;
        this.elements.timer.textContent = '00:00';
    }

    createBoard() {
        this.elements.board.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                // Create notes container
                const notes = document.createElement('div');
                notes.className = 'notes';
                cell.appendChild(notes);

                // Create main number display
                const number = document.createElement('div');
                number.className = 'number';
                cell.appendChild(number);
                
                this.elements.board.appendChild(cell);
            }
        }
    }

    generatePuzzle() {
        // First, generate a solved board
        this.generateSolvedBoard();
        
        // Save the solution
        this.solution = this.board.map(row => [...row]);
        
        // Remove numbers based on difficulty
        const cellsToRemove = {
            'easy': 30,
            'medium': 45,
            'hard': 55
        }[this.difficulty];

        // Create array of all positions and shuffle them
        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        this.shuffleArray(positions);
        
        // Remove numbers from random positions
        for (let i = 0; i < cellsToRemove; i++) {
            const [row, col] = positions[i];
            this.board[row][col] = 0;
        }
    }

    generateSolvedBoard() {
        // Fill diagonal boxes first (they are independent)
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(i, i);
        }
        
        // Fill the rest using backtracking
        this.solveSudoku(this.board);
    }

    fillBox(startRow, startCol) {
        const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        let index = 0;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.board[startRow + i][startCol + j] = numbers[index++];
            }
        }
    }

    solveSudoku(board) {
        const emptyCell = this.findEmptyCell(board);
        if (!emptyCell) return true;
        
        const [row, col] = emptyCell;
        const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (const num of numbers) {
            if (this.isValidPlacement(board, row, col, num)) {
                board[row][col] = num;
                
                if (this.solveSudoku(board)) {
                    return true;
                }
                
                board[row][col] = 0;
            }
        }
        
        return false;
    }

    findEmptyCell(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    return [i, j];
                }
            }
        }
        return null;
    }

    isValidPlacement(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (x !== col && board[row][x] === num) {
                return false;
            }
        }
        
        // Check column
        for (let x = 0; x < 9; x++) {
            if (x !== row && board[x][col] === num) {
                return false;
            }
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const currentRow = boxRow + i;
                const currentCol = boxCol + j;
                if (currentRow !== row && currentCol !== col && 
                    board[currentRow][currentCol] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }

    renderBoard() {
        const cells = this.elements.board.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];
            
            // Clear any existing content and classes
            cell.classList.remove('selected', 'related', 'same-number', 'filled', 'wrong', 'given');
            
            // Clear notes
            const notesDiv = cell.querySelector('.notes');
            if (notesDiv) {
                notesDiv.innerHTML = '';
            }
            
            // Set number
            const numberDiv = cell.querySelector('.number');
            if (numberDiv) {
                numberDiv.textContent = value !== 0 ? value : '';
                if (value !== 0 && this.board[row][col] === this.solution[row][col]) {
                    cell.classList.add('given');
                }
            }
        });
    }

    handleCellClick(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const clickedValue = this.board[row][col];
        
        // If clicking the same cell, clear selection
        if (this.selectedCell && 
            this.selectedCell[0] === row && 
            this.selectedCell[1] === col) {
            this.clearSelection();
            return;
        }

        // Update selection
        this.clearSelection();
        
        cell.classList.add('selected');
        this.selectedCell = [row, col];
        
        // Highlight related cells
        const cells = this.elements.board.querySelectorAll('.cell');
        cells.forEach(c => {
            const r = parseInt(c.dataset.row);
            const c_col = parseInt(c.dataset.col);
            
            // Same row, column, or 3x3 box
            if (r === row || c_col === col || 
                (Math.floor(r/3) === Math.floor(row/3) && 
                 Math.floor(c_col/3) === Math.floor(col/3))) {
                c.classList.add('related');
            }
            
            // Highlight same numbers across the board
            const cellValue = this.board[r][c_col];
            if (clickedValue !== 0 && cellValue === clickedValue) {
                c.classList.add('same-number');
            }
        });
    }

    clearSelection() {
        this.selectedCell = null;
        const cells = this.elements.board.querySelectorAll('.cell');
        cells.forEach(c => {
            c.classList.remove('selected', 'related', 'same-number');
        });
    }

    handleNumberClick(number) {
        if (!this.selectedCell) return;
        
        const [row, col] = this.selectedCell;
        const cell = this.elements.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (cell.classList.contains('given')) return;
        
        console.log(`Handling number click: ${number} for cell [${row}, ${col}]`); // Log for debugging
        
        if (this.isNotesMode) {
            this.toggleNote(row, col, number);
        } else {
            if (this.board[row][col] === number) {
                this.addMove(row, col, number, 0);
                this.board[row][col] = 0;
                cell.querySelector('.number').textContent = '';
                cell.classList.remove('filled', 'wrong');
            } else {
                this.addMove(row, col, this.board[row][col], number);
                this.board[row][col] = number;
                cell.querySelector('.number').textContent = number;
                cell.classList.add('filled');
                
                if (number !== this.solution[row][col]) {
                    cell.classList.add('wrong');
                } else {
                    cell.classList.remove('wrong');
                }
            }
            
            // Highlight all matching numbers
            const cells = this.elements.board.querySelectorAll('.cell');
            cells.forEach(c => {
                const r = parseInt(c.dataset.row);
                const c_col = parseInt(c.dataset.col);
                c.classList.remove('same-number');
                
                if (this.board[r][c_col] === number) {
                    c.classList.add('same-number');
                }
            });
        }
        
        // Check if puzzle is solved
        if (this.isPuzzleSolved()) {
            this.showWinScreen();
        }
    }

    toggleNote(row, col, number) {
        if (number === 0) {
            // Clear all notes when erasing
            const cell = this.elements.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            const notes = cell.querySelector('.notes');
            notes.innerHTML = '';
            return;
        }
        
        const cell = this.elements.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const notes = cell.querySelector('.notes');
        
        // Clear main number if present
        if (this.board[row][col] !== 0) {
            this.board[row][col] = 0;
            cell.querySelector('.number').textContent = '';
            cell.classList.remove('filled', 'wrong');
        }
        
        const noteElement = notes.querySelector(`[data-note="${number}"]`);
        
        if (noteElement) {
            noteElement.remove();
        } else {
            const note = document.createElement('div');
            note.textContent = number;
            note.dataset.note = number;
            note.style.gridArea = `${Math.ceil(number/3)}/${((number-1)%3)+1}`;
            notes.appendChild(note);
        }
    }

    eraseNumber() {
        if (!this.selectedCell) return;
        
        const [row, col] = this.selectedCell;
        const cell = this.elements.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (cell.classList.contains('given')) return;
        console.log(`Erasing number from cell [${row}, ${col}]`); // Log for debugging
        cell.querySelector('.number').textContent = '';
        cell.classList.remove('filled', 'wrong');
        cell.querySelector('.notes').innerHTML = '';
        
        this.updateBoard();
    }

    addMove(row, col, oldValue, newValue) {
        this.moves.push({row, col, oldValue, newValue});
    }

    undoMove() {
        if (this.moves.length === 0) return;
        
        const move = this.moves.pop();
        this.board[move.row][move.col] = move.oldValue;
        this.updateBoard();
    }

    getHint() {
        if (!this.selectedCell) return;
        
        const [row, col] = this.selectedCell;
        if (this.board[row][col] === this.solution[row][col]) return;
        
        this.addMove(row, col, this.board[row][col], this.solution[row][col]);
        this.board[row][col] = this.solution[row][col];
        this.updateBoard();
        this.checkWin();
    }

    solvePuzzle() {
        this.board = this.solution.map(row => [...row]);
        this.updateBoard();
        this.gameWon();
    }

    checkWin() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] !== this.solution[i][j]) {
                    return false;
                }
            }
        }
        
        this.gameWon();
        return true;
    }

    gameWon() {
        clearInterval(this.timerInterval);
        const minutes = Math.floor((Date.now() - this.startTime) / 60000);
        const seconds = Math.floor((Date.now() - this.startTime) / 1000) % 60;
        
        const stats = this.elements.winModal.querySelector('.stats');
        stats.textContent = `Time: ${minutes}m ${seconds}s | Difficulty: ${this.difficulty}`;
        this.elements.winModal.classList.remove('hidden');
    }

    showWinScreen() {
        clearInterval(this.timerInterval);
        const minutes = Math.floor((Date.now() - this.startTime) / 60000);
        const seconds = Math.floor((Date.now() - this.startTime) / 1000) % 60;
        
        const stats = this.elements.winModal.querySelector('.stats');
        stats.textContent = `Time: ${minutes}m ${seconds}s | Difficulty: ${this.difficulty}`;
        this.elements.winModal.classList.remove('hidden');
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed / 1000) % 60);
            this.elements.timer.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    updateBoard() {
        const cells = this.elements.board.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = this.board[row][col];
            
            if (value !== 0) {
                cell.querySelector('.number').textContent = value;
                cell.classList.add('filled');
            } else {
                cell.querySelector('.number').textContent = '';
                cell.classList.remove('filled', 'wrong');
            }
        });
    }

    isPuzzleSolved() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] !== this.solution[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new SudokuGame();
    game.init();
});
