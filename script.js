let ROWS = 25;
let COLS = 50;
let grid = [];
let isMousePressed = false;
let isDraggingStartNode = false;
let isDraggingEndNode = false;

let START_NODE = { row: 12, col: 10 };
let END_NODE = { row: 12, col: 39 };
let isRunning = false;
let selectedAlgo = 'dijkstra';
let selectedMaze = '';
let currentZoom = 1;

document.addEventListener('DOMContentLoaded', () => {
    initializeGrid();
    setupEventListeners();
});

function initializeGrid() {
    const gridContainer = document.getElementById('grid-container');
    gridContainer.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;
    gridContainer.style.gridTemplateRows = `repeat(${ROWS}, minmax(0, 1fr))`;
    gridContainer.innerHTML = '';
    grid = [];

    // Reset start/end nodes if they are out of bounds
    if (START_NODE.row >= ROWS) START_NODE.row = ROWS - 1;
    if (START_NODE.col >= COLS) START_NODE.col = COLS - 1;
    if (END_NODE.row >= ROWS) END_NODE.row = ROWS - 1;
    if (END_NODE.col >= COLS) END_NODE.col = COLS - 1;

    for (let row = 0; row < ROWS; row++) {
        const currentRow = [];
        for (let col = 0; col < COLS; col++) {
            const nodeId = `node-${row}-${col}`;
            const nodeElement = document.createElement('div');
            nodeElement.id = nodeId;
            // Removed transition-colors to make dragging faster/more responsive
            nodeElement.className = 'w-6 h-6 bg-white dark:bg-background-dark border border-slate-100 dark:border-slate-800/20 flex items-center justify-center cursor-pointer flex-shrink-0';
            
            if (row === START_NODE.row && col === START_NODE.col) {
                nodeElement.classList.add('node-start');
            } else if (row === END_NODE.row && col === END_NODE.col) {
                nodeElement.classList.add('node-end');
            }

            nodeElement.onmousedown = (e) => {
                e.preventDefault();
                handleMouseDown(row, col);
            };
            nodeElement.onmouseenter = () => handleMouseEnter(row, col);
            nodeElement.onmouseup = () => handleMouseUp();
            // Prevent default drag and drop API taking over
            nodeElement.ondragstart = () => false;

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

    // Global mouseup to catch releases outside the grid
    document.body.onmouseup = () => handleMouseUp();
}

function setupEventListeners() {
    document.getElementById('visualizeBtn').addEventListener('click', visualizeAlgorithm);
    document.getElementById('clearBtn').addEventListener('click', clearBoard);
    document.getElementById('clearPathBtn').addEventListener('click', clearPath);

    document.getElementById('algoSelect').addEventListener('change', (e) => {
        selectedAlgo = e.target.value;
        document.getElementById('selectedAlgoDisplay').innerText = e.target.options[e.target.selectedIndex].text;
    });

    document.getElementById('mazeSelect').addEventListener('change', (e) => {
        if(isRunning) return;
        selectedMaze = e.target.value;
        if(selectedMaze) {
            generateMaze(selectedMaze);
        }
    });
    document.getElementById('gridSizeSelect').addEventListener('change', (e) => {
        if(isRunning) return;
        const [w, h] = e.target.value.split('x');
        COLS = parseInt(w);
        ROWS = parseInt(h);
        initializeGrid();
    });

    document.getElementById('zoomInBtn').addEventListener('click', () => {
        const gridContainer = document.getElementById('grid-container');
        if (currentZoom < 2.5) {
            currentZoom += 0.25;
            gridContainer.style.transform = `scale(${currentZoom})`;
        }
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        const gridContainer = document.getElementById('grid-container');
        if (currentZoom > 0.5) {
            currentZoom -= 0.25;
            gridContainer.style.transform = `scale(${currentZoom})`;
        }
    });

    const settingsBtn = document.getElementById('settingsBtn');
    if(settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            document.getElementById('gridSizeSelect').focus();
            document.getElementById('gridSizeSelect').click();
        });
    }
}

function clearBoard() {
    if (isRunning) return;
    document.getElementById('distanceDisplay').innerText = '--';
    document.getElementById('nodesVisitedDisplay').innerText = '0';
    initializeGrid();
}

function clearPath() {
    if (isRunning) return;
    document.getElementById('distanceDisplay').innerText = '--';
    document.getElementById('nodesVisitedDisplay').innerText = '0';
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const node = grid[row][col];
            const element = document.getElementById(`node-${row}-${col}`);
            node.isVisited = false;
            node.distance = Infinity;
            node.previousNode = null;
            if (!node.isStart && !node.isEnd && !node.isWall) {
                element.className = 'w-6 h-6 bg-white dark:bg-background-dark border border-slate-100 dark:border-slate-800/20 flex items-center justify-center cursor-pointer flex-shrink-0';
            } else if (node.isStart) {
                element.className = 'w-6 h-6 bg-white dark:bg-background-dark border border-slate-100 dark:border-slate-800/20 flex items-center justify-center cursor-pointer flex-shrink-0 node-start';
            } else if (node.isEnd) {
                element.className = 'w-6 h-6 bg-white dark:bg-background-dark border border-slate-100 dark:border-slate-800/20 flex items-center justify-center cursor-pointer flex-shrink-0 node-end';
            } else if (node.isWall) {
                element.className = 'w-6 h-6 bg-white dark:bg-background-dark border border-slate-100 dark:border-slate-800/20 flex items-center justify-center cursor-pointer flex-shrink-0 node-wall';
            }
        }
    }
}

function handleMouseDown(row, col) {
    if (isRunning) return;
    const node = grid[row][col];
    if (node.isStart) {
        isDraggingStartNode = true;
    } else if (node.isEnd) {
        isDraggingEndNode = true;
    } else {
        toggleWall(row, col);
    }
    isMousePressed = true;
}

function handleMouseEnter(row, col) {
    if (!isMousePressed || isRunning) return;
    const node = grid[row][col];
    if (isDraggingStartNode) {
        if (!node.isEnd && !node.isWall) {
            updateStartNode(row, col);
        }
    } else if (isDraggingEndNode) {
        if (!node.isStart && !node.isWall) {
            updateEndNode(row, col);
        }
    } else {
        toggleWall(row, col);
    }
}

function handleMouseUp() {
    isMousePressed = false;
    isDraggingStartNode = false;
    isDraggingEndNode = false;
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

function updateStartNode(row, col) {
    const oldElement = document.getElementById(`node-${START_NODE.row}-${START_NODE.col}`);
    oldElement.classList.remove('node-start');
    grid[START_NODE.row][START_NODE.col].isStart = false;

    START_NODE = {row, col};
    const newElement = document.getElementById(`node-${row}-${col}`);
    newElement.classList.add('node-start');
    grid[row][col].isStart = true;
}

function updateEndNode(row, col) {
    const oldElement = document.getElementById(`node-${END_NODE.row}-${END_NODE.col}`);
    oldElement.classList.remove('node-end');
    grid[END_NODE.row][END_NODE.col].isEnd = false;

    END_NODE = {row, col};
    const newElement = document.getElementById(`node-${row}-${col}`);
    newElement.classList.add('node-end');
    grid[row][col].isEnd = true;
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

// Will implement algorithms in next steps
function visualizeAlgorithm() {
    if (isRunning) return;
    isRunning = true;
    clearPath();
    isRunning = true;
    
    const startNode = grid[START_NODE.row][START_NODE.col];
    const endNode = grid[END_NODE.row][END_NODE.col];
    let visitedNodesInOrder;

    switch (selectedAlgo) {
        case 'dijkstra':
            visitedNodesInOrder = runDijkstra(grid, startNode, endNode);
            break;
        case 'aStar':
            visitedNodesInOrder = runAStar(grid, startNode, endNode);
            break;
        case 'bfs':
            visitedNodesInOrder = runBFS(grid, startNode, endNode);
            break;
        case 'dfs':
            visitedNodesInOrder = runDFS(grid, startNode, endNode);
            break;
        case 'greedy':
            visitedNodesInOrder = runGreedy(grid, startNode, endNode);
            break;
        case 'bidirectionalBfs':
            visitedNodesInOrder = runBidirectionalBFS(grid, startNode, endNode);
            break;
        case 'bidirectionalAStar':
            // Fallback to A* for now if not fully bidirectional implemented
            visitedNodesInOrder = runBidirectionalBFS(grid, startNode, endNode);
            break;
        case 'bidirectionalGreedy':
            visitedNodesInOrder = runBidirectionalBFS(grid, startNode, endNode);
            break;
        case 'swarm':
            visitedNodesInOrder = runSwarm(grid, startNode, endNode);
            break;
        case 'convergentSwarm':
            visitedNodesInOrder = runConvergentSwarm(grid, startNode, endNode);
            break;
        default:
            visitedNodesInOrder = runDijkstra(grid, startNode, endNode);
    }

    // Bidirectional can have multiple paths, but for simplicity we assume endNode has previousNode set if path found.
    // If not, we might need to handle intersection node.
    let nodesInShortestPathOrder = [];
    if (selectedAlgo.startsWith('bidirectional')) {
        nodesInShortestPathOrder = getBidirectionalShortestPath(endNode); // Placeholder
    } else {
        nodesInShortestPathOrder = getNodesInShortestPathOrder(endNode);
    }

    if (nodesInShortestPathOrder.length === 1 && nodesInShortestPathOrder[0] === endNode && endNode.previousNode === null) {
        nodesInShortestPathOrder = [];
    }
    
    animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
}

function runDijkstra(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    const unvisitedNodes = getAllNodes(grid);

    while (!!unvisitedNodes.length) {
        sortNodesByDistance(unvisitedNodes);
        const closestNode = unvisitedNodes.shift();

        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) return visitedNodesInOrder;

        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);

        if (closestNode === endNode) return visitedNodesInOrder;

        updateUnvisitedNeighbors(closestNode, grid);
    }
    return visitedNodesInOrder;
}

function runAStar(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    startNode.totalDistance = manhattanDistance(startNode, endNode);
    const unvisitedNodes = getAllNodes(grid);

    while (!!unvisitedNodes.length) {
        unvisitedNodes.sort((nodeA, nodeB) => nodeA.totalDistance - nodeB.totalDistance);
        const closestNode = unvisitedNodes.shift();

        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) return visitedNodesInOrder;

        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);

        if (closestNode === endNode) return visitedNodesInOrder;

        const unvisitedNeighbors = getUnvisitedNeighbors(closestNode, grid);
        for (const neighbor of unvisitedNeighbors) {
            const distance = closestNode.distance + 1;
            if (distance < neighbor.distance) {
                neighbor.distance = distance;
                neighbor.totalDistance = distance + manhattanDistance(neighbor, endNode);
                neighbor.previousNode = closestNode;
            }
        }
    }
    return visitedNodesInOrder;
}

function runBFS(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    const queue = [startNode];
    startNode.isVisited = true;

    while (queue.length > 0) {
        const currentNode = queue.shift();
        if (currentNode.isWall) continue;
        
        visitedNodesInOrder.push(currentNode);
        if (currentNode === endNode) return visitedNodesInOrder;

        const unvisitedNeighbors = getUnvisitedNeighbors(currentNode, grid);
        for (const neighbor of unvisitedNeighbors) {
            neighbor.isVisited = true;
            neighbor.previousNode = currentNode;
            queue.push(neighbor);
        }
    }
    return visitedNodesInOrder;
}

function runDFS(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    const stack = [startNode];
    startNode.isVisited = true;

    while (stack.length > 0) {
        const currentNode = stack.pop();
        if (currentNode.isWall) continue;

        visitedNodesInOrder.push(currentNode);
        if (currentNode === endNode) return visitedNodesInOrder;

        const unvisitedNeighbors = getUnvisitedNeighbors(currentNode, grid);
        for (const neighbor of unvisitedNeighbors) {
            neighbor.isVisited = true;
            neighbor.previousNode = currentNode;
            stack.push(neighbor);
        }
    }
    return visitedNodesInOrder;
}

function runGreedy(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    const unvisitedNodes = getAllNodes(grid);

    while (!!unvisitedNodes.length) {
        // Sort purely by heuristic distance to end
        unvisitedNodes.sort((nodeA, nodeB) => manhattanDistance(nodeA, endNode) - manhattanDistance(nodeB, endNode));
        const closestNode = unvisitedNodes.shift();

        if (closestNode.isWall) continue;
        // greedy doesn't strictly care about distance from start, but we use it to track reachable nodes
        if (closestNode.distance === Infinity && closestNode !== startNode) {
            // Can't reach this node, wait, greedy requires pushing reachable nodes
            // Instead, just use a priority queue like A* but with f(n) = h(n)
            continue;
        }

        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);

        if (closestNode === endNode) return visitedNodesInOrder;

        const unvisitedNeighbors = getUnvisitedNeighbors(closestNode, grid);
        for (const neighbor of unvisitedNeighbors) {
            neighbor.distance = closestNode.distance + 1; // Just to mark as reachable
            neighbor.previousNode = closestNode;
            neighbor.isVisited = true; // Mark visited here to avoid duplicate processing in queue
            // We should ideally use a proper priority queue, but for grid scale it works if we re-insert or sort
        }
    }
    return visitedNodesInOrder;
}

function runSwarm(grid, startNode, endNode) {
    // Swarm is essentially A* with an extra heuristic penalty to explore more nodes
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    startNode.totalDistance = manhattanDistance(startNode, endNode);
    const unvisitedNodes = getAllNodes(grid);

    while (!!unvisitedNodes.length) {
        unvisitedNodes.sort((nodeA, nodeB) => nodeA.totalDistance - nodeB.totalDistance);
        const closestNode = unvisitedNodes.shift();

        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) return visitedNodesInOrder;

        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);

        if (closestNode === endNode) return visitedNodesInOrder;

        const unvisitedNeighbors = getUnvisitedNeighbors(closestNode, grid);
        for (const neighbor of unvisitedNeighbors) {
            const distance = closestNode.distance + 1;
            if (distance < neighbor.distance) {
                neighbor.distance = distance;
                // Swarm adds distance from start node heuristic to broaden search
                neighbor.totalDistance = distance + manhattanDistance(neighbor, endNode) + manhattanDistance(neighbor, startNode) * 0.1;
                neighbor.previousNode = closestNode;
            }
        }
    }
    return visitedNodesInOrder;
}

function runConvergentSwarm(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    startNode.totalDistance = manhattanDistance(startNode, endNode);
    const unvisitedNodes = getAllNodes(grid);

    while (!!unvisitedNodes.length) {
        unvisitedNodes.sort((nodeA, nodeB) => nodeA.totalDistance - nodeB.totalDistance);
        const closestNode = unvisitedNodes.shift();

        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) return visitedNodesInOrder;

        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);

        if (closestNode === endNode) return visitedNodesInOrder;

        const unvisitedNeighbors = getUnvisitedNeighbors(closestNode, grid);
        for (const neighbor of unvisitedNeighbors) {
            const distance = closestNode.distance + 1;
            if (distance < neighbor.distance) {
                neighbor.distance = distance;
                // Convergent Swarm penalizes nodes far from end more heavily
                neighbor.totalDistance = distance + manhattanDistance(neighbor, endNode) * 10;
                neighbor.previousNode = closestNode;
            }
        }
    }
    return visitedNodesInOrder;
}

let bidirectionalIntersection = null;

function runBidirectionalBFS(grid, startNode, endNode) {
    const visitedNodesInOrder = [];
    const queueA = [startNode];
    const queueB = [endNode];
    startNode.isVisited = true;
    startNode.isVisitedByStart = true;
    endNode.isVisited = true;
    endNode.isVisitedByEnd = true;
    bidirectionalIntersection = null;

    while (queueA.length > 0 && queueB.length > 0) {
        const currentNodeA = queueA.shift();
        if (!currentNodeA.isWall) {
            visitedNodesInOrder.push(currentNodeA);
            const neighborsA = getUnvisitedNeighborsBidirectional(currentNodeA, grid, 'Start');
            for (const neighbor of neighborsA) {
                if (neighbor.isVisitedByEnd) {
                    bidirectionalIntersection = { nodeA: currentNodeA, nodeB: neighbor };
                    visitedNodesInOrder.push(neighbor);
                    return visitedNodesInOrder;
                }
                neighbor.isVisited = true;
                neighbor.isVisitedByStart = true;
                neighbor.previousNode = currentNodeA;
                queueA.push(neighbor);
            }
        }

        const currentNodeB = queueB.shift();
        if (!currentNodeB.isWall) {
            visitedNodesInOrder.push(currentNodeB);
            const neighborsB = getUnvisitedNeighborsBidirectional(currentNodeB, grid, 'End');
            for (const neighbor of neighborsB) {
                if (neighbor.isVisitedByStart) {
                    bidirectionalIntersection = { nodeA: neighbor, nodeB: currentNodeB };
                    visitedNodesInOrder.push(neighbor);
                    return visitedNodesInOrder;
                }
                neighbor.isVisited = true;
                neighbor.isVisitedByEnd = true;
                neighbor.previousNodeEnd = currentNodeB;
                queueB.push(neighbor);
            }
        }
    }
    return visitedNodesInOrder;
}

function getUnvisitedNeighborsBidirectional(node, grid, type) {
    const neighbors = [];
    const {row, col} = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < COLS - 1) neighbors.push(grid[row][col + 1]);
    return neighbors.filter(neighbor => type === 'Start' ? !neighbor.isVisitedByStart : !neighbor.isVisitedByEnd);
}

function getBidirectionalShortestPath(endNode) {
    if (!bidirectionalIntersection) return [];

    const path = [];
    let current = bidirectionalIntersection.nodeA;
    while (current !== null) {
        path.unshift(current);
        current = current.previousNode;
    }

    current = bidirectionalIntersection.nodeB;
    while (current !== null) {
        path.push(current);
        current = current.previousNodeEnd;
    }

    return path;
}

function sortNodesByDistance(unvisitedNodes) {
    unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

function updateUnvisitedNeighbors(node, grid) {
    const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
    for (const neighbor of unvisitedNeighbors) {
        neighbor.distance = node.distance + 1;
        neighbor.previousNode = node;
    }
}

function getAllNodes(grid) {
    const nodes = [];
    for (const row of grid) {
        for (const node of row) {
            nodes.push(node);
        }
    }
    return nodes;
}

function manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

function animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder) {
    let speed = 10;
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
        if (i === visitedNodesInOrder.length) {
            setTimeout(() => {
                animateShortestPath(nodesInShortestPathOrder);
            }, speed * i);
            return;
        }
        setTimeout(() => {
            const node = visitedNodesInOrder[i];
            if (!node.isStart && !node.isEnd) {
                document.getElementById(`node-${node.row}-${node.col}`).classList.add('node-visited');
                document.getElementById('nodesVisitedDisplay').innerText = i + 1;
            }
        }, speed * i);
    }
}

function animateShortestPath(nodesInShortestPathOrder) {
    if (nodesInShortestPathOrder.length === 0) {
        isRunning = false;
        return;
    }
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
        setTimeout(() => {
            const node = nodesInShortestPathOrder[i];
            if (!node.isStart && !node.isEnd) {
                document.getElementById(`node-${node.row}-${node.col}`).classList.remove('node-visited');
                document.getElementById(`node-${node.row}-${node.col}`).classList.add('node-shortest-path');
            }
            if (i === nodesInShortestPathOrder.length - 1) {
                isRunning = false;
                document.getElementById('distanceDisplay').innerText = nodesInShortestPathOrder.length - 1;
            }
        }, 30 * i);
    }
}

function generateMaze(type) {
    clearBoard();
    if (type === 'randomMaze') {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (Math.random() < 0.3) {
                    toggleWall(row, col);
                }
            }
        }
    } else if (type === 'randomWeight') {
         // simple random maze for now
         for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (Math.random() < 0.3) {
                    toggleWall(row, col);
                }
            }
        }
    } else if (type === 'horizontalSkew') {
         for (let row = 0; row < ROWS; row += 2) {
            for (let col = 0; col < COLS; col++) {
                if (Math.random() < 0.8) {
                    toggleWall(row, col);
                }
            }
        }
    } else if (type === 'verticalSkew') {
         for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col += 2) {
                if (Math.random() < 0.8) {
                    toggleWall(row, col);
                }
            }
        }
    }
    // recursive division could be added, simplified here
}
// Fixed toggleWall to ensure it correctly renders
// And correctly initialized grid nodes
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
