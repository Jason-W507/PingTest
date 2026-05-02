import dns from 'dns';

export interface ResolveResult {
  original: string;
  resolvedIp: string;
}

/**
 * Resolve a hostname to an IP address.
 * If the input is already an IP, return it as-is.
 */
export function resolveTarget(target: string): Promise<ResolveResult> {
  return new Promise((resolve, reject) => {
    // Check if already an IP address
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(target) || /^[0-9a-fA-F:]+$/.test(target)) {
      resolve({ original: target, resolvedIp: target });
      return;
    }

    dns.lookup(target, { family: 4 }, (err, address) => {
      if (err) {
        reject(new Error(`DNS resolution failed for "${target}": ${err.message}`));
      } else {
        resolve({ original: target, resolvedIp: address });
      }
    });
  });
}
