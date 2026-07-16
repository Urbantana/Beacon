import { Sidebar } from "./Sidebar"
import { Bell, Search, Moon, Sun } from "lucide-react"
import { useI18n } from "@/lib/i18n-context"
import { useTheme } from "@/lib/theme-context"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, isRtl } = useI18n()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={`flex min-h-screen w-full bg-background overflow-hidden${isRtl ? ' font-arabic' : ''}`}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6 shadow-sm z-10 relative gap-4">
          {/* Search */}
          <div className="relative w-full max-w-sm hidden md:flex flex-1">
            <Search className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-2.5 size-4 text-muted-foreground`} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              dir={isRtl ? 'rtl' : 'ltr'}
              className={`flex h-9 w-full rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1`}
            />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm font-semibold hover:bg-muted transition-colors"
              title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            >
              <span className="text-base leading-none">{lang === 'en' ? '🇵🇸' : '🇬🇧'}</span>
              <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive border border-background"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 scroll-smooth" dir={isRtl ? 'rtl' : 'ltr'}>
          {children}
        </main>
      </div>
    </div>
  )
}
