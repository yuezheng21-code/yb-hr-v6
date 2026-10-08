import { useState, useCallback } from 'react';

const KEY = 'hr7_theme';

function current() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

/** Light/dark theme toggle. The initial theme is set in index.html before first paint. */
export function useTheme() {
  const [theme, setThemeState] = useState(current);
  const setTheme = useCallback((t) => {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch { /* storage unavailable */ }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#ffffff' : '#0f1013');
    setThemeState(t);
  }, []);
  const toggle = useCallback(() => setTheme(current() === 'light' ? 'dark' : 'light'), [setTheme]);
  return { theme, setTheme, toggle };
}
