export const getElevation = (r: number, g: number, b: number): number =>
  -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
