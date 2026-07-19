import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const port = Number(process.env.SMOKE_PORT ?? 4175);
const host = "127.0.0.1";
const url = `http://${host}:${port}/`;
const viteBin = fileURLToPath(
  new URL("../node_modules/vite/bin/vite.js", import.meta.url),
);
const serverOutput = [];

const server = spawn(
  process.execPath,
  [viteBin, "--host", host, "--port", String(port), "--strictPort"],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  },
);

const recordOutput = (chunk) => {
  serverOutput.push(chunk.toString());
  if (serverOutput.length > 40) serverOutput.shift();
};

server.stdout.on("data", recordOutput);
server.stderr.on("data", recordOutput);

const stopServer = async () => {
  if (server.killed) return;
  server.kill();
  await delay(250);
  if (!server.killed) server.kill("SIGKILL");
};

const waitForServer = async () => {
  const started = Date.now();
  while (Date.now() - started < 30_000) {
    if (server.exitCode !== null) {
      throw new Error(
        `Vite exited before smoke test could connect.\n${serverOutput.join("")}`,
      );
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Keep polling until Vite is ready or the timeout expires.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}.\n${serverOutput.join("")}`);
};

const assertOrigamiSceneVisible = async (page, expectedName) => {
  const svg = page.getByRole("img", { name: expectedName });
  await svg.waitFor();
  const scene = await svg.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      width: box.width,
      height: box.height,
      paper: element.querySelectorAll(".origami-paper").length,
      creases: element.querySelectorAll(".origami-crease").length,
      labels: element.querySelectorAll("text.origami-object").length,
    };
  });

  if (
    scene.width <= 0 ||
    scene.height <= 0 ||
    scene.paper < 1 ||
    scene.creases < 1 ||
    scene.labels < 1
  ) {
    throw new Error(
      `Origami scene regression for ${expectedName}: ${JSON.stringify(scene)}`,
    );
  }

  const stepsPanel = page.locator(".origami-steps-panel");
  await stepsPanel.getByText("Macro").first().waitFor();
  await stepsPanel.getByText("Proof").first().waitFor();
  await stepsPanel.getByText("Degeneracy").first().waitFor();
};

const overlaps = (first, second) =>
  Math.max(
    0,
    Math.min(first.right, second.right) - Math.max(first.left, second.left),
  ) *
    Math.max(
      0,
      Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top),
    ) >
  1;

const assertOrigamiVisualContract = async (page, viewport) => {
  await page.setViewportSize(viewport);
  await page
    .getByRole("button", { name: "Multiplication trace", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: /Trace a \* b Use an intercept-style fold trace/i,
    })
    .click();
  await page.getByRole("button", { name: "Why?" }).last().click();
  await page
    .getByRole("img", { name: /Compiled origami trace: a\*b/i })
    .waitFor();

  const contract = await page.evaluate(() => {
    const box = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return undefined;
      const rect = element.getBoundingClientRect();
      return {
        selector,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const panels = [
      box(".origami-canvas-panel"),
      box(".origami-steps-panel"),
      box(".origami-inspector"),
      box(".origami-proof-card"),
    ].filter(Boolean);
    const clippedButtons = [
      ...document.querySelectorAll(".origami-workspace button"),
    ]
      .filter((element) => element.offsetParent !== null)
      .filter(
        (element) =>
          element.scrollWidth > element.clientWidth + 1 ||
          element.scrollHeight > element.clientHeight + 1,
      )
      .map((element) => element.textContent?.trim() ?? element.outerHTML);
    const svg = document
      .querySelector(".origami-canvas")
      ?.getBoundingClientRect();
    return {
      panels,
      clippedButtons,
      svg: svg
        ? {
            width: svg.width,
            height: svg.height,
          }
        : undefined,
      overlays: document.querySelectorAll(".origami-active-fold-overlay")
        .length,
      activeCreases: document.querySelectorAll(
        ".origami-active-fold-overlay.origami-visual-active-crease",
      ).length,
      highlighted: document.querySelectorAll(".is-highlighted").length,
    };
  });

  if (!contract.svg || contract.svg.width <= 0 || contract.svg.height <= 0) {
    throw new Error(
      `Visual contract blank SVG at ${viewport.width}x${viewport.height}: ${JSON.stringify(
        contract.svg,
      )}`,
    );
  }
  if (
    contract.overlays < 1 ||
    contract.activeCreases < 1 ||
    contract.highlighted < 1
  ) {
    throw new Error(
      `Visual contract missing active highlights at ${viewport.width}x${viewport.height}: ${JSON.stringify(
        {
          overlays: contract.overlays,
          activeCreases: contract.activeCreases,
          highlighted: contract.highlighted,
        },
      )}`,
    );
  }
  for (let i = 0; i < contract.panels.length; i += 1) {
    const panel = contract.panels[i];
    if (panel.width <= 0 || panel.height <= 0) {
      throw new Error(`Visual contract blank panel: ${JSON.stringify(panel)}`);
    }
    for (let j = i + 1; j < contract.panels.length; j += 1) {
      if (overlaps(panel, contract.panels[j])) {
        throw new Error(
          `Visual contract overlapping panels at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            [panel, contract.panels[j]],
          )}`,
        );
      }
    }
  }
  if (contract.clippedButtons.length > 0) {
    throw new Error(
      `Visual contract clipped button text at ${viewport.width}x${viewport.height}: ${contract.clippedButtons.join(
        " | ",
      )}`,
    );
  }
};

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const failures = [];

  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Geometry Computer" }).waitFor();
  await page.getByRole("button", { name: "Flat origami roadmap" }).waitFor();
  await page
    .getByRole("img", { name: /compiled geometric construction/i })
    .waitFor();

  await page.getByRole("textbox", { name: "Expression" }).fill("a+b");
  await page.getByRole("button", { name: "Compile construction" }).click();
  await page.getByRole("heading", { name: "Construct a + b" }).waitFor();

  await page.getByRole("button", { name: "Flat origami roadmap" }).click();
  await page.getByRole("heading", { name: "Origami Computer" }).waitFor();
  const origamiExamples = [
    { button: "Input length", image: /Compiled origami trace: a/i },
    { button: "Constant length", image: /Compiled origami trace: 2/i },
    { button: "Addition trace", image: /Compiled origami trace: a\+b/i },
    { button: "Subtraction trace", image: /Compiled origami trace: a-b/i },
    { button: "Multiplication trace", image: /Compiled origami trace: a\*b/i },
    { button: "Division trace", image: /Compiled origami trace: a\/b/i },
    { button: "Square trace", image: /Compiled origami trace: a\^2/i },
    {
      button: "Square root trace",
      image: /Compiled origami trace: sqrt\(a\)/i,
    },
  ];
  for (const example of origamiExamples) {
    await page
      .getByRole("button", { name: example.button, exact: true })
      .click();
    await assertOrigamiSceneVisible(page, example.image);
  }
  await assertOrigamiVisualContract(page, { width: 1280, height: 900 });
  await assertOrigamiVisualContract(page, { width: 390, height: 844 });

  await page.getByRole("button", { name: "Compass + straightedge" }).click();
  await page.getByRole("heading", { name: "Construct a + b" }).waitFor();
  await page.getByRole("button", { name: "Export JSON" }).waitFor();

  const expressionValue = await page
    .getByRole("textbox", { name: "Expression" })
    .inputValue();
  if (expressionValue !== "a+b") {
    throw new Error(`Tab state regression: expression=${expressionValue}`);
  }

  await delay(100);
  if (failures.length > 0) {
    throw new Error(`Browser smoke failed:\n${failures.join("\n")}`);
  }

  await browser.close();
  console.log(`Browser smoke passed at ${url}`);
} finally {
  await stopServer();
}
