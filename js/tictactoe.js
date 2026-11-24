
(() => {
  // Remove an earlier copy if the script is run again.
  document.getElementById("svg-tic-tac-toe")?.remove();

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
      if (b[a] !== EMPTY && b[a] === b[c] && b[c] === b[d])
        return b[a];
    }
    return null;
  }

  function terminal(b) {
    return winner(b) !== null || b.every(x => x !== EMPTY);
  }

  // Minimax: AI maximizes, human minimizes.
  // Faster AI wins and slower unavoidable losses are preferred.
  function minimax(b, turn, depth = 0) {
    const w = winner(b);

    if (w === AI) return 10 - depth;
    if (w === HUMAN) return depth - 10;
    if (b.every(x => x !== EMPTY)) return 0;

    const scores = [];

    for (let i = 0; i < 9; i++) {
      if (b[i] !== EMPTY) continue;

      const next = b.slice();
      next[i] = turn;

      scores.push(
        minimax(next, turn === AI ? HUMAN : AI, depth + 1)
      );
    }

    return turn === AI
      ? Math.max(...scores)
      : Math.min(...scores);
  }

  function bestAIMove(b) {
    let best = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < 9; i++) {
      if (b[i] !== EMPTY) continue;

      const next = b.slice();
      next[i] = AI;

      const score = minimax(next, HUMAN, 1);

      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }

    return best;
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  }[c]));

  const screens = [];
  let counter = 0;

  function newId(prefix) {
    return prefix + "_" + (++counter);
  }

  // IMPORTANT: Every screen has a real ID.
  function addScreen(id, content) {
    screens.push(
      `<g id="${id}" class="screen">${content}</g>`
    );
  }

  function link(x, y, w, h, target, label, color = "#f4f4f4") {
    return `
      <a href="#${target}">
        <rect x="${x}" y="${y}" width="${w}" height="${h}"
          rx="9" fill="${color}" stroke="#333" stroke-width="2"/>
        <text x="${x+w/2}" y="${y+h/2+7}"
          text-anchor="middle" font-size="19" fill="#111">
          ${esc(label)}
        </text>
      </a>`;
  }

  // -------------------------
  // START MENU
  // -------------------------

  const menuId = "ttt_menu";

  addScreen(menuId, `
    <text x="255" y="82" text-anchor="middle" class="heading">
      Tic-Tac-Toe
    </text>

    <text x="255" y="137" text-anchor="middle" class="subheading">
      Choose who moves first
    </text>

    ${link(
      55, 190, 400, 74,
      "human_first_start",
      "You go first (X)",
      "#e9f2ff"
    )}

    ${link(
      55, 292, 400, 74,
      "ai_first_start",
      "AI goes first (O)",
      "#f0ecfa"
    )}

    <text x="255" y="420" text-anchor="middle" class="small">
      Select an option to start
    </text>
  `);

  // -------------------------
  // GENERATE EACH GAME MODE
  // -------------------------

  function buildMode(mode) {
    const startId = mode === "human"
      ? "human_first_start"
      : "ai_first_start";

    const stateMap = new Map();
    const queue = [];

    let initial = Array(9).fill(EMPTY);

    // AI makes its opening move in AI-first mode.
    if (mode === "ai") {
      initial[bestAIMove(initial)] = AI;
    }

    function register(board) {
      const key = board.join("");

      if (stateMap.has(key)) {
        return stateMap.get(key);
      }

      const state = {
        id: newId(mode),
        board: board.slice(),
        next: Array(9).fill(null)
      };

      stateMap.set(key, state);
      queue.push(state);

      return state;
    }

    const root = register(initial);

    // Give the starting board the ID used by the menu link.
    root.id = startId;

    // Generate every reachable game state.
    for (let q = 0; q < queue.length; q++) {
      const state = queue[q];

      if (terminal(state.board)) continue;

      for (let i = 0; i < 9; i++) {
        if (state.board[i] !== EMPTY) continue;

        const afterHuman = state.board.slice();
        afterHuman[i] = HUMAN;

        if (terminal(afterHuman)) {
          state.next[i] = register(afterHuman);
        } else {
          const afterAI = afterHuman.slice();
          afterAI[bestAIMove(afterHuman)] = AI;

          state.next[i] = register(afterAI);
        }
      }
    }

    // Draw each generated board screen.
    for (const state of queue) {
      const b = state.board;
      const w = winner(b);
      const draw = !w && b.every(x => x !== EMPTY);

      let status = "Your turn (X)";

      if (w === HUMAN) status = "You win!";
      if (w === AI) status = "AI wins!";
      if (draw) status = "Draw!";

      let content = `
        <text x="255" y="55" text-anchor="middle" class="heading">
          Tic-Tac-Toe
        </text>

        <text x="255" y="91" text-anchor="middle" class="subheading">
          ${status}
        </text>

        <rect x="75" y="120" width="360" height="360"
          fill="#fff" stroke="#222" stroke-width="3"/>

        <path d="
          M195 120 V480
          M315 120 V480
          M75 240 H435
          M75 360 H435"
          fill="none" stroke="#222" stroke-width="3"/>
      `;

      // Draw the marks and clickable empty squares.
      for (let i = 0; i < 9; i++) {
        const x = 75 + (i % 3) * 120;
        const y = 120 + Math.floor(i / 3) * 120;

        if (b[i] === HUMAN) {
          content += `
            <text x="${x+60}" y="${y+83}"
              text-anchor="middle" class="mark human">X</text>`;
        }

        else if (b[i] === AI) {
          content += `
            <text x="${x+60}" y="${y+83}"
              text-anchor="middle" class="mark ai">O</text>`;
        }

        else if (state.next[i]) {
          // Clicking the square navigates to its next pre-generated state.
          content += `
            <a href="#${state.next[i].id}">
              <rect x="${x+2}" y="${y+2}"
                width="116" height="116"
                fill="#fff" fill-opacity="0.001"/>
            </a>`;
        }
      }

      // Reset always returns to the opening menu.
      content += link(
        105, 510, 300, 58,
        menuId,
        "Reset / Main menu"
      );

      content += `
        <text x="255" y="600" text-anchor="middle" class="small">
          ${w || draw
            ? "Game over — return to the menu to play again"
            : "Select an empty square"}
        </text>
      `;

      addScreen(state.id, content);
    }
  }

  buildMode("human");
  buildMode("ai");

  // -------------------------
  // SVG AND SCREEN SWITCHING
  // -------------------------

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 510 625"
      width="510"
      height="625">

      <style>
        /* Hide every screen by default. */
        g.screen {
          display: none;
        }

        /* Show only the screen whose ID matches the URL fragment. */
        g.screen:target {
          display: inline;
        }

        text {
          font-family: Arial, Helvetica, sans-serif;
          user-select: none;
        }

        .heading {
          font-size: 34px;
          font-weight: bold;
          fill: #111;
        }

        .subheading {
          font-size: 21px;
          fill: #333;
        }

        .small {
          font-size: 15px;
          fill: #555;
        }

        .mark {
          font-size: 88px;
          font-weight: 500;
        }

        .human {
          fill: #245b9b;
        }

        .ai {
          fill: #8a4b22;
        }

        a {
          cursor: pointer;
        }

        a:hover rect {
          fill-opacity: 0.75;
        }

        a:focus rect {
          stroke: #2878c8;
          stroke-width: 4;
        }
      </style>

      ${screens.join("\n")}

    </svg>
  `;

  const container = document.createElement("div");
  container.id = "svg-tic-tac-toe";
  container.style.cssText =
    "width:min(510px,100%);margin:24px auto;";

  container.innerHTML = svg;
  document.body.appendChild(container);

  // Select the opening menu as the initial target.
  // This is setup only; gameplay still uses SVG href links.
  window.location.hash = menuId;

})();
