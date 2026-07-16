import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Navigation,
  Map as MapIcon,
  Leaf,
  Wallet,
} from "lucide-react"
import { useGetProfile } from "@workspace/api-client-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n-context"

export function Sidebar() {
  const [location] = useLocation()
  const { data: profile } = useGetProfile()
  const { t, isRtl } = useI18n()

  const links = [
    { href: "/dashboard",   labelKey: "navDashboard"  as const, icon: LayoutDashboard },
    { href: "/traffic",     labelKey: "navTraffic"    as const, icon: Navigation },
    { href: "/safe-paths",  labelKey: "navSafePaths"  as const, icon: MapIcon },
    { href: "/eco",         labelKey: "navEco"        as const, icon: Leaf },
    { href: "/wallet",      labelKey: "navWallet"     as const, icon: Wallet },
  ]

  return (
    <div
      className={cn(
        "flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-sidebar-border relative shrink-0",
        isRtl ? "border-l" : "border-r"
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-6 py-6 font-bold text-2xl tracking-tight text-white", isRtl && "flex-row-reverse")}>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary shrink-0">
          <MapIcon className="size-5 text-primary-foreground" />
        </div>
        {t('appName')}
      </div>

      {/* Section label */}
      <div className="px-4 py-2">
        <div className={cn(
          "text-xs font-semibold text-sidebar-foreground/50 mb-3 px-2 uppercase tracking-wider",
          isRtl && "text-right"
        )}>
          {t('cityControl')}
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = location === link.href || (location === "/" && link.href === "/dashboard")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isRtl && "flex-row-reverse text-right",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <Icon className={cn("size-5 shrink-0", isActive ? "text-primary" : "text-sidebar-foreground/50")} />
                {t(link.labelKey)}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User profile */}
      <div className="mt-auto p-4 border-t border-sidebar-border">
        {profile ? (
          <div className={cn("flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3", isRtl && "flex-row-reverse")}>
            <Avatar className="size-10 border border-sidebar-border shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                {profile.avatarInitials || "PT"}
              </AvatarFallback>
            </Avatar>
            <div className={cn("flex flex-col overflow-hidden", isRtl && "text-right")}>
              <span className="truncate text-sm font-semibold text-white">{profile.username}</span>
              <span className="text-xs text-primary font-medium">{profile.driverLevel} {t('driverLabel')}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3">
            <div className="size-10 rounded-full bg-sidebar-accent animate-pulse shrink-0" />
            <div className="flex flex-col gap-1 w-full">
              <div className="h-3 w-20 bg-sidebar-accent rounded animate-pulse" />
              <div className="h-2 w-12 bg-sidebar-accent rounded animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
