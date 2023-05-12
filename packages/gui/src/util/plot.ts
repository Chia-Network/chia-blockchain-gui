export const UI_ACTUAL_SPACE_CONSTANT_FACTOR = 0.78;

export function expectedPlotSize(k: number) {
  return (2 * k + 1) * 2 ** (k - 1);
}
