import type { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDirectory = path.join(__dirname, "../logs");
const logFile = path.join(logDirectory, "requests.log");
const MAX_LOG_SIZE = 50 * 1024 * 1024;

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

function rotateLogIfNeeded(): void {
  try {
    if (!fs.existsSync(logFile)) return;

    const { size } = fs.statSync(logFile);

    if (size >= MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      const rotateFile = path.join(logDirectory, `requests-${timestamp}.log`);

      fs.renameSync(logFile, rotateFile);
    }
  } catch (error) {
    console.log("Failed to rotate the request log:", error);
  }
}

function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms\n`;
    console.log(log);

    rotateLogIfNeeded();

    fs.appendFile(logFile, log, (err) => {
      if (err) console.log("Failed to write request log:", err);
    });
  });

  next();
}

export default requestLogger;
