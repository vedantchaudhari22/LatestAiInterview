import { useEffect } from "react"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    if (themeParam === 'dark' || themeParam === 'light') {
      // For next-themes, we can set the localStorage override immediately
      localStorage.setItem('vite-ui-theme', themeParam);
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
