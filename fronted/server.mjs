import { spawnSync } from "node:child_process";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.resolve(frontendDirectory, "..", "WasteEnergy");
const backendExecutable = path.join(
  tmpdir(),
  `wasteenergy-api-${process.pid}${process.platform === "win32" ? ".exe" : ""}`,
);

const build = spawnSync(
  process.env.CXX || "g++",
  [
    "-std=c++17",
    "-O2",
    "-Wall",
    "-Wextra",
    "-pedantic",
    path.join(sourceDirectory, "backend.cpp"),
    path.join(sourceDirectory, "backend_api.cpp"),
    "-o",
    backendExecutable,
  ],
  { encoding: "utf8", timeout: 120_000 },
);

if (build.error || build.status !== 0) {
  const detail =
    build.error?.message || build.stderr || "C++ compilation failed.";
  console.error(detail);
  process.exit(1);
}

const readNumber = (value, label) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
  return value;
};

function runBackend(args) {
  const result = spawnSync(backendExecutable, args.map(String), {
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });
  if (result.error) {
    throw new Error(`Could not run the C++ optimizer: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      result.stderr.trim() || "The C++ backend rejected the request.",
    );
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error("The C++ backend returned an invalid response.");
  }
}

function validateEstimate(body) {
  const numericFields = [
    "plantCapacityMw",
    "capacityUtilizationPercent",
    "dailyWasteTonnes",
    "capitalCostCrore",
    "grantCrore",
    "averageSbiMclrPercent",
    "matRatePercent",
  ];
  const values = numericFields.map((field) => readNumber(body[field], field));
  const operatingDaysPerYear = readNumber(
    body.operatingDaysPerYear,
    "operatingDaysPerYear",
  );
  const projectYear = readNumber(body.projectYear, "projectYear");
  if (
    !Number.isInteger(operatingDaysPerYear) ||
    !Number.isInteger(projectYear)
  ) {
    throw new Error("Operating days and project year must be whole numbers.");
  }
  return [
    "estimate",
    values[0],
    values[1],
    values[2],
    operatingDaysPerYear,
    values[3],
    values[4],
    projectYear,
    values[5],
    values[6],
  ];
}

function validateOptimization(body) {
  const budget = readNumber(body.capitalBudgetCrore, "capitalBudgetCrore");
  const waste = readNumber(
    body.availableWasteTonnesPerDay,
    "availableWasteTonnesPerDay",
  );
  if (!Array.isArray(body.plants) || body.plants.length > 16) {
    throw new Error("Provide up to 16 plant options.");
  }

  const args = ["optimize", budget, waste, body.plants.length];
  const plants = body.plants.map((plant, index) => {
    if (!plant || typeof plant !== "object") {
      throw new Error(`Plant ${index + 1} is invalid.`);
    }
    const values = [
      readNumber(plant.capacityMw, `Plant ${index + 1} capacity`),
      readNumber(
        plant.capacityUtilizationPercent,
        `Plant ${index + 1} utilization`,
      ),
      readNumber(plant.dailyWasteTonnes, `Plant ${index + 1} waste input`),
      readNumber(plant.capitalCostCrore, `Plant ${index + 1} capital cost`),
    ];
    args.push(...values);
    return {
      ...plant,
      ...Object.fromEntries(
        [
          "capacityMw",
          "capacityUtilizationPercent",
          "dailyWasteTonnes",
          "capitalCostCrore",
        ].map((key, valueIndex) => [key, values[valueIndex]]),
      ),
    };
  });
  return { args, plants };
}

function validateDispatch(body) {
  const availableGeneration = readNumber(
    body.availableGenerationMwhPerDay,
    "availableGenerationMwhPerDay",
  );
  const streetLampWattage = readNumber(
    body.streetLampWattage,
    "streetLampWattage",
  );
  const streetLampHours = readNumber(
    body.streetLampHoursPerNight,
    "streetLampHoursPerNight",
  );
  if (!Array.isArray(body.loads) || body.loads.length > 16) {
    throw new Error("Provide up to 16 priority loads.");
  }

  const args = [
    "dispatch",
    availableGeneration,
    streetLampWattage,
    streetLampHours,
    body.loads.length,
  ];
  const loads = body.loads.map((load, index) => {
    if (!load || typeof load !== "object") {
      throw new Error(`Priority load ${index + 1} is invalid.`);
    }
    const priority = readNumber(
      load.priority,
      `Priority load ${index + 1} priority`,
    );
    if (!Number.isInteger(priority)) {
      throw new Error(
        `Priority load ${index + 1} must use a whole-number priority.`,
      );
    }
    const demandMwhPerDay = readNumber(
      load.demandMwhPerDay,
      `Priority load ${index + 1} daily demand`,
    );
    args.push(priority, demandMwhPerDay);
    return { ...load, priority, demandMwhPerDay };
  });
  return { args, loads };
}

async function readRequestBody(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 100_000) {
      throw new Error("Request body exceeds the 100 KB limit.");
    }
    chunks.push(chunk);
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Request body must contain a valid JSON object.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request JSON must be an object.");
  }
  return body;
}

function respondJson(response, status, value) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(value));
}

async function handleApi(request, response) {
  const route = new URL(request.url, "http://localhost").pathname;
  if (route === "/api/health" && request.method === "GET") {
    respondJson(response, 200, { status: "ok", backend: "C++" });
    return;
  }

  if (!["/api/estimate", "/api/optimize", "/api/dispatch"].includes(route)) {
    respondJson(response, 404, { error: "API route not found." });
    return;
  }
  if (request.method !== "POST") {
    respondJson(response, 405, { error: "Use POST for this API route." });
    return;
  }

  try {
    const body = await readRequestBody(request);
    if (route === "/api/estimate") {
      respondJson(response, 200, runBackend(validateEstimate(body)));
      return;
    }

    if (route === "/api/dispatch") {
      const { args, loads } = validateDispatch(body);
      const result = runBackend(args);
      result.loads = result.loads.map((load) => ({
        ...loads[load.index],
        ...load,
      }));
      result.orderedLoads = result.queueOrder.map(
        (index) => result.loads[index],
      );
      respondJson(response, 200, result);
      return;
    }

    const { args, plants } = validateOptimization(body);
    const result = runBackend(args);
    result.selectedPlants = result.selectedIndices.map(
      (index) => plants[index],
    );
    respondJson(response, 200, result);
  } catch (error) {
    respondJson(response, 400, { error: error.message });
  }
}

const server = createHttpServer(async (request, response) => {
  if (request.url.startsWith("/api/")) {
    await handleApi(request, response);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    const distDirectory = path.join(frontendDirectory, "dist");
    let requestPath;
    try {
      requestPath = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
    } catch {
      response.writeHead(400);
      response.end("Invalid URL");
      return;
    }
    const requestedFile = path.resolve(distDirectory, `.${requestPath}`);
    const safeRoot = path.resolve(distDirectory);
    const isInsideDist =
      requestedFile === safeRoot ||
      requestedFile.startsWith(`${safeRoot}${path.sep}`);
    const hasRequestedFile =
      isInsideDist &&
      existsSync(requestedFile) &&
      statSync(requestedFile).isFile();
    const file = hasRequestedFile
      ? requestedFile
      : path.join(distDirectory, "index.html");
    const contentType = file.endsWith(".js")
      ? "text/javascript; charset=utf-8"
      : file.endsWith(".css")
        ? "text/css; charset=utf-8"
        : "text/html; charset=utf-8";
    response.writeHead(200, { "content-type": contentType });
    response.end(readFileSync(file));
    return;
  }

  vite.middlewares(request, response, () => {
    response.writeHead(404);
    response.end("Not found");
  });
});

const vite =
  process.env.NODE_ENV === "production"
    ? null
    : await import("vite").then(({ createServer }) =>
        createServer({
          configFile: path.join(frontendDirectory, "vite.config.js"),
          server: { middlewareMode: true, hmr: { server } },
          appType: "spa",
        }),
      );

const port = Number(process.env.PORT || 5173);
server.listen(port, "127.0.0.1", () => {
  console.log(`WattCycle is ready at http://127.0.0.1:${port}`);
  console.log(
    "C++ estimate and portfolio optimization APIs are available at /api.",
  );
});

async function shutdown() {
  server.close();
  if (vite) await vite.close();
  try {
    await import("node:fs/promises").then(({ unlink }) =>
      unlink(backendExecutable),
    );
  } catch {
    // The operating system may already have removed the temporary executable.
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
