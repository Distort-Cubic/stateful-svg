
(() => {
  "use strict";

  // ==========================================
  // 9-BIT RGB COLOR SPACE
  // Exactly 4 SVGs
  // Hash format: #RRRGGGBBB
  // Channel intensity: binary * 32
  // ==========================================

  const NS = "http://www.w3.org/2000/svg";
  const CHANNELS = ["red", "green", "blue"];

  const state = {
    red: 0,
    green: 0,
    blue: 0
  };

  const CHANNEL_COLORS = {
    red: "#ff4444",
    green: "#44dd66",
    blue: "#4488ff"
  };

  // ==========================================
  // DOCUMENT SETUP
  // ==========================================

  document.documentElement.innerHTML = `
    <head>
      <meta charset="UTF-8">
      <title>9-bit RGB Color Space</title>
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 30px;
          background: #181818;
          color: white;
          font-family: system-ui, sans-serif;
        }

        #rgb-inputs {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
        }

        .rgb-channel {
          width: 180px;
        }

        .rgb-channel svg {
          display: block;
          width: 100%;
          height: auto;
        }

        #rgb-output svg {
          display: block;
          width: 300px;
          max-width: 100%;
          height: auto;
          margin-top: 15px;
        }

        .rgb-switch {
          cursor: pointer;
          fill: transparent;
          stroke: #888;
          stroke-width: 2;
        }

        .rgb-switch:hover {
          stroke: white;
          stroke-width: 5;
        }

        .rgb-state {
          display: none;
        }

        .rgb-state.active {
          display: inline;
        }

        #rgb-readout {
          margin-top: 16px;
          font-family: monospace;
          font-size: 18px;
        }
      </style>
    </head>

    <body>
      <h2>9-bit RGB Color Space</h2>
      <div id="rgb-inputs"></div>

      <h3>Combined color</h3>
      <div id="rgb-output"></div>

      <div id="rgb-readout"></div>
    </body>
  `;

  // ==========================================
  // ENCODING
  // ==========================================

  function bits(n) {
    return n.toString(2).padStart(3, "0");
  }

  function encode() {
    return (
      bits(state.red) +
      bits(state.green) +
      bits(state.blue)
    );
  }

  function decode(hash) {
    if (!/^[01]{9}$/.test(hash)) return false;

    state.red = parseInt(hash.slice(0, 3), 2);
    state.green = parseInt(hash.slice(3, 6), 2);
    state.blue = parseInt(hash.slice(6, 9), 2);

    return true;
  }

  // ==========================================
  // COLOR CONVERSION
  // ==========================================

  function channelHex(value) {
    return (value * 32)
      .toString(16)
      .padStart(2, "0");
  }

  function rgbHex(r, g, b) {
    return "#" +
      channelHex(r) +
      channelHex(g) +
      channelHex(b);
  }

  function currentColor() {
    return rgbHex(
      state.red,
      state.green,
      state.blue
    );
  }

  // ==========================================
  // SVG HELPER
  // ==========================================

  function createSVG(tag, attributes = {}) {
    const el = document.createElementNS(NS, tag);

    for (const [key, value] of Object.entries(attributes)) {
      el.setAttribute(key, value);
    }

    return el;
  }

  // ==========================================
  // INPUT SVG GENERATION
  // ==========================================

  function generateInput(channel) {
    const root = createSVG("svg", {
      viewBox: "0 0 300 100",
      role: "img",
      "aria-label": channel + " channel"
    });

    root.appendChild(createSVG("title"));

    root.querySelector("title").textContent =
      channel.toUpperCase();

    // CSS state definitions for all 512 URL combinations.
    const css = createSVG("style");

    let rules = "";

    for (let i = 0; i < 512; i++) {
      const shift = {
        red: 6,
        green: 3,
        blue: 0
      }[channel];

      const value = (i >> shift) & 7;

      rules += `
        #${channel}-state-${i} {
          display: ${value === 0 ? "inline" : "none"};
        }
      `;
    }

    css.textContent = rules;
    root.appendChild(css);

    // Eight visual states.
    for (let value = 0; value < 8; value++) {
      const group = createSVG("g", {
        id: `${channel}-visual-${value}`,
        class: "rgb-state"
      });

      for (let bit = 0; bit < 3; bit++) {
        const active = Boolean(
          value & (1 << (2 - bit))
        );

        group.appendChild(createSVG("rect", {
          x: bit * 100,
          y: 0,
          width: 100,
          height: 100,
          fill: active ? CHANNEL_COLORS[channel] : "#333",
          stroke: "#888",
          "stroke-width": 2
        }));
      }

      root.appendChild(group);
    }

    // Three actual SVG hyperlinks.
    for (let bit = 0; bit < 3; bit++) {
      const link = createSVG("a", {
        href: "#" + encode(),
        "data-channel": channel,
        "data-bit": bit
      });

      link.appendChild(createSVG("rect", {
        x: bit * 100,
        y: 0,
        width: 100,
        height: 100,
        class: "rgb-switch"
      }));

      root.appendChild(link);
    }

    return root;
  }

  // ==========================================
  // OUTPUT SVG GENERATION
  // ==========================================

  function generateOutput() {
    const root = createSVG("svg", {
      viewBox: "0 0 300 200",
      role: "img",
      "aria-label": "Combined RGB color"
    });

    const css = createSVG("style");

    let rules = "";

    for (let i = 0; i < 512; i++) {
      rules += `
        #rgb-color-${i} {
          display: none;
        }

        #rgb-color-${i}.active {
          display: inline;
        }
      `;
    }

    css.textContent = rules;
    root.appendChild(css);

    // Generate all 512 colors.
    for (let i = 0; i < 512; i++) {
      const r = (i >> 6) & 7;
      const g = (i >> 3) & 7;
      const b = i & 7;

      const group = createSVG("g", {
        id: `rgb-color-${i}`,
        class: "rgb-state"
      });

      group.appendChild(createSVG("rect", {
        x: 0,
        y: 0,
        width: 300,
        height: 200,
        fill: rgbHex(r, g, b)
      }));

      root.appendChild(group);
    }

    return root;
  }

  // ==========================================
  // CREATE EXACTLY FOUR SVG ELEMENTS
  // ==========================================

  const inputContainer =
    document.getElementById("rgb-inputs");

  CHANNELS.forEach(channel => {
    const section = document.createElement("section");
    section.className = "rgb-channel";

    const heading = document.createElement("h3");
    heading.textContent = channel.toUpperCase();

    section.appendChild(heading);
    section.appendChild(generateInput(channel));

    inputContainer.appendChild(section);
  });

  document.getElementById("rgb-output")
    .appendChild(generateOutput());

  // ==========================================
  // RENDER ALL FOUR SVGs
  // ==========================================

  function render() {
    const index = parseInt(encode(), 2);

    // Input SVGs.
    CHANNELS.forEach(channel => {
      const value = state[channel];

      const root = document.querySelector(
        `.rgb-channel svg[aria-label="${channel} channel"]`
      );

      root.querySelectorAll(".rgb-state").forEach(group => {
        group.classList.remove("active");
      });

      root.querySelector(
        `#${channel}-visual-${value}`
      ).classList.add("active");

      // Update all three actual SVG href links.
      root.querySelectorAll("a[data-bit]").forEach(link => {
        const bit = Number(link.dataset.bit);
        const next = {...state};

        next[channel] ^= 1 << (2 - bit);

        link.setAttribute(
          "href",
          "#" +
          bits(next.red) +
          bits(next.green) +
          bits(next.blue)
        );
      });
    });

    // Output SVG.
    const output = document.querySelector(
      "#rgb-output svg"
    );

    output.querySelectorAll(".rgb-state").forEach(group => {
      group.classList.remove("active");
    });

    output.querySelector(
      `#rgb-color-${index}`
    ).classList.add("active");

    // Readout.
    document.getElementById("rgb-readout").textContent =
      currentColor().toUpperCase() +
      " | #" + encode();
  }

  // ==========================================
  // URL NAVIGATION
  // ==========================================

  window.addEventListener("hashchange", () => {
    if (decode(location.hash.slice(1))) {
      render();
    }
  });

  // Initialize.
  if (!decode(location.hash.slice(1))) {
    history.replaceState(
      null,
      "",
      "#" + encode()
    );
  }

  // Initial rendering.
  render();

  // ==========================================
  // OPTIONAL INSPECTION API
  // ==========================================

  window.RGB9 = {
    state,
    encode,
    render,
    decode,

    getSVGs() {
      return [...document.querySelectorAll("svg")];
    }
  };

  console.log("RGB9 initialized.");
  console.log("SVG count:", RGB9.getSVGs().length);
  console.log("Color states:", 512);
  console.log("Current URL:", location.href);

})();
