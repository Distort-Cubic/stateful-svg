
(() => {
  // false = human first; true = AI first
  const AI_FIRST = false;

  const HUMAN = "X";
  const AI = "O";
  const EMPTY = " ";

  const LINES = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  function winner(b) {
    for (const [a,c,d] of LINES) {
      if (b[a] !== EMPTY &&
          b[a] === b[c] &&
          b[a] === b[d]) {
        return b[a];
      }
    }
    return null;
  }

  function terminal(b) {
    return winner(b) !== null || !b.includes(EMPTY);
  }

  function minimax(b, turn) {
    const w = winner(b);

    if (w === AI) return 1;
    if (w === HUMAN) return -1;
    if (!b.includes(EMPTY)) return 0;

    let best = turn === AI ? -Infinity : Infinity;

    for (let i = 0; i < 9; i++) {
      if (b[i] !== EMPTY) continue;

      b[i] = turn;

      const score = minimax(
        b,
        turn === AI ? HUMAN : AI
      );

      b[i] = EMPTY;

      if (turn === AI) {
        best = Math.max(best, score);
      } else {
        best = Math.min(best, score);
      }
    }

    return best;
  }

  function bestAIMove(b) {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let i = 0; i < 9; i++) {
      if (b[i] !== EMPTY) continue;

      b[i] = AI;

      const score = minimax(b, HUMAN);

      b[i] = EMPTY;

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }

    return bestMove;
  }

  function playAI(b) {
    if (terminal(b)) return b;

    const move = bestAIMove(b);

    if (move !== -1) {
      b[move] = AI;
    }

    return b;
  }

  function stateId(b) {
    return "s" + b.map(v =>
      v === EMPTY ? "0" : v
    ).join("");
  }

  // Deduplicated states.
  const states = new Map();

  function generate(b) {
    const id = stateId(b);

    // Reuse an existing state if reached through another path.
    if (states.has(id)) return id;

    const state = {
      id,
      board: b.slice(),
      moves: []
    };

    states.set(id, state);

    if (terminal(b)) return id;

    // Generate every possible human move.
    for (let i = 0; i < 9; i++) {
      if (b[i] !== EMPTY) continue;

      const next = b.slice();
      next[i] = HUMAN;

      // AI automatically responds.
      if (!terminal(next)) {
        playAI(next);
      }

      const nextId = generate(next);

      state.moves.push({
        square: i,
        nextId
      });
    }

    return id;
  }

  // Initial board.
  const initial = Array(9).fill(EMPTY);

  if (AI_FIRST) {
    playAI(initial);
  }

  const rootId = generate(initial);

  // SVG geometry.
  const W = 420;
  const H = 510;
  const X0 = 30;
  const Y0 = 45;
  const CELL = 120;

  const svg = [];

  svg.push(`
  <svg xmlns="http://www.w3.org/2000/svg"
       width="${W}" height="${H}"
       viewBox="0 0 ${W} ${H}">

  <style>
    .state {
      display: none;
    }

    .board-bg {
      fill: white;
    }

    .grid {
      stroke: black;
      stroke-width: 4;
      pointer-events: none;
    }

    .mark {
      font-family: Arial, sans-serif;
      font-size: 100px;
      text-anchor: middle;
      dominant-baseline: central;
      pointer-events: none;
    }

    .xmark {
      fill: steelblue;
    }

    .omark {
      fill: darkorange;
    }

    .move {
      fill: transparent;
      cursor: pointer;
    }

    .move:hover {
      fill: #ddd;
    }

    .status {
      font-family: Arial, sans-serif;
      font-size: 17px;
      text-anchor: middle;
    }

    .instructions {
      font-family: Arial, sans-serif;
      font-size: 13px;
      text-anchor: middle;
      fill: #555;
    }

    .restart {
      cursor: pointer;
    }

    .restart:hover rect {
      fill: #555;
    }

    /* Display the initial state when no state is targeted. */
    svg:not(:has(:target)) .v${rootId} {
      display: inline;
    }

    /* Display the state corresponding to the targeted anchor. */
    ${[...states.values()].map(s => `
      svg:has(#${s.id}:target) .v${s.id} {
        display: inline;
      }
    `).join("\n")}
  </style>
  `);

  // State anchors.
  // All anchors are siblings of the state groups.
  for (const s of states.values()) {
    svg.push(`<g id="${s.id}"></g>`);
  }

  // Generate one SVG group per unique state.
  for (const s of states.values()) {
    const b = s.board;
    const w = winner(b);

    svg.push(`<g class="state v${s.id}">`);

    // Background.
    svg.push(`
      <rect class="board-bg"
            x="0" y="0"
            width="${W}" height="${H}"/>
    `);

    // Human move hyperlinks.
    for (const move of s.moves) {
      const i = move.square;

      const x = X0 + (i % 3) * CELL;
      const y = Y0 + Math.floor(i / 3) * CELL;

      svg.push(`
        <a href="#${move.nextId}">
          <rect class="move"
                x="${x}" y="${y}"
                width="${CELL}" height="${CELL}">
            <title>Play square ${i + 1}</title>
          </rect>
        </a>
      `);
    }

    // Grid.
    for (let i = 1; i <= 2; i++) {
      const p = X0 + i * CELL;

      svg.push(`
        <line class="grid"
              x1="${p}" y1="${Y0}"
              x2="${p}" y2="${Y0 + 3 * CELL}"/>

        <line class="grid"
              x1="${X0}" y1="${Y0 + i * CELL}"
              x2="${X0 + 3 * CELL}" y2="${Y0 + i * CELL}"/>
      `);
    }

    // Marks.
    for (let i = 0; i < 9; i++) {
      if (b[i] === EMPTY) continue;

      const x = X0 + (i % 3) * CELL + CELL / 2;
      const y = Y0 + Math.floor(i / 3) * CELL + CELL / 2;

      svg.push(`
        <text class="mark ${b[i] === HUMAN ? "xmark" : "omark"}"
              x="${x}" y="${y}">
          ${b[i]}
        </text>
      `);
    }

    // Game status.
    let status = "Click an empty square";

    if (w === HUMAN) {
      status = "Human wins";
    } else if (w === AI) {
      status = "AI wins";
    } else if (!b.includes(EMPTY)) {
      status = "Draw";
    }

    svg.push(`
      <text class="status" x="210" y="430">
        ${status}
      </text>
    `);

    // Restart hyperlink.
    // Always navigates to the original starting state.
    svg.push(`
      <a href="#${rootId}" class="restart">
        <rect x="150" y="445"
              width="120" height="34"
              rx="7"
              fill="#333"/>

        <text x="210" y="468"
              font-family="Arial, sans-serif"
              font-size="15"
              fill="white"
              text-anchor="middle"
              pointer-events="none">
          Restart Game
        </text>
      </a>
    `);

    svg.push(`</g>`);
  }

  // Instructions.
  svg.push(`
    <text class="instructions"
          x="210" y="495">
      Human: X | AI: O | AI responds automatically
    </text>
  `);

  svg.push(`</svg>`);

  // Add SVG to the document body.
  document.getElementById("tic-tac-toe-container")?.remove();

  const container = document.createElement("div");
  container.id = "tic-tac-toe-container";

  container.style.cssText = `
    position: relative;
    z-index: 999999;
    background: white;
    width: 420px;
    margin: 20px auto;
    padding: 10px;
    box-shadow: 0 2px 15px #888;
  `;

  container.innerHTML = svg.join("");

  document.body.appendChild(container);

  console.log("Precomputed states:", states.size);
  console.log("Starting state:", rootId);
  console.log("SVG size:", svg.join("").length, "characters");
})();
