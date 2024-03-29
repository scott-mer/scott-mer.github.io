const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let cellSize, canvasWidth, canvasHeight, cols, rows, grid;

function resizeCanvas() {
    const desiredCols = 100; 
    const desiredRows = Math.round((window.innerHeight / window.innerWidth) * desiredCols);

    cellSize = window.innerWidth / desiredCols;
    canvasWidth = cellSize * desiredCols;
    canvasHeight = cellSize * desiredRows;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    cols = desiredCols;
    rows = desiredRows;

    grid = resetGrid();
    seedRandom();
    drawGrid();
}

function resetGrid() {
    const arr = [];
    for (let i = 0; i < rows; i++) {
        arr[i] = [];
        for (let j = 0; j < cols; j++) {
            arr[i][j] = 0;
        }
    }
    return arr;
}

function seedLWSS() {
    const startX = 10;
    const startY = 10;
    grid[startX][startY + 1] = 1;
    grid[startX + 1][startY + 2] = 1;
    grid[startX + 2][startY + 2] = 1;
    grid[startX + 3][startY + 2] = 1;
    grid[startX + 4][startY + 1] = 1;
    grid[startX + 4][startY] = 1;
    grid[startX + 3][startY - 2] = 1;
    grid[startX + 4][startY - 1] = 1;
}

function seedRandom(percentage = 0.2) {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (Math.random() < percentage) {
                grid[i][j] = 1;
            }
        }
    }
}

function drawGrid() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cell = grid[i][j];
            ctx.fillStyle = cell ? 'black' : 'green';
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
}

function updateGrid() {
    const nextGrid = resetGrid();

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cell = grid[i][j];
            let neighborCount = 0;
            
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    if (x === 0 && y === 0) continue;
                    const newX = i + x;
                    const newY = j + y;
                    if (newX >= 0 && newY >= 0 && newX < rows && newY < cols) {
                        neighborCount += grid[newX][newY];
                    }
                }
            }

            if (cell && (neighborCount < 2 || neighborCount > 3)) {
                nextGrid[i][j] = 0;
            } else if (!cell && neighborCount === 3) {
                nextGrid[i][j] = 1;
            } else {
                nextGrid[i][j] = cell;
            }
        }
    }

    grid = nextGrid;
}

function gameLoop() {
    updateGrid();
    drawGrid();
}

setInterval(gameLoop, 100);
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

canvas.addEventListener('click', (e) => { 
    const rect = canvas.getBoundingClientRect(); 
    const clickX = e.clientX - rect.left; 
    const clickY = e.clientY - rect.top; 
    const clickedCol = Math.floor(clickX / cellSize); 
    const clickedRow = Math.floor(clickY / cellSize); 
    // Spawn a glider where the user clicked 
    if ( clickedCol > 0 && clickedCol < cols - 1 && clickedRow > 0 && clickedRow < rows - 1 ) { 
        grid[clickedRow][clickedCol] = 0; 
        grid[clickedRow][clickedCol + 1] = 1; 
        grid[clickedRow + 1][clickedCol + 2] = 1; 
        grid[clickedRow + 2][clickedCol] = 1; 
        grid[clickedRow + 2][clickedCol + 1] = 1; 
        grid[clickedRow + 2][clickedCol + 2] = 1;            
    }
    drawGrid(); 
});