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
  await page.getByRole("img", { name: /Compiled origami trace: a/i }).waitFor();
  await page.getByRole("button", { name: "Multiplication trace" }).click();
  await page
    .getByRole("img", { name: /Compiled origami trace: a\*b/i })
    .waitFor();

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
