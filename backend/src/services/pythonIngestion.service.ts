import { spawn } from "child_process";
import path from "path";

import {
  PYTHON_EXECUTABLE,
  PYTHON_INGESTION_ENABLED,
  PYTHON_INGESTION_TIMEOUT_MS,
} from "../config/rag";

export interface PythonExtractedPage {
  pageNumber: number;
  text: string;
}

interface PythonExtractionResponse {
  pages: PythonExtractedPage[];
  strategy?: string;
  warnings?: string[];
}

function getPythonWorkerPath() {
  return path.resolve(__dirname, "../../python/ingest_document.py");
}

export async function extractDocumentPagesWithPython(params: {
  filePath: string;
  fileType: string;
}): Promise<PythonExtractionResponse> {
  if (!PYTHON_INGESTION_ENABLED) {
    throw new Error("Python ingestion is disabled.");
  }

  const workerPath = getPythonWorkerPath();

  return new Promise<PythonExtractionResponse>((resolve, reject) => {
    const child = spawn(PYTHON_EXECUTABLE, [workerPath], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (handler: () => void) => {
      if (settled) return;
      settled = true;
      handler();
    };

    const timeout = setTimeout(() => {
      child.kill();
      finish(() =>
        reject(
          new Error(
            `Python ingestion timed out after ${PYTHON_INGESTION_TIMEOUT_MS}ms.${stderr ? ` ${stderr.trim()}` : ""}`,
          ),
        ),
      );
    }, PYTHON_INGESTION_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      finish(() =>
        reject(
          new Error(
            `Failed to start python ingestion worker using "${PYTHON_EXECUTABLE}": ${error.message}`,
          ),
        ),
      );
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        finish(() =>
          reject(
            new Error(
              `Python ingestion worker exited with code ${code}.${stderr ? ` ${stderr.trim()}` : ""}`,
            ),
          ),
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as PythonExtractionResponse;
        if (!Array.isArray(parsed.pages)) {
          throw new Error("Worker returned invalid pages payload.");
        }
        finish(() => resolve(parsed));
      } catch (error) {
        finish(() =>
          reject(
            new Error(
              `Python ingestion worker returned invalid JSON: ${
                error instanceof Error ? error.message : "Unknown error"
              }.${stderr ? ` ${stderr.trim()}` : ""}`,
            ),
          ),
        );
      }
    });

    child.stdin.write(
      JSON.stringify({
        filePath: params.filePath,
        fileType: params.fileType,
      }),
    );
    child.stdin.end();
  });
}
