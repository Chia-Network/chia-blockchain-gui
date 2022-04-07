export default function useColorModeValue(theme, color: string): string {
  const isDark = theme.palette.mode === 'dark';

  const value = isDark 
    ? theme.palette[color].dark
    : theme.palette[color].light;

  return value ?? theme.palette[color].main;
}