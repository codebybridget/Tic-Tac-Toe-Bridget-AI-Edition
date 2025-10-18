// DOM Elements
const board = document.getElementById('board');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const resetScoresBtn = document.getElementById('resetScores');
const xScoreEl = document.getElementById('xScore');
const oScoreEl = document.getElementById('oScore');
const oLabel = document.getElementById('oLabel');
const difficultySelect = document.getElementById('difficulty');
const modeSelect = document.getElementById('mode');
const shareBtn = document.getElementById('shareBtn');

// Game State
let cells = Array(9).fill(null);
let currentPlayer = 'X';
let gameOver = false;
let xScore = 0;
let oScore = 0;
let mode = 'ai';
let difficulty = 'medium';

// Winning Patterns
const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// Bridget voice
const bridgetSpeak = async (text) => {
  try {
    const voiceName = "Joanna"; // change to Amy, Brian, Emma, etc.
    const audioURL = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceName}&text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioURL);
    await audio.play();
  } catch (err) {
    console.error("Voice error:", err);
  }
};

// Create board
for (let i = 0; i < 9; i++) {
  const cell = document.createElement('div');
  cell.classList.add('cell');
  cell.dataset.index = i;
  board.appendChild(cell);
  cell.addEventListener('click', () => makeMove(i));
}

// Mode & Difficulty
modeSelect.addEventListener('change', (e) => {
  mode = e.target.value;
  oLabel.innerHTML = mode === 'ai' ? '🤖 Bridget: <span id="oScore">' + oScore + '</span>' : '🧑 Player O: <span id="oScore">' + oScore + '</span>';
  resetGame();
});

difficultySelect.addEventListener('change', (e) => {
  difficulty = e.target.value;
});

// Move logic
const makeMove = (index) => {
  if (cells[index] || gameOver) return;

  cells[index] = currentPlayer;
  board.children[index].textContent = currentPlayer;

  const winPattern = getWinnerPattern(cells, currentPlayer);
  if (winPattern) {
    highlightWin(winPattern);
    const winType = describeWin(winPattern);
    const winnerName = currentPlayer === 'O' && mode === 'ai' ? 'Bridget 🤖' : `Player ${currentPlayer}`;
    statusText.textContent = `🎉 ${winnerName} wins! (${winType})`;
    updateScore(currentPlayer);
    gameOver = true;
    if (currentPlayer === 'O' && mode === 'ai') bridgetSpeak(`Yay! I won with a ${winType}!`);
    else bridgetSpeak(`Good job, Player ${currentPlayer}. You win!`);
    return;
  }

  if (isDraw(cells)) {
    statusText.textContent = "😐 It's a draw!";
    gameOver = true;
    bridgetSpeak("It's a draw. Let's call it even!");
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  if (mode === 'ai' && currentPlayer === 'O') {
    statusText.textContent = "Bridget 🤖 is thinking...";
    bridgetSpeak("Hmm... Let me think.");
    setTimeout(computerMove, 700);
  } else {
    statusText.textContent = `Player ${currentPlayer}'s turn`;
  }
};

// Computer move logic
const computerMove = () => {
  if (gameOver) return;
  let move;
  if (difficulty === 'easy') move = getRandomMove();
  else if (difficulty === 'medium') move = Math.random() < 0.5 ? getRandomMove() : findBestMove(cells);
  else move = findBestMove(cells);

  cells[move] = 'O';
  board.children[move].textContent = 'O';

  const winPattern = getWinnerPattern(cells, 'O');
  if (winPattern) {
    highlightWin(winPattern);
    const winType = describeWin(winPattern);
    statusText.textContent = `🤖 Bridget wins! (${winType})`;
    updateScore('O');
    gameOver = true;
    bridgetSpeak(`I win! That was a ${winType}. Better luck next time!`);
    return;
  }

  if (isDraw(cells)) {
    statusText.textContent = "😐 It's a draw!";
    gameOver = true;
    bridgetSpeak("That was close. A draw!");
    return;
  }

  currentPlayer = 'X';
  statusText.textContent = "Player X's turn";
};

// Utilities
const getWinnerPattern = (boardState, player) => {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (boardState[a] === player && boardState[b] === player && boardState[c] === player)
      return pattern;
  }
  return null;
};

const describeWin = (pattern) => {
  if ([0, 1, 2].every(i => pattern.includes(i))) return 'Horizontal (Top Row)';
  if ([3, 4, 5].every(i => pattern.includes(i))) return 'Horizontal (Middle Row)';
  if ([6, 7, 8].every(i => pattern.includes(i))) return 'Horizontal (Bottom Row)';
  if ([0, 3, 6].every(i => pattern.includes(i))) return 'Vertical (Left Column)';
  if ([1, 4, 7].every(i => pattern.includes(i))) return 'Vertical (Middle Column)';
  if ([2, 5, 8].every(i => pattern.includes(i))) return 'Vertical (Right Column)';
  if ([0, 4, 8].every(i => pattern.includes(i))) return 'Diagonal (↘)';
  if ([2, 4, 6].every(i => pattern.includes(i))) return 'Diagonal (↙)';
  return '';
};

const highlightWin = (pattern) => pattern.forEach(i => board.children[i].classList.add('win'));
const isDraw = (b) => b.every(cell => cell);
const getRandomMove = () => {
  const empty = cells.map((v, i) => (v ? null : i)).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
};

const minimax = (boardState, depth, isMax) => {
  if (getWinnerPattern(boardState, 'O')) return 10 - depth;
  if (getWinnerPattern(boardState, 'X')) return depth - 10;
  if (isDraw(boardState)) return 0;
  let best = isMax ? -Infinity : Infinity;
  for (let i = 0; i < 9; i++) {
    if (!boardState[i]) {
      boardState[i] = isMax ? 'O' : 'X';
      const score = minimax(boardState, depth + 1, !isMax);
      boardState[i] = null;
      best = isMax ? Math.max(best, score) : Math.min(best, score);
    }
  }
  return best;
};

const findBestMove = (b) => {
  let bestScore = -Infinity;
  let move;
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = 'O';
      const score = minimax(b, 0, false);
      b[i] = null;
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
};

// Score + Reset
const updateScore = (player) => {
  if (player === 'X') xScoreEl.textContent = ++xScore;
  else oScoreEl.textContent = ++oScore;
};
const resetGame = () => {
  cells = Array(9).fill(null);
  Array.from(board.children).forEach(c => { c.textContent = ''; c.classList.remove('win'); });
  gameOver = false;
  currentPlayer = 'X';
  statusText.textContent = "Player X's turn";
  if (mode === 'ai' && Math.random() < 0.5) {
    statusText.textContent = "🤖 Bridget starts...";
    bridgetSpeak("I'll start this round!");
    setTimeout(computerMove, 700);
  }
};
const resetScores = () => {
  xScore = 0; oScore = 0;
  xScoreEl.textContent = '0'; oScoreEl.textContent = '0';
  resetGame();
};

// Share feature
shareBtn.addEventListener('click', async () => {
  const message = `🎮 Tic Tac Toe Scores:
🧑 Player X: ${xScore}
🤖 Bridget: ${oScore}

Mode: ${mode === 'ai' ? 'Human vs Bridget 🤖' : 'Human vs Human'}
Difficulty: ${difficulty.toUpperCase()}

Play it now! 🔗 ${window.location.href}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Tic Tac Toe', text: message, url: window.location.href }); }
    catch (err) { console.warn(err); }
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(message);
    alert('✅ Game summary copied!');
  } else prompt('Copy this text:', message);
});

// Start
resetBtn.addEventListener('click', resetGame);
resetScoresBtn.addEventListener('click', resetScores);
resetGame();
