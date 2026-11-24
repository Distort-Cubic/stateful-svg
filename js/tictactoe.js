
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
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
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

  let best = turn === AI ? -Infinity : Infinity;

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;

    board[i] = turn;
    const score = minimax(board, turn === AI ? HUMAN : AI, depth + 1);
    board[i] = EMPTY;

    best = turn === AI
      ? Math.max(best, score)
      : Math.min(best, score);
  }

  return best;
}

function bestAIMove(board) {
  let bestScore = -Infinity;
  let bestIndex = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;

    board[i] = AI;
    const score = minimax(board, HUMAN, 1);
    board[i] = EMPTY;

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

  if (!result) {
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;

      const next = [...board];
      next[i] = HUMAN;

      if (!winner(next)) {
        const aiIndex = bestAIMove(next);
        next[aiIndex] = AI;
      }

      links.push({
        index: i,
        href: "#" + register(mode, next)
      });
    }
  }

  screens.push({ id, board: [...board], result, links });

  return id;
}

// Reusable SVG definitions.
function renderDefs() {
  return `
    <defs>
      <!-- Text styles -->
      <text id="title" text-anchor="middle"
            font-family="sans-serif" font-size="28"
            font-weight="bold" fill="black">
        Tic-Tac-Toe
      </text>

      <text id="menu-title" text-anchor="middle"
            font-family="sans-serif" font-size="38"
            font-weight="bold" fill="black">
        Tic-Tac-Toe
      </text>

      <text id="subtitle" text-anchor="middle"
            font-family="sans-serif" font-size="19"
            fill="black">
        Choose who goes first
      </text>

      <text id="turn" text-anchor="middle"
            font-family="sans-serif" font-size="17"
            fill="black"/>

      <text id="human-label" text-anchor="middle"
            font-family="sans-serif" font-size="23"
            fill="black">
        You go first (X)
      </text>

      <text id="ai-label" text-anchor="middle"
            font-family="sans-serif" font-size="23"
            fill="black">
        AI goes first (O)
      </text>

      <text id="reset-label" text-anchor="middle"
            font-family="sans-serif" font-size="20"
            fill="black">
        Reset
      </text>

      <!-- Reusable marks -->
      <g id="mark-x" fill="none"
         stroke="#1769aa" stroke-width="9"
         stroke-linecap="round">
        <path d="M -25 -25 L 25 25 M 25 -25 L -25 25"/>
      </g>

      <circle id="mark-o" cx="0" cy="0" r="29"
              fill="none" stroke="#c62828"
              stroke-width="9"/>

      <!-- Reusable button -->
      <rect id="button" width="320" height="75"
            rx="10" fill="#eeeeee"
            stroke="black" stroke-width="2"/>

      <rect id="reset-button" width="160" height="55"
            rx="8" fill="#eeeeee"
            stroke="black" stroke-width="2"/>

      <!-- Reusable board grid -->
      <g id="grid" stroke="black"
         stroke-width="4" fill="none">
        <path d="M 100 0 V 300 M 200 0 V 300
                 M 0 100 H 300 M 0 200 H 300"/>
      </g>

      <!-- Reusable clickable cell -->
      <rect id="cell-hit" width="100" height="100"
            fill="transparent"/>
    </defs>
  `;
}

// Reusable SVG text reference.
function use(id, x, y, extra = "") {
  return `<use href="#${id}" x="${x}" y="${y}" ${extra}/>`;
}

function renderMenu(humanStart, aiStart) {
  return `
    <g id="ttt_menu">
      <rect width="${SIZE}" height="${HEIGHT}" fill="white"/>

      ${use("menu-title", 255, 100)}
      ${use("subtitle", 255, 155)}

      <a href="#${humanStart}">
        ${use("button", 95, 195)}
        ${use("human-label", 255, 241)}
      </a>

      <a href="#${aiStart}">
        ${use("button", 95, 295)}
        ${use("ai-label", 255, 341)}
      </a>
    </g>
  `;
}

function renderBoard(screen) {
  const { board, result, links } = screen;

  const x0 = 105;
  const y0 = 145;
  const cell = 100;

  let out = `
    ${use("title", 255, 75)}

    <text x="255" y="112"
          text-anchor="middle"
          font-family="sans-serif"
          font-size="17"
          fill="black">
      ${result === "draw"
        ? "Draw!"
        : result
          ? result + " wins!"
          : "Your turn"}
    </text>

    ${use("grid", x0, y0)}
  `;

  for (let i = 0; i < 9; i++) {
    const x = x0 + (i % 3) * cell;
    const y = y0 + Math.floor(i / 3) * cell;

    if (board[i]) {
      out += use(
        board[i] === HUMAN ? "mark-x" : "mark-o",
        x + 50,
        y + 50
      );
    } else if (!result) {
      const move = links[i < 0 ? -1 : links.findIndex(l => l.index === i)];

      if (move) {
        out += `
          <a href="${move.href}">
            ${use("cell-hit", x, y)}
          </a>
        `;
      }
    }
  }

  out += `
    <a href="#ttt_menu">
      ${use("reset-button", 175, 510)}
      ${use("reset-label", 255, 545)}
    </a>
  `;

  return out;
}

function renderScreen(screen) {
  return `
    <g id="${screen.id}" class="board">
      <rect width="${SIZE}" height="${HEIGHT}"
            fill="white" pointer-events="all"/>
      ${renderBoard(screen)}
    </g>
  `;
}

// Starting states.
const humanStart = register("human", Array(9).fill(EMPTY));

const aiBoard = Array(9).fill(EMPTY);
aiBoard[bestAIMove(aiBoard)] = AI;

const aiStart = register("ai", aiBoard);

// Generate SVG.
const svgSource = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${SIZE}" height="${HEIGHT}"
     viewBox="0 0 ${SIZE} ${HEIGHT}">

  ${renderDefs()}

  <rect width="${SIZE}" height="${HEIGHT}" fill="white"/>

  <style>
    .board { display: none; }
    .board:target { display: inline; }
    a { cursor: pointer; }
  </style>

  ${renderMenu(humanStart, aiStart)}
  ${screens.map(renderScreen).join("")}

</svg>
`.trim();

// Display SVG.
const parsed = new DOMParser().parseFromString(
  svgSource,
  "image/svg+xml"
);

document.body.replaceChildren(
  document.importNode(parsed.documentElement, true)
);
