const ROWS = 25;
const COLS = 50;
let grid = [];
let isMousePressed = false;
const START_NODE = { row: 10, col: 5 };
const END_NODE = { row: 10, col: 45 };
let isRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    setupEventListeners();
});

function initializeGrid() {
    const gridContainer = document.getElementById('grid-container');
    gridContainer.style.gridTemplateColumns = `repeat(${COLS}, 25px)`;
    gridContainer.innerHTML = '';
    grid = [];

    for (let row = 0; row < ROWS; row++) {
        const currentRow = [];
        for (let col = 0; col < COLS; col++) {
            const nodeId = `node-${row}-${col}`;
            const nodeElement = document.createElement('div');
            nodeElement.id = nodeId;
            nodeElement.className = 'node';
            
            if (row === START_NODE.row && col === START_NODE.col) {
                nodeElement.classList.add('node-start');
            } else if (row === END_NODE.row && col === END_NODE.col) {
                nodeElement.classList.add('node-end');
            }

            nodeElement.onmousedown = () => handleMouseDown(row, col);
            nodeElement.onmouseenter = () => handleMouseEnter(row, col);
            nodeElement.onmouseup = () => handleMouseUp();

            gridContainer.appendChild(nodeElement);
            currentRow.push({
                row,
                col,
                isStart: row === START_NODE.row && col === START_NODE.col,
                isEnd: row === END_NODE.row && col === END_NODE.col,
                isWall: false,
                distance: Infinity,
                previousNode: null,
                isVisited: false
            });
        }
        grid.push(currentRow);
    }
}

function setupEventListeners() {
    document.getElementById('visualizeBtn').addEventListener('click', visualizeAlgorithm);
    document.getElementById('clearBtn').addEventListener('click', () => {
        if (!isRunning) initializeGrid();
    });
}

function handleMouseDown(row, col) {
    if (isRunning) return;
    toggleWall(row, col);
    isMousePressed = true;
}

function handleMouseEnter(row, col) {
    if (!isMousePressed || isRunning) return;
    toggleWall(row, col);
}

function handleMouseUp() {
    isMousePressed = false;
}

function toggleWall(row, col) {
    const node = grid[row][col];
    if (node.isStart || node.isEnd) return;
    
    const element = document.getElementById(`node-${row}-${col}`);
    node.isWall = !node.isWall;
    if (node.isWall) {
        element.classList.add('node-wall');
    } else {
        element.classList.remove('node-wall');
    }
}

function visualizeAlgorithm() {
    if (isRunning) return;
    isRunning = true;
    
    const startNode = grid[START_NODE.row][START_NODE.col];
    const endNode = grid[END_NODE.row][END_NODE.col];
    
    const visitedNodesInOrder = runBFS(grid, startNode, endNode);
    const nodesInShortestPathOrder = getNodesInShortestPathOrder(endNode);
    
    animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
}

function runBFS(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    const queue = [startNode];
    startNode.isVisited = true;
    startNode.distance = 0;

    while (queue.length > 0) {
        const currentNode = queue.shift();
        if (currentNode.isWall) continue;
        
        visitedNodesInOrder.push(currentNode);
        if (currentNode === endNode) return visitedNodesInOrder;

        const unvisitedNeighbors = getUnvisitedNeighbors(currentNode, grid);
        for (const neighbor of unvisitedNeighbors) {
            neighbor.isVisited = true;
            neighbor.previousNode = currentNode;
            neighbor.distance = currentNode.distance + 1;
            queue.push(neighbor);
        }
    }
    return visitedNodesInOrder;
}

function getUnvisitedNeighbors(node, grid) {
    const neighbors = [];
    const {row, col} = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < COLS - 1) neighbors.push(grid[row][col + 1]);
    return neighbors.filter(neighbor => !neighbor.isVisited);
}

function getNodesInShortestPathOrder(endNode) {
    const nodesInShortestPathOrder = [];
    let currentNode = endNode;
    while (currentNode !== null) {
        nodesInShortestPathOrder.unshift(currentNode);
        currentNode = currentNode.previousNode;
    }
    return nodesInShortestPathOrder;
}

function animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder) {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
        if (i === visitedNodesInOrder.length) {
            setTimeout(() => {
                animateShortestPath(nodesInShortestPathOrder);
            }, 10 * i);
            return;
        }
        setTimeout(() => {
            const node = visitedNodesInOrder[i];
            if (!node.isStart && !node.isEnd) {
                document.getElementById(`node-${node.row}-${node.col}`).classList.add('node-visited');
            }
        }, 10 * i);
    }
}

function animateShortestPath(nodesInShortestPathOrder) {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
        setTimeout(() => {
            const node = nodesInShortestPathOrder[i];
            if (!node.isStart && !node.isEnd) {
                document.getElementById(`node-${node.row}-${node.col}`).classList.add('node-shortest-path');
            }
            if (i === nodesInShortestPathOrder.length - 1) {
                isRunning = false;
            }
        }, 50 * i);
    }
}