import { useColorScheme } from './useColorScheme';
import { Theme, ThemeDark, ThemeType } from '@/constants/Colors';

export type AppColors = ThemeType['colors'];

export function useTheme(): ThemeType & { isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const t = isDark ? ThemeDark : Theme;
  return { ...t, isDark };
}
