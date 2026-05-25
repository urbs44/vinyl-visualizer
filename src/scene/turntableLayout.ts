export const TURNTABLE_LAYOUT = {
  cabinetWidth: 560,
  cabinetHeight: 460,
  platterSize: 382,
  platterShadow: 14,
  vinylSize: 360,
} as const;

export function getVerticalCirclePadding(): number {
  const outerCircleSize = TURNTABLE_LAYOUT.platterSize + TURNTABLE_LAYOUT.platterShadow * 2;
  return (TURNTABLE_LAYOUT.cabinetHeight - outerCircleSize) / 2;
}
