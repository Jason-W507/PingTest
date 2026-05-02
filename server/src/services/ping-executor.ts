import { exec } from 'child_process';
import os from 'os';
import { parsePingOutput, type ParsedPing } from '../utils/ping-parser.js';

const platform = os.platform(); // 'win32' | 'linux' | 'darwin'

/**
 * Build the ping command for the current OS.
 * On Windows, prefix with chcp 65001 to force UTF-8 output
 * so Chinese locale ping output is correctly decoded.
 */
function buildPingCommand(target: string, count: number, timeoutMs: number): string {
  if (platform === 'win32') {
    return `chcp 65001 > nul && ping -n ${count} -w ${timeoutMs} ${target}`;
  }
  const timeoutSec = Math.max(1, Math.ceil(timeoutMs / 1000));
  return `ping -c ${count} -W ${timeoutSec} ${target}`;
}

export interface PingResult {
  parsed: ParsedPing | null;
  rawOutput: string;
  error: string | null;
}

/**
 * Execute a system ping command and parse the output.
 * Uses UTF-8 encoding to correctly handle Chinese locale output.
 */
export function executePing(
  target: string,
  count: number = 4,
  timeoutMs: number = 3000,
): Promise<PingResult> {
  const cmd = buildPingCommand(target, count, timeoutMs);
  const totalTimeout = timeoutMs * count + 3000;

  return new Promise((resolve) => {
    exec(cmd, {
      timeout: totalTimeout,
      windowsHide: true,
      encoding: 'utf8',
    }, (error, stdout, stderr) => {
      const rawOutput = stdout || stderr || '';

      if (error && !rawOutput) {
        resolve({
          parsed: null,
          rawOutput: '',
          error: error.message || 'Ping command failed',
        });
        return;
      }

      const parsed = parsePingOutput(rawOutput);

      if (!parsed) {
        resolve({
          parsed: null,
          rawOutput,
          error: 'Unable to parse ping output',
        });
        return;
      }

      resolve({
        parsed,
        rawOutput,
        error: null,
      });
    });
  });
}
