
(() => {
  const bits = n => n.toString(2).padStart(3, "0");
  const levels = ["00", "20", "40", "60", "80", "A0", "C0", "E0"];
  const states = Array.from({ length: 512 }, (_, i) =>
    i.toString(2).padStart(9, "0")
  );

  function rgb(state) {
    return [0, 3, 6].map(i =>
      (parseInt(state.slice(i, i + 3), 2) * 32)
        .toString(16).padStart(2, "0")
    ).join("").toUpperCase();
  }

  function outputGroup(state) {
    const color = rgb(state);
    const [r, g, b] = [0, 2, 4].map(i =>
      parseInt(color.slice(i, i + 2), 16)
    );

    const textColor =
      (r * 299 + g * 587 + b * 114) / 1000 > 145
        ? "#111" : "#fff";

    return `
      <g id="${state}" class="out${state === "000000000" ? " default" : ""}">
        <rect x="0" y="0" width="360" height="160"
              rx="12" fill="#${color}"/>
        <text x="180" y="78" text-anchor="middle"
              font-family="Arial,sans-serif" font-size="30"
              font-weight="bold" fill="${textColor}">#${color}</text>
        <text x="180" y="112" text-anchor="middle"
              font-family="monospace" font-size="13"
              fill="${textColor}">${state}</text>
      </g>`;
  }

  function inputGroup(state, channel, color) {
    const start = channel * 3;
    const selected = parseInt(state.slice(start, start + 3), 2);
    const prefix = ["r", "g", "b"][channel];

    let buttons = "";

    for (let v = 0; v < 8; v++) {
      const next =
        state.slice(0, start) +
        bits(v) +
        state.slice(start + 3);

      const x = 6 + v * 44;
      const active = v === selected;

      buttons += `
        <a href="#${next}"
           aria-label="Set ${prefix.toUpperCase()} to ${levels[v]}">
          <rect x="${x}" y="34" width="36" height="36" rx="6"
                fill="${active ? color : "#fff"}"
                stroke="${color}" stroke-width="2"/>
          <text x="${x + 18}" y="57" text-anchor="middle"
                font-family="Arial,sans-serif" font-size="11"
                font-weight="bold"
                fill="${active ? "#fff" : color}">${levels[v]}</text>
        </a>`;
    }

    return `
      <g class="${prefix}-state ${prefix}-${state}${state === "000000000" ? " " + prefix + "-default" : ""}">
        ${buttons}
      </g>`;
  }

  function inputSvg(id, channel, color, y) {
    const prefix = ["r", "g", "b"][channel];

    return `
      <text x="8" y="${y - 10}"
            font-family="Arial,sans-serif"
            font-size="14" font-weight="bold" fill="${color}">
        ${prefix.toUpperCase()} CHANNEL
      </text>
      <svg id="${id}" x="0" y="${y}" width="360" height="140"
           viewBox="0 0 360 140">
        <rect width="360" height="140" rx="10" fill="#fff"/>
        ${states.map(s => inputGroup(s, channel, color)).join("")}
      </svg>`;
  }

  let css = `
    #output {
      display:block;
      width:100%;
      max-width:760px;
      height:auto;
    }

    #output .out { display:none; }
    #output .out:target { display:inline; }
    #output .out.default { display:inline; }
    #output > .out:target ~ .out.default { display:none; }

    #red .r-state,
    #green .g-state,
    #blue .b-state {
      display:none;
    }

    #red .r-default,
    #green .g-default,
    #blue .b-default {
      display:inline;
    }

    #output a { cursor:pointer; }
    text { user-select:none; }
  `;

  for (const state of states) {
    if (state === "000000000") continue;

    css += `
      #output > [id="${state}"]:target ~ #red .r-${state},
      #output > [id="${state}"]:target ~ #green .g-${state},
      #output > [id="${state}"]:target ~ #blue .b-${state} {
        display:inline;
      }

      #output > [id="${state}"]:target ~ #red .r-default,
      #output > [id="${state}"]:target ~ #green .g-default,
      #output > [id="${state}"]:target ~ #blue .b-default {
        display:none;
      }
    `;
  }

  const svg = `
    <svg id="output"
         xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 360 700"
         role="img">

      <style>${css}</style>

      <rect width="360" height="700" fill="#f4f4f4"/>

      ${states.filter(s => s !== "000000000").map(outputGroup).join("")}
      ${outputGroup("000000000")}

      ${inputSvg("red", 0, "#D00000", 210)}
      ${inputSvg("green", 1, "#008000", 380)}
      ${inputSvg("blue", 2, "#164CCB", 550)}
    </svg>`;

  const parsed = new DOMParser().parseFromString(
    svg,
    "image/svg+xml"
  );

  if (parsed.querySelector("parsererror")) {
    throw new Error("SVG generation failed.");
  }

  document.body.replaceChildren(
    document.importNode(parsed.documentElement, true)
  );

  document.body.style.margin = "0";
  document.body.style.padding = "20px";
  document.body.style.display = "flex";
  document.body.style.justifyContent = "center";
  document.body.style.background = "#f4f4f4";

  console.log("SVG elements:", document.querySelectorAll("svg").length);
  console.log("Output state groups:", document.querySelectorAll("#output > .out").length);
  console.log("Red state groups:", document.querySelectorAll("#red > .r-state").length);
  console.log("Green state groups:", document.querySelectorAll("#green > .g-state").length);
  console.log("Blue state groups:", document.querySelectorAll("#blue > .b-state").length);
})();
