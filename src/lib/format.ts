export function formatPercent(value: number | null | undefined, decimals = 1) {
  const v = Number(value ?? 0);
  if (Number.isNaN(v)) return '—';
  return `${v.toFixed(decimals)}%`;
}

export function formatStake(value: number | null | undefined) {
  const v = Number(value ?? 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return `${v}`;
}

export function formatBytes(bytes: number | null | undefined, decimals = 1) {
  const b = Number(bytes ?? 0);
  if (b < 1024) return `${b} B`;
  const units = ['KB', 'MB', 'GB', 'TB', 'PB'];
  let u = -1;
  let x = b;
  do {
    x /= 1024;
    u++;
  } while (x >= 1024 && u < units.length - 1);
  return `${x.toFixed(decimals)} ${units[Math.max(0, u)]}`;
}
