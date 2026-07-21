import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const port = Number(process.env.SMOKE_PORT ?? 4175);
const host = "127.0.0.1";
const url = `http://${host}:${port}/`;
const artifactDir = fileURLToPath(
  new URL("../.artifacts/browser-smoke/", import.meta.url),
);
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
  await mkdir(artifactDir, { recursive: true });
  await page.locator(".origami-workspace").screenshot({
    path: `${artifactDir}/origami-${viewport.width}x${viewport.height}.png`,
    animations: "disabled",
  });
};

const assertOrigamiFunctionAnimationVisualContract = async (page, viewport) => {
  await page.setViewportSize(viewport);
  await page
    .getByRole("button", { name: "Shifted root f(x)=sqrt(x+1)" })
    .click();
  await page.getByRole("button", { name: "Preview fold animation" }).click();
  await page
    .getByRole("slider", { name: "Function animation progress" })
    .fill("0.3");
  await page
    .getByRole("img", {
      name: "Origami function animation: f(x) = sqrt(x + 1)",
    })
    .waitFor();

  const contract = await page.evaluate(() => {
    const parseRgb = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return undefined;
      const [r, g, b] = match[1]
        .split(",")
        .slice(0, 3)
        .map((part) => Number(part.trim()));
      return Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)
        ? { r, g, b }
        : undefined;
    };
    const luminance = (color) => {
      const channel = [color.r, color.g, color.b].map((value) => {
        const normalized = value / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return channel[0] * 0.2126 + channel[1] * 0.7152 + channel[2] * 0.0722;
    };
    const contrast = (foreground, background) => {
      const fg = parseRgb(foreground);
      const bg = parseRgb(background);
      if (!fg || !bg) return undefined;
      const lighter = Math.max(luminance(fg), luminance(bg));
      const darker = Math.min(luminance(fg), luminance(bg));
      return (lighter + 0.05) / (darker + 0.05);
    };
    const rectFor = (selector) => {
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
    const svg = rectFor(".origami-function-animation");
    const paperRegions = [
      rectFor(".origami-function-paper-base"),
      rectFor(".origami-function-paper-stationary"),
      rectFor(".origami-function-moving-panel"),
      rectFor(".origami-function-hinge"),
      rectFor(".origami-function-crease-preview"),
    ].filter(Boolean);
    const timelineChildren = [
      ...document.querySelectorAll(".origami-function-timeline > *"),
    ]
      .filter((element) => element instanceof HTMLElement)
      .filter((element) => element.offsetParent !== null)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text:
            element.textContent?.trim() ?? element.getAttribute("aria-label"),
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      });
    const clippedControls = [
      ...document.querySelectorAll(
        ".origami-function-animation-panel button, .origami-function-animation-panel select, .origami-function-animation-panel input",
      ),
    ]
      .filter((element) => element instanceof HTMLElement)
      .filter((element) => element.offsetParent !== null)
      .filter(
        (element) =>
          element.scrollWidth > element.clientWidth + 1 ||
          element.scrollHeight > element.clientHeight + 1,
      )
      .map(
        (element) =>
          element.textContent?.trim() || element.getAttribute("aria-label"),
      );
    return {
      svg,
      paperRegions,
      timelineChildren,
      clippedControls,
      movingPanels: document.querySelectorAll(".origami-function-moving-panel")
        .length,
      frontLayers: document.querySelectorAll(".origami-function-paper-front")
        .length,
      backLayers: document.querySelectorAll(".origami-function-paper-back")
        .length,
      movingShadows: document.querySelectorAll(
        ".origami-function-moving-panel-shadow",
      ).length,
      frontEdges: document.querySelectorAll(
        ".origami-function-paper-front-edge",
      ).length,
      backEdges: document.querySelectorAll(".origami-function-paper-back-edge")
        .length,
      stationaryEdges: document.querySelectorAll(
        ".origami-function-paper-stationary-edge",
      ).length,
      hingeHighlights: document.querySelectorAll(
        ".origami-function-hinge-highlight",
      ).length,
      creaseUnderlays: document.querySelectorAll(
        ".origami-function-crease-underlay",
      ).length,
      activeCreaseUnderlays: document.querySelectorAll(
        ".origami-function-active-crease-underlay",
      ).length,
      creasePreviews: document.querySelectorAll(
        ".origami-function-crease-preview",
      ).length,
      readoutContrast: (() => {
        const rect = document.querySelector(
          ".origami-function-value-strip rect",
        );
        const text = document.querySelector(
          ".origami-function-value-strip text",
        );
        const resultText = document.querySelector(
          ".origami-function-value-strip text:last-child",
        );
        if (
          !(rect instanceof SVGElement) ||
          !(text instanceof SVGElement) ||
          !(resultText instanceof SVGElement)
        ) {
          return {};
        }
        const rectFill = getComputedStyle(rect).fill;
        return {
          text: contrast(getComputedStyle(text).fill, rectFill),
          result: contrast(getComputedStyle(resultText).fill, rectFill),
        };
      })(),
    };
  });

  if (!contract.svg || contract.svg.width <= 0 || contract.svg.height <= 0) {
    throw new Error(
      `Function animation blank SVG at ${viewport.width}x${viewport.height}: ${JSON.stringify(
        contract.svg,
      )}`,
    );
  }
  if (
    contract.movingPanels < 1 ||
    contract.frontLayers < 1 ||
    contract.backLayers < 1 ||
    contract.movingShadows < 1 ||
    contract.frontEdges < 1 ||
    contract.backEdges < 1 ||
    contract.stationaryEdges < 1 ||
    contract.hingeHighlights < 1 ||
    contract.creaseUnderlays < 1 ||
    contract.activeCreaseUnderlays < 1 ||
    contract.creasePreviews < 1
  ) {
    throw new Error(
      `Function animation missing layers at ${viewport.width}x${viewport.height}: ${JSON.stringify(
        {
          movingPanels: contract.movingPanels,
          frontLayers: contract.frontLayers,
          backLayers: contract.backLayers,
          movingShadows: contract.movingShadows,
          frontEdges: contract.frontEdges,
          backEdges: contract.backEdges,
          stationaryEdges: contract.stationaryEdges,
          hingeHighlights: contract.hingeHighlights,
          creaseUnderlays: contract.creaseUnderlays,
          activeCreaseUnderlays: contract.activeCreaseUnderlays,
          creasePreviews: contract.creasePreviews,
        },
      )}`,
    );
  }
  if (
    (contract.readoutContrast.text ?? 0) < 4.5 ||
    (contract.readoutContrast.result ?? 0) < 4.5
  ) {
    throw new Error(
      `Function animation readout contrast too low at ${viewport.width}x${viewport.height}: ${JSON.stringify(
        contract.readoutContrast,
      )}`,
    );
  }
  for (const region of contract.paperRegions) {
    if (region.width <= 0 && region.height <= 0) {
      throw new Error(
        `Function animation blank paper region: ${JSON.stringify(region)}`,
      );
    }
    if (
      region.left < contract.svg.left - 2 ||
      region.right > contract.svg.right + 2 ||
      region.top < contract.svg.top - 2 ||
      region.bottom > contract.svg.bottom + 2
    ) {
      throw new Error(
        `Function animation paper escaped viewport at ${viewport.width}x${viewport.height}: ${JSON.stringify(
          { svg: contract.svg, region },
        )}`,
      );
    }
  }
  for (let i = 0; i < contract.timelineChildren.length; i += 1) {
    for (let j = i + 1; j < contract.timelineChildren.length; j += 1) {
      if (
        overlaps(contract.timelineChildren[i], contract.timelineChildren[j])
      ) {
        throw new Error(
          `Function timeline overlapping controls at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            [contract.timelineChildren[i], contract.timelineChildren[j]],
          )}`,
        );
      }
    }
  }
  if (contract.clippedControls.length > 0) {
    throw new Error(
      `Function animation clipped controls at ${viewport.width}x${viewport.height}: ${contract.clippedControls.join(
        " | ",
      )}`,
    );
  }
  await mkdir(artifactDir, { recursive: true });
  await page.locator(".origami-function-animation-panel").screenshot({
    path: `${artifactDir}/origami-function-animation-${viewport.width}x${viewport.height}.png`,
    animations: "disabled",
  });
};

const downloadText = async (page, buttonName) => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: buttonName }).click();
  const download = await downloadPromise;
  const path = await download.path();
  if (!path) throw new Error(`Download path was unavailable for ${buttonName}`);
  return {
    filename: download.suggestedFilename(),
    text: await readFile(path, "utf8"),
  };
};

const assertOrigamiExports = async (page) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole("button", { name: "Addition trace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Multiplication trace", exact: true })
    .click();
  await page
    .getByRole("img", { name: /Compiled origami trace: a\*b/i })
    .waitFor();

  const resultObjectId = "origami-segment-3";
  const resultStepId = "origami-step-3";
  const renderedIds = await page.evaluate((objectId) => {
    const element = document.querySelector(`#origami-${objectId}`);
    return {
      objectDomId: element?.id,
      objectLabel: element?.getAttribute("aria-label"),
      canvasTitle: document.querySelector("#origami-canvas-title")?.textContent,
    };
  }, resultObjectId);
  if (
    renderedIds.objectDomId !== `origami-${resultObjectId}` ||
    renderedIds.objectLabel !== "segment a * b" ||
    renderedIds.canvasTitle !== "Compiled origami trace: a*b"
  ) {
    throw new Error(
      `Origami UI ID mismatch before export: ${JSON.stringify(renderedIds)}`,
    );
  }

  const jsonDownload = await downloadText(page, "Export origami JSON");
  if (jsonDownload.filename !== "origami-trace.json") {
    throw new Error(
      `Origami JSON filename regression: ${jsonDownload.filename}`,
    );
  }
  const exportedScene = JSON.parse(jsonDownload.text);
  if (
    exportedScene.id !== "origami-compiled-scene" ||
    !exportedScene.objects?.some((object) => object.id === resultObjectId) ||
    !exportedScene.steps?.some((step) => step.id === resultStepId)
  ) {
    throw new Error(
      `Origami JSON export ID mismatch: ${JSON.stringify({
        sceneId: exportedScene.id,
        hasResultObject: exportedScene.objects?.some(
          (object) => object.id === resultObjectId,
        ),
        hasResultStep: exportedScene.steps?.some(
          (step) => step.id === resultStepId,
        ),
      })}`,
    );
  }

  const svgDownload = await downloadText(page, "Export origami SVG");
  if (svgDownload.filename !== "origami-trace.svg") {
    throw new Error(`Origami SVG filename regression: ${svgDownload.filename}`);
  }
  if (
    !svgDownload.text.includes("Compiled origami trace: a*b") ||
    !svgDownload.text.includes(`id="origami-${resultObjectId}"`)
  ) {
    throw new Error(
      `Origami SVG export ID mismatch for ${resultObjectId} in ${svgDownload.filename}`,
    );
  }
};

const assertOrigamiFunctionPanel = async (page) => {
  const input = page.getByRole("textbox", { name: "Origami function" });
  const functionPanel = page.getByLabel("Fold-computed function");
  await input.waitFor();
  await functionPanel.getByText("allowable").waitFor();
  await functionPanel.getByText("2.000").waitFor();
  await functionPanel.getByText("6/14 fallback phases, 8 certified").waitFor();
  await functionPanel
    .getByText("origami-function-phase-9 align-fold arithmetic-macro-fold")
    .waitFor();
  await page.getByRole("heading", { name: "Solver work backlog" }).waitFor();
  await page
    .getByRole("button", {
      name: "Jump to solver work origami-function-phase-9",
    })
    .click();
  await page.getByText("origami-function-phase-9 @ 0.57").waitFor();
  await page
    .getByRole("img", {
      name: "Origami function animation: f(a) = sqrt(a + 1)",
    })
    .waitFor();
  await page.getByLabel("Function paper front color").fill("#ffffff");
  await page.getByLabel("Function paper back color").fill("#101820");
  await page
    .getByRole("combobox", { name: "Function paper front pattern" })
    .selectOption("washi-wave");
  await page
    .getByRole("combobox", { name: "Function paper back pattern" })
    .selectOption("high-contrast");
  await page.getByLabel("Function paper opacity").fill("0.65");
  await page.getByLabel("Function paper pattern scale").fill("1.75");
  await page.getByLabel("Function paper pattern rotation").fill("45");
  const paperStyle = await page.evaluate(() => {
    const base = document.querySelector(".origami-function-paper-base");
    const back = document.querySelector(".origami-function-paper-back");
    const gridPattern = document.querySelector(
      "#origami-function-pattern-grid",
    );
    const frontPattern = document.querySelector(
      ".origami-function-paper-front-pattern",
    );
    const backPattern = document.querySelector(
      ".origami-function-paper-back-pattern",
    );
    return {
      baseFill: base instanceof SVGElement ? base.style.fill : undefined,
      baseOpacity: base instanceof SVGElement ? base.style.opacity : undefined,
      backFill: back instanceof SVGElement ? back.style.fill : undefined,
      frontPattern:
        frontPattern instanceof SVGElement
          ? frontPattern.dataset.pattern
          : undefined,
      frontPatternScale:
        frontPattern instanceof SVGElement
          ? frontPattern.dataset.patternScale
          : undefined,
      frontPatternRotation:
        frontPattern instanceof SVGElement
          ? frontPattern.dataset.patternRotation
          : undefined,
      backPattern:
        backPattern instanceof SVGElement
          ? backPattern.dataset.pattern
          : undefined,
      gridPatternTransform:
        gridPattern instanceof SVGElement
          ? gridPattern.getAttribute("patternTransform")
          : undefined,
    };
  });
  if (
    paperStyle.baseFill !== "rgb(255, 255, 255)" ||
    paperStyle.baseOpacity !== "0.65" ||
    paperStyle.backFill !== "rgb(16, 24, 32)" ||
    paperStyle.frontPattern !== "washi-wave" ||
    paperStyle.frontPatternScale !== "1.75" ||
    paperStyle.frontPatternRotation !== "45" ||
    paperStyle.backPattern !== "high-contrast" ||
    paperStyle.gridPatternTransform !== "rotate(45) scale(1.75)"
  ) {
    throw new Error(
      `Function paper style controls did not apply: ${JSON.stringify(paperStyle)}`,
    );
  }
  const animationDownload = await downloadText(
    page,
    "Export function animation JSON",
  );
  if (animationDownload.filename !== "origami-function-animation.json") {
    throw new Error(
      `Function animation JSON filename regression: ${animationDownload.filename}`,
    );
  }
  const animationExport = JSON.parse(animationDownload.text);
  if (
    animationExport.version !== 1 ||
    animationExport.paperStyle.frontColor !== "#ffffff" ||
    animationExport.paperStyle.backColor !== "#101820" ||
    animationExport.paperStyle.frontPattern !== "washi-wave" ||
    animationExport.paperStyle.backPattern !== "high-contrast" ||
    animationExport.paperStyle.patternScale !== 1.75 ||
    animationExport.paperStyle.patternRotation !== 45 ||
    animationExport.plan.solverReadiness.workItems[0]?.phaseId !==
      "origami-function-phase-9" ||
    animationExport.plan.solverReadiness.workItems[0]?.requiredCapability !==
      "arithmetic-macro-fold" ||
    animationExport.animation.planId !== animationExport.plan.id
  ) {
    throw new Error(
      `Function animation export missing paper style: ${JSON.stringify(animationExport)}`,
    );
  }
  const traceLink = page.getByRole("link", { name: "View trace" });
  await traceLink.waitFor();
  if ((await traceLink.getAttribute("href")) !== "#origami-trace") {
    throw new Error("Static crease-pattern comparison link target changed.");
  }
  await page.getByRole("button", { name: "Copy result label" }).click();
  await page.getByText("Copied result label").waitFor();
  if (
    (await page.evaluate(() => navigator.clipboard.readText())) !==
    "f(a) = sqrt(a + 1)"
  ) {
    throw new Error("Normalized origami function label was not copied.");
  }
  await page.getByRole("button", { name: "Copy sampled result" }).click();
  await page.getByText("Copied sampled result").waitFor();
  if (
    (await page.evaluate(() => navigator.clipboard.readText())) !==
    "f(a) = sqrt(a + 1) with a=3 => 2.000"
  ) {
    throw new Error("Sampled origami function result was not copied.");
  }

  await input.fill("a/(b-b)");
  await page.getByText("blocked").waitFor();
  await page
    .getByText(
      "Division by zero is outside the sampled origami function domain.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByText(
      /Denominator b - b: Division by zero is outside the sampled origami function domain\./,
    )
    .waitFor();
  await page.getByText("origami-function-plan-f-a-sqrt-a-1").waitFor();
  await page
    .getByRole("button", { name: "Compile origami function" })
    .waitFor({ state: "visible" });
  if (
    !(await page
      .getByRole("button", { name: "Compile origami function" })
      .isDisabled())
  ) {
    throw new Error("Invalid sampled function did not disable compilation.");
  }

  await input.fill("sqrt(a+1)");
  await page.getByText("allowable").waitFor();
  await page
    .getByRole("button", { name: "Offset quotient f(a,b,c)=(a+b)/(c+1)" })
    .click();
  await functionPanel.getByText("2.500").waitFor();
  await page.getByRole("spinbutton", { name: "c sample value" }).fill("4");
  await functionPanel.getByText("1.000").waitFor();
  await page.getByText("origami-function-plan-f-a-b-c-a-b-c-1").waitFor();
  await page
    .getByRole("button", { name: "Shifted root f(x)=sqrt(x+1)" })
    .click();
  await page.getByRole("spinbutton", { name: "x sample value" }).waitFor();
  if (
    (await page
      .getByRole("spinbutton", { name: "x sample value" })
      .inputValue()) !== "3"
  ) {
    throw new Error("Function preset did not reset the x sample value.");
  }
  await input.fill("sqrt(a+1)");
  await page.getByRole("button", { name: "Compile origami function" }).click();
  await page.getByText("origami-function-plan-f-a-sqrt-a-1").waitFor();
  await page.getByRole("button", { name: "Preview fold animation" }).click();
  await page.getByText("origami-function-phase-4 @ 0.25").waitFor();
  await page
    .getByRole("img", {
      name: "Origami function animation: f(a) = sqrt(a + 1)",
    })
    .getByText("origami-function-phase-4 align-fold", { exact: true })
    .waitFor();
  await page
    .getByRole("img", {
      name: "Origami function animation: f(a) = sqrt(a + 1)",
    })
    .getByText("Current a + 1")
    .waitFor();
  await page
    .getByRole("img", {
      name: "Origami function animation: f(a) = sqrt(a + 1)",
    })
    .getByText("Value 4.000")
    .waitFor();
  await page
    .getByRole("img", {
      name: "Origami function animation: f(a) = sqrt(a + 1)",
    })
    .getByText("Final 2.000")
    .waitFor();
  await page
    .getByRole("slider", { name: "Function animation progress" })
    .fill("0.5");
  await page.getByText("origami-function-phase-8 @ 0.50").waitFor();
  await page.getByRole("button", { name: "Next function phase" }).click();
  await page.getByText("origami-function-phase-9 @ 0.57").waitFor();
  await page
    .getByRole("combobox", { name: "Function animation speed" })
    .selectOption("2");
  await page.getByRole("button", { name: "Play function animation" }).click();
  await page
    .getByRole("button", { name: "Pause function animation" })
    .waitFor();
  await page.getByRole("checkbox", { name: "Function reduced motion" }).check();
  await page.getByRole("button", { name: "Play function animation" }).waitFor();
  await page
    .getByRole("checkbox", { name: "Function reduced motion" })
    .uncheck();
  const timeline = page.getByLabel("Origami function timeline");
  await timeline.focus();
  await page.keyboard.press("ArrowLeft");
  await page.getByText("origami-function-phase-8 @ 0.50").waitFor();
  await page.keyboard.press("ArrowRight");
  await page.getByText("origami-function-phase-9 @ 0.57").waitFor();
  await page.keyboard.press("Space");
  await page
    .getByRole("button", { name: "Pause function animation" })
    .waitFor();
};

try {
  await waitForServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 900 },
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(url).origin,
  });
  const page = await context.newPage();
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
  await assertOrigamiFunctionPanel(page);
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
  await assertOrigamiFunctionAnimationVisualContract(page, {
    width: 1280,
    height: 900,
  });
  await assertOrigamiFunctionAnimationVisualContract(page, {
    width: 390,
    height: 844,
  });
  await assertOrigamiExports(page);

  await page.getByRole("button", { name: "Compass + straightedge" }).click();
  await page.getByRole("heading", { name: "Construct a + b" }).waitFor();
  await page.getByRole("button", { name: "Export JSON" }).waitFor();

  const compassSvgDownload = await downloadText(page, "Export current SVG");
  if (
    compassSvgDownload.filename !== "construction.svg" ||
    compassSvgDownload.text.includes("paperStyle") ||
    compassSvgDownload.text.includes("origami-function-animation")
  ) {
    throw new Error(
      `Compass SVG export was polluted by origami animation state: ${JSON.stringify(
        {
          filename: compassSvgDownload.filename,
          hasPaperStyle: compassSvgDownload.text.includes("paperStyle"),
          hasFunctionAnimation: compassSvgDownload.text.includes(
            "origami-function-animation",
          ),
        },
      )}`,
    );
  }

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

  await context.close();
  await browser.close();
  console.log(`Browser smoke passed at ${url}`);
} finally {
  await stopServer();
}
