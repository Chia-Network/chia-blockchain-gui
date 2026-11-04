/**
 * chia.net brand palette, plus the product values the brand does not define (dark surfaces, the destructive fill,
 * status colors). Static tokens only — not loaded from network or user input.
 */
export const ChiaNetBrand = {
  navy: '#122957',
  blue: '#1B397A',
  blueWash: '#EFF4FA',
  blueTint: '#D9EAFF',
  green: '#35A754',
  greenLight: '#4EBC6D',
  forest: '#20803C',
  ground: '#F6F7F9',
  white: '#FAFBFC',
  grayWash: '#EEF0F5',
  border: '#DDE1E9',
  borderStrong: '#848B98',
  muted: '#656D7B',
  label: '#505760',
  error: '#B42318',
} as const;

/** Mode tokens the shared component rules read. */
export type ChiaNetModeTokens = {
  ground: string;
  card: string;
  field: string;
  text: string;
  muted: string;
  hairline: string;
  edge: string;
  primary: string;
  primaryHover: string;
  onPrimary: string;
  secondaryFill: string;
  hover: string;
  selected: string;
  navCurrent: string;
  mark: string;
  focus: string;
  destructive: string;
  errorText: string;
  tooltip: string;
  shadowLow: string;
  shadowMid: string;
  shadowHigh: string;
};

export const ChiaNetLight: ChiaNetModeTokens = {
  ground: ChiaNetBrand.ground,
  card: ChiaNetBrand.white,
  field: ChiaNetBrand.white,
  text: ChiaNetBrand.navy,
  muted: ChiaNetBrand.muted,
  hairline: ChiaNetBrand.border,
  edge: ChiaNetBrand.borderStrong,
  primary: ChiaNetBrand.blue,
  primaryHover: ChiaNetBrand.navy,
  onPrimary: ChiaNetBrand.white,
  secondaryFill: ChiaNetBrand.white,
  hover: ChiaNetBrand.grayWash,
  selected: '#E8F0FD',
  navCurrent: '#F2F4F7',
  mark: ChiaNetBrand.forest,
  focus: ChiaNetBrand.blue,
  destructive: '#D1343A',
  errorText: ChiaNetBrand.error,
  tooltip: ChiaNetBrand.navy,
  shadowLow: '0 1px 2px 0 rgba(18, 41, 87, 0.06)',
  shadowMid: '0 4px 24px rgba(18, 41, 87, 0.07), 0 1px 4px rgba(18, 41, 87, 0.04)',
  shadowHigh: '0 4px 32px rgba(18, 41, 87, 0.07), 0 1px 4px rgba(18, 41, 87, 0.04)',
};

/** Dark: a #0E1E3D ground with #1C2740 cards; Chia Navy itself is too bright for product cards. */
export const ChiaNetDark: ChiaNetModeTokens = {
  ground: '#0E1E3D',
  card: '#1C2740',
  field: '#161E32',
  text: ChiaNetBrand.white,
  muted: '#C2C6CD',
  hairline: '#374057',
  edge: '#707887',
  primary: '#6FA8FF',
  primaryHover: '#9CC4FF',
  onPrimary: '#0E1E3D',
  secondaryFill: 'transparent',
  hover: '#303A51',
  selected: '#203559',
  navCurrent: '#273350',
  mark: ChiaNetBrand.greenLight,
  focus: ChiaNetBrand.white,
  destructive: '#D1343A',
  errorText: '#FF8A80',
  tooltip: '#303A51',
  shadowLow: '0 1px 2px 0 rgba(0, 0, 0, 0.08)',
  shadowMid: '0 2px 4px -1px rgba(0, 0, 0, 0.12)',
  shadowHigh: '0 4px 8px -2px rgba(0, 0, 0, 0.15)',
};

/**
 * Status colors, kept apart from the brand green: brand green is a mark, never a status. They're used as text,
 * so each clears 4.5:1 on cards; the light warning is the brand amber (#B87A00) darkened for that.
 */
export const ChiaNetStatus = {
  light: { success: '#18794D', warning: '#9A6700' },
  dark: { success: '#4CC38A', warning: '#F0C000' },
} as const;
