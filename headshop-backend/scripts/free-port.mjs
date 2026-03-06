import { execSync } from "node:child_process";
import os from "node:os";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT ?? 3333);

if (!Number.isInteger(port) || port <= 0) {
  console.error("PORT inválida; defina PORT no .env.");
  process.exit(1);
}

function killWindows(targetPort) {
  let output;
  try {
    output = execSync(`netstat -ano | findstr :${targetPort}`, { encoding: "utf-8" });
  } catch {
    return;
  }

  const pids = Array.from(
    new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && pid !== "0")
    )
  );

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Matou PID ${pid} que usava a porta ${targetPort}`);
    } catch {
      // ignore failures (process may have exited)
    }
  }
}

function killUnix(targetPort) {
  try {
    const output = execSync(`lsof -ti tcp:${targetPort}`, { encoding: "utf-8" });
    const pids = Array.from(new Set(output.split(/\s+/).filter(Boolean)));
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        console.log(`Matou PID ${pid} que usava a porta ${targetPort}`);
      } catch {
        // ignore
      }
    }
    return;
  } catch {
    // fallback to fuser
  }

  try {
    execSync(`fuser -k ${targetPort}/tcp`, { stdio: "ignore" });
  } catch {
    // nothing else to do
  }
}

if (os.platform() === "win32") {
  killWindows(port);
} else {
  killUnix(port);
}
