
const SIZE = 510;
const HEIGHT = 625;

const HUMAN = "X";
const AI = "O";
const EMPTY = "";

const states = new Set();
const screens = [];

function winner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
    if (
      board[a] &&
      board[a] === board[b] &&
      board[b] === board[c]
    ) {
      return board[a];
    }
  }

  return board.every(Boolean) ? "draw" : null;
}

function minimax(board, turn, depth = 0) {
  const result = winner(board);

  if (result === AI) return 10 - depth;
  if (result === HUMAN) return depth - 10;
  if (result === "draw") return 0;

  const scores = [];

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;

    const next = [...board];
    next[i] = turn;

    scores.push(
      minimax(next, turn === AI ? HUMAN : AI, depth + 1)
    );
  }

  return turn === AI
    ? Math.max(...scores)
    : Math.min(...scores);
}

function bestAIMove(board) {
  let bestScore = -Infinity;
  let bestIndex = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;

    const next = [...board];
    next[i] = AI;

    const score = minimax(next, HUMAN, 1);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function makeId(mode, board) {
  return mode + "_" + board.map(v => v || "_").join("");
}

function register(mode, board) {
  const id = makeId(mode, board);

  if (states.has(id)) return id;

  states.add(id);

  const result = winner(board);
  const links = [];

  // Only generate clickable moves if the game is not over.
  if (!result) {
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;

      // Simulate the human's move.
      const afterHuman = [...board];
      afterHuman[i] = HUMAN;

      let nextId;

      if (winner(afterHuman)) {
        // Human move ends the game.
        nextId = register(mode, afterHuman);
      } else {
        // AI makes its optimal response.
        const aiIndex = bestAIMove(afterHuman);
        const afterAI = [...afterHuman];
        afterAI[aiIndex] = AI;

        // Register the resulting board, including terminal boards.
        nextId = register(mode, afterAI);
      }

      links.push({
        index: i,
        href: "#" + nextId
      });
    }
  }

  screens.push({
    id,
    mode,
    board: [...board],
    result,
    links
  });

  return id;
}

function renderMenu(humanStart, aiStart) {
  return `
    <g id="ttt_menu">
      <rect x="0" y="0" width="${SIZE}" height="${HEIGHT}"
            fill="white"/>

      <text x="255" y="100"
            text-anchor="middle"
            font-family="sans-serif"
            font-size="38"
            font-weight="bold"
            fill="black">Tic-Tac-Toe</text>

      <text x="255" y="155"
            text-anchor="middle"
            font-family="sans-serif"
            font-size="19"
            fill="black">Choose who goes first</text>

      <a href="#${humanStart}" xlink:href="#${humanStart}">
        <rect x="95" y="195"
              width="320" height="75"
              rx="10"
              fill="#eeeeee"
              stroke="black"
              stroke-width="2"/>
        <text x="255" y="241"
              text-anchor="middle"
              font-family="sans-serif"
              font-size="23"
              fill="black">You go first (X)</text>
      </a>

      <a href="#${aiStart}" xlink:href="#${aiStart}">
        <rect x="95" y="295"
              width="320" height="75"
              rx="10"
              fill="#eeeeee"
              stroke="black"
              stroke-width="2"/>
        <text x="255" y="341"
              text-anchor="middle"
              font-family="sans-serif"
              font-size="23"
              fill="black">AI goes first (O)</text>
      </a>
    </g>
  `;
}

function renderBoard(screen) {
  const { board, result, links } = screen;

  const x0 = 105;
  const y0 = 145;
  const cell = 100;
  const boardSize = cell * 3;

  let out = `
    <g>
      <text x="255" y="75"
            text-anchor="middle"
            font-family="sans-serif"
            font-size="28"
            font-weight="bold"
            fill="black">Tic-Tac-Toe</text>

      <text x="255" y="112"
            text-anchor="middle"
            font-family="sans-serif"
            font-size="17"
            fill="black">
        ${
          result === "draw"
            ? "Draw!"
            : result
              ? result + " wins!"
              : "Your turn"
        }
      </text>

      <g stroke="black" stroke-width="4" fill="none">
        <path d="M ${x0 + cell} ${y0} V ${y0 + boardSize}"/>
        <path d="M ${x0 + cell * 2} ${y0} V ${y0 + boardSize}"/>
        <path d="M ${x0} ${y0 + cell} H ${x0 + boardSize}"/>
        <path d="M ${x0} ${y0 + cell * 2} H ${x0 + boardSize}"/>
      </g>
  `;

  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;

    const cx = x0 + col * cell + cell / 2;
    const cy = y0 + row * cell + cell / 2;

    if (board[i]) {
      out += `
        <text x="${cx}" y="${cy + 17}"
              text-anchor="middle"
              font-family="sans-serif"
              font-size="58"
              font-weight="bold"
              fill="${board[i] === HUMAN ? "#1769aa" : "#c62828"}">
          ${board[i]}
        </text>
      `;
    } else if (!result) {
      const move = links.find(link => link.index === i);

      if (move) {
        out += `
          <a href="${move.href}" xlink:href="${move.href}">
            <rect x="${x0 + col * cell}"
                  y="${y0 + row * cell}"
                  width="${cell}"
                  height="${cell}"
                  fill="transparent"/>
          </a>
        `;
      }
    }
  }

  out += `
      <a href="#ttt_menu" xlink:href="#ttt_menu">
        <rect x="175" y="510"
              width="160" height="55"
              rx="8"
              fill="#eeeeee"
              stroke="black"
              stroke-width="2"/>
        <text x="255" y="545"
              text-anchor="middle"
              font-family="sans-serif"
              font-size="20"
              fill="black">Reset</text>
      </a>
    </g>
  `;

  return out;
}

function renderScreen(screen) {
  return `
    <g id="${screen.id}" class="board">

      <!-- Opaque background covering the entire menu -->
      <rect x="0" y="0"
            width="${SIZE}"
            height="${HEIGHT}"
            fill="white"
            pointer-events="all"/>

      <!-- Game board drawn above the white background -->
      ${renderBoard(screen)}

    </g>
  `;
}

// Generate the human-first starting state.
const humanStart = register(
  "human",
  Array(9).fill(EMPTY)
);

// Generate the AI-first starting state.
const aiBoard = Array(9).fill(EMPTY);
aiBoard[bestAIMove(aiBoard)] = AI;

const aiStart = register("ai", aiBoard);

// Assemble the complete standalone SVG.
const svgSource = `
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${SIZE}"
     height="${HEIGHT}"
     viewBox="0 0 ${SIZE} ${HEIGHT}">

  <rect x="0" y="0"
        width="${SIZE}"
        height="${HEIGHT}"
        fill="white"/>

  <style>
    .board {
      display: none;
    }

    .board:target {
      display: inline;
    }

    a {
      cursor: pointer;
    }
  </style>

  ${renderMenu(humanStart, aiStart)}

  ${screens.map(renderScreen).join("\n")}

</svg>
`.trim();
document.body.innerHTML = svgSource;
