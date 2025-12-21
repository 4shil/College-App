export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  const c = color.trim();

  // #RGB / #RRGGBB / #RRGGBBAA
  if (c.startsWith('#')) {
    const hex = c.slice(1);
    const normalized = hex.length === 3
      ? hex.split('').map((ch) => ch + ch).join('')
      : hex;

    if (normalized.length !== 6 && normalized.length !== 8) return null;

    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);

    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  // rgb(...) / rgba(...)
  const rgbMatch = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  return null;
}

export function withAlpha(color: string, alpha: number): string {
  const rgb = parseColorToRgb(color);
  if (!rgb) return color;
  const a = clamp01(alpha);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}
