import { spawn } from 'node:child_process';

const defaultTimeoutMs = 60_000;
const defaultKillGraceMs = 2_000;
const defaultMaxOutputBytes = 4 * 1024 * 1024;

export class ExternalProcessError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ExternalProcessError';
    this.kind = details.kind || 'process_error';
    this.command = details.command;
    this.code = details.code ?? null;
    this.signal = details.signal ?? null;
    this.durationMs = details.durationMs ?? null;
    this.timeoutMs = details.timeoutMs ?? null;
    this.stdout = details.stdout || '';
    this.stderr = details.stderr || '';
  }
}

function terminateProcessTree(child, signal) {
  if (!child.pid) return;

  if (process.platform !== 'win32') {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch (error) {
      if (error?.code !== 'ESRCH') {
        try {
          child.kill(signal);
        } catch {}
      }
      return;
    }
  }

  try {
    child.kill(signal);
  } catch {}
}

function appendBounded(current, chunk, maxOutputBytes) {
  const next = current + chunk.toString();
  if (Buffer.byteLength(next) <= maxOutputBytes) {
    return { output: next, exceeded: false };
  }
  return {
    output: Buffer.from(next).subarray(0, maxOutputBytes).toString(),
    exceeded: true,
  };
}

export function runExternal(command, args = [], options = {}) {
  const startedAt = Date.now();
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  const killGraceMs = options.killGraceMs ?? defaultKillGraceMs;
  const maxOutputBytes = options.maxOutputBytes ?? defaultMaxOutputBytes;
  const capture = options.capture !== false;
  const displayCommand = options.displayCommand || [command, ...args].join(' ');

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let termination = null;
    let settled = false;
    let forceKillTimer;

    const child = spawn(command, args, {
      cwd: options.cwd,
      detached: process.platform !== 'win32',
      env: options.env,
      shell: process.platform === 'win32',
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });

    const timeoutTimer = setTimeout(() => {
      termination = {
        kind: 'timeout',
        message: `${displayCommand} exceeded ${timeoutMs}ms`,
      };
      terminateProcessTree(child, 'SIGTERM');
      forceKillTimer = setTimeout(() => terminateProcessTree(child, 'SIGKILL'), killGraceMs);
    }, timeoutMs);

    const stopForOutputLimit = () => {
      if (termination) return;
      termination = {
        kind: 'output_limit',
        message: `${displayCommand} exceeded ${maxOutputBytes} captured bytes`,
      };
      terminateProcessTree(child, 'SIGTERM');
      forceKillTimer = setTimeout(() => terminateProcessTree(child, 'SIGKILL'), killGraceMs);
    };

    if (capture) {
      child.stdout.on('data', (chunk) => {
        const result = appendBounded(stdout, chunk, maxOutputBytes);
        stdout = result.output;
        if (result.exceeded) stopForOutputLimit();
        if (options.mirrorStdout) process.stdout.write(chunk);
      });
      child.stderr.on('data', (chunk) => {
        const result = appendBounded(stderr, chunk, maxOutputBytes);
        stderr = result.output;
        if (result.exceeded) stopForOutputLimit();
        if (options.mirrorStderr !== false) process.stderr.write(chunk);
      });
    }

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      clearTimeout(forceKillTimer);
      callback();
    };

    child.on('error', (error) => {
      finish(() => reject(new ExternalProcessError(`${displayCommand}: ${error.message}`, {
        command: displayCommand,
        durationMs: Date.now() - startedAt,
        kind: 'spawn_error',
        stderr,
        stdout,
        timeoutMs,
      })));
    });

    child.on('exit', (code, signal) => {
      finish(() => {
        const durationMs = Date.now() - startedAt;
        if (termination) {
          reject(new ExternalProcessError(termination.message, {
            code,
            command: displayCommand,
            durationMs,
            kind: termination.kind,
            signal,
            stderr,
            stdout,
            timeoutMs,
          }));
          return;
        }
        if (signal || code !== 0) {
          reject(new ExternalProcessError(`${displayCommand} exited ${signal ? `by signal ${signal}` : `with code ${code}`}`, {
            code,
            command: displayCommand,
            durationMs,
            kind: signal ? 'signal' : 'exit_code',
            signal,
            stderr,
            stdout,
            timeoutMs,
          }));
          return;
        }
        resolve({ code, durationMs, stderr: stderr.trim(), stdout: stdout.trim() });
      });
    });
  });
}
