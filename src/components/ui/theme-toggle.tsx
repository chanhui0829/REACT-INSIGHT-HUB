import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-700 transition-colors hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isDark ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      <span className="absolute left-1.5 top-1">
        <Sun size={10} className={!isDark ? 'text-yellow-400' : 'text-slate-400'} />
      </span>
      <span className="absolute right-1.5 top-1">
        <Moon size={10} className={isDark ? 'text-indigo-400' : 'text-slate-400'} />
      </span>
    </button>
  );
}
