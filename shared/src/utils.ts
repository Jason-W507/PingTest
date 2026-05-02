/** Validate an IP address or hostname */
export function isValidTarget(target: string): boolean {
  if (!target || target.trim().length === 0) return false;
  const t = target.trim();
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(t)) {
    return t.split('.').every(octet => {
      const n = parseInt(octet, 10);
      return n >= 0 && n <= 255;
    });
  }
  // IPv6 (simplified check)
  if (/^[0-9a-fA-F:]+$/.test(t) && t.includes(':')) return true;
  // Hostname
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(t)) return true;
  return false;
}

/** Check if a probe is in China */
export function isChinaProbe(country: string): boolean {
  return country === 'CN';
}

/** Calculate standard deviation */
export function stdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}
