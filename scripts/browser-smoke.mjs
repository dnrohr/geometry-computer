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

const setRangeValue = async (locator, value) => {
  await locator.fill(value);
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
  await setRangeValue(
    page.getByRole("slider", { name: "Reveal progress" }),
    "0",
  );

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

  await page.getByRole("button", { name: "Compass + straightedge" }).click();
  await page.getByRole("heading", { name: "Construct a + b" }).waitFor();
  await page.getByRole("button", { name: "Export JSON" }).waitFor();

  const expressionValue = await page
    .getByRole("textbox", { name: "Expression" })
    .inputValue();
  const revealValue = await page
    .getByRole("slider", { name: "Reveal progress" })
    .inputValue();
  if (expressionValue !== "a+b" || revealValue !== "0") {
    throw new Error(
      `Tab state regression: expression=${expressionValue}, reveal=${revealValue}`,
    );
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
