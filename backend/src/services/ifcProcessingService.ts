import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Resolved once at module load — works for both ts-node (src/services/) and
// compiled output (dist/services/), because both sit two levels below /python.
const SCRIPT_DIR = path.resolve(__dirname, '../../python');
const PYTHON_SCRIPT = path.join(SCRIPT_DIR, 'ifc_to_excel.py');

const TIMEOUT_MS = parseInt(
  process.env['IFC_CONVERSION_TIMEOUT_MS'] ?? '300000',
  10,
); // default 5 min

// ── Python executable resolution ──────────────────────────────────────────────
// Priority: PYTHON_BIN env var → venv inside backend/python/venv → system python

function resolvePythonExecutable(): string {
  const envBin = process.env['PYTHON_BIN'];
  if (envBin) return envBin;

  const venvCandidates = [
    path.join(SCRIPT_DIR, 'venv', 'Scripts', 'python.exe'), // Windows venv
    path.join(SCRIPT_DIR, 'venv', 'bin', 'python3'),        // Unix venv
    path.join(SCRIPT_DIR, 'venv', 'bin', 'python'),         // Unix venv alt
  ];

  for (const candidate of venvCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Calls `ifc_to_excel.py` with the given IFC file and output xlsx path,
 * waits for the Python process to finish, and returns the absolute path to
 * the generated Excel file.
 *
 * Rejects if:
 *  - the IFC file does not exist
 *  - the Python process exits with a non-zero code
 *  - the expected output file is not present after the process ends
 *  - the conversion exceeds TIMEOUT_MS (default 5 min)
 */
export function convertIfcToExcel(
  ifcFilePath: string,
  outputXlsxPath: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const absoluteIfc = path.resolve(ifcFilePath);
    const absoluteXlsx = path.resolve(outputXlsxPath);

    if (!fs.existsSync(absoluteIfc)) {
      reject(new Error(`IFC file not found: ${absoluteIfc}`));
      return;
    }

    // Ensure the output directory exists before spawning
    fs.mkdirSync(path.dirname(absoluteXlsx), { recursive: true });

    const pythonBin = resolvePythonExecutable();

    const child = spawn(
      pythonBin,
      [PYTHON_SCRIPT, absoluteIfc, absoluteXlsx, '--no-geom'],
      {
        cwd: SCRIPT_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Force line-buffered, UTF-8 output so logs stream through the pipe
          // immediately instead of buffering until the process exits.
          PYTHONUNBUFFERED: '1',
          PYTHONIOENCODING: 'utf-8',
        },
      },
    );

    let stdoutBuf = '';
    let stderrBuf = '';

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf-8');
      stdoutBuf += text;
      // Forward each non-empty line with a prefix so it's traceable in server logs
      for (const line of text.split('\n')) {
        if (line.trim()) process.stdout.write(`[IFC] ${line}\n`);
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf-8');
      stderrBuf += text;
      for (const line of text.split('\n')) {
        if (line.trim()) process.stderr.write(`[IFC] ${line}\n`);
      }
    });

    // timedOut flag prevents the 'close' handler from double-rejecting the
    // Promise after we already rejected it in the timeout callback.
    let timedOut = false;
    const killTimer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      // Windows does not honour SIGTERM — send SIGKILL after a 5-second grace period
      setTimeout(() => {
        try { child.kill('SIGKILL'); } catch { /* already exited */ }
      }, 5_000);
      reject(
        new Error(
          `IFC conversion timed out after ${TIMEOUT_MS / 1000}s. ` +
          `Consider increasing IFC_CONVERSION_TIMEOUT_MS.`,
        ),
      );
    }, TIMEOUT_MS);

    child.on('close', (code: number | null) => {
      clearTimeout(killTimer);
      if (timedOut) return; // Promise already rejected by the timer above

      if (code !== 0) {
        reject(
          new Error(
            `Python IFC converter exited with code ${code ?? 'null'}. ` +
            `Stderr: ${stderrBuf.slice(0, 800)}`,
          ),
        );
        return;
      }

      // Python prints "XLSX_OUTPUT:<path>" as the last stdout line —
      // use it as the authoritative output path (handles safe_write fallbacks).
      const match = /^XLSX_OUTPUT:(.+)$/m.exec(stdoutBuf);
      const resolvedXlsx = match ? match[1].trim() : absoluteXlsx;

      if (!fs.existsSync(resolvedXlsx)) {
        reject(
          new Error(
            `IFC conversion completed but output file not found: ${resolvedXlsx}`,
          ),
        );
        return;
      }

      resolve(resolvedXlsx);
    });

    child.on('error', (err: Error) => {
      clearTimeout(killTimer);
      reject(
        new Error(
          `Failed to spawn Python process ("${pythonBin}"): ${err.message}. ` +
          `Install dependencies with: cd backend/python && python -m venv venv ` +
          `&& venv/Scripts/activate && pip install -r requirements.txt`,
        ),
      );
    });
  });
}

console.log('IFC processing service loaded.');