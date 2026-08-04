import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Navigation,
  Map as MapIcon,
  Leaf,
  Wallet,
  Building2,
  ShoppingBag,
  CalendarDays,
  LogIn,
  LogOut,
  Trees,
  Compass,
  TrendingUp,
  AlertCircle,
  Fuel,
  Star,
  MessageSquare,
} from "lucide-react"
import { useGetProfile } from "@workspace/api-client-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n-context"
import { useAuth } from "@workspace/replit-auth-web"

export function Sidebar() {
  const [location] = useLocation()
  const { data: profile } = useGetProfile()
  const { t, isRtl, lang } = useI18n()
  const { isAuthenticated, user, login, logout, isLoading: authLoading } = useAuth()

  const cityControlLinks = [
    { href: "/dashboard",    label: lang === "ar" ? "لوحة التحكم"        : "Dashboard",       icon: LayoutDashboard },
    { href: "/traffic",      label: lang === "ar" ? "المرور والطرق"       : "Traffic & Routes", icon: Navigation },
    { href: "/safe-paths",   label: lang === "ar" ? "المسارات الآمنة"     : "Safe Paths",       icon: MapIcon },
    { href: "/eco",          label: lang === "ar" ? "المكافآت البيئية"    : "Eco Rewards",      icon: Leaf },
    { href: "/carbon",       label: lang === "ar" ? "البصمة الكربونية"    : "Carbon Footprint", icon: Trees },
    { href: "/municipality", label: lang === "ar" ? "البلدية"             : "Municipality",     icon: Building2 },
  ]

  const cityServiceLinks = [
    { href: "/events",                label: lang === "ar" ? "الفعاليات"       : "Events",            icon: CalendarDays },
    { href: "/tours",                 label: lang === "ar" ? "الجولات"         : "Community Tours",   icon: Compass },
    { href: "/destination-of-month",  label: lang === "ar" ? "وجهة الشهر"      : "Dest. of Month",    icon: Star },
    { href: "/wallet",                label: lang === "ar" ? "المحفظة"          : "Wallet",            icon: Wallet },
    { href: "/store",                 label: lang === "ar" ? "متجر التراث"      : "Heritage Store",    icon: ShoppingBag },
  ]

  const communityLinks = [
    { href: "/suggestions", label: lang === "ar" ? "المقترحات"      : "Suggestions",  icon: TrendingUp },
    { href: "/complaints",  label: lang === "ar" ? "الشكاوى"        : "Complaints",   icon: AlertCircle },
    { href: "/fuel",        label: lang === "ar" ? "مراقبة الوقود"  : "Fuel Intel",   icon: Fuel },
  ]

  const isActive = (href: string) =>
    location === href || (location === "/" && href === "/dashboard") || location.startsWith(href + "/")

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        isRtl && "flex-row-reverse text-right",
        isActive(href)
          ? "bg-sidebar-accent text-white"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
      )}
    >
      <Icon className={cn("size-4 shrink-0", isActive(href) ? "text-primary" : "text-sidebar-foreground/50")} />
      {label}
    </Link>
  )

  const SectionLabel = ({ label }: { label: string }) => (
    <div className={cn("text-xs font-semibold text-sidebar-foreground/50 mb-1.5 px-2 uppercase tracking-wider", isRtl && "text-right")}>
      {label}
    </div>
  )

  return (
    <div
      className={cn(
        "flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-sidebar-border relative shrink-0",
        isRtl ? "border-l" : "border-r"
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-6 py-4 font-bold text-2xl tracking-tight text-white shrink-0", isRtl && "flex-row-reverse")}>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary shrink-0">
          <MapIcon className="size-5 text-primary-foreground" />
        </div>
        {t('appName')}
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* City Control */}
        <div>
          <SectionLabel label={lang === "ar" ? "التحكم في المدينة" : "City Control"} />
          <nav className="flex flex-col gap-0.5">
            {cityControlLinks.map((link) => <NavLink key={link.href} {...link} />)}
          </nav>
        </div>

        {/* City Services */}
        <div>
          <SectionLabel label={lang === "ar" ? "خدمات المدينة" : "City Services"} />
          <nav className="flex flex-col gap-0.5">
            {cityServiceLinks.map((link) => <NavLink key={link.href} {...link} />)}
          </nav>
        </div>

        {/* Community */}
        <div>
          <SectionLabel label={lang === "ar" ? "المجتمع" : "Community"} />
          <nav className="flex flex-col gap-0.5">
            {communityLinks.map((link) => <NavLink key={link.href} {...link} />)}
          </nav>
        </div>
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-sidebar-border shrink-0">
        {profile ? (
          <div className={cn("flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-3", isRtl && "flex-row-reverse")}>
            <Avatar className="size-9 border border-sidebar-border shrink-0">
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
            <div className="size-9 rounded-full bg-sidebar-accent animate-pulse shrink-0" />
            <div className="flex flex-col gap-1 w-full">
              <div className="h-3 w-20 bg-sidebar-accent rounded animate-pulse" />
              <div className="h-2 w-12 bg-sidebar-accent rounded animate-pulse" />
            </div>
          </div>
        )}
        {!authLoading && (
          <button
            onClick={isAuthenticated ? logout : login}
            className={cn(
              "w-full mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              isAuthenticated ? "text-red-400 hover:bg-sidebar-accent/50" : "text-primary hover:bg-sidebar-accent/50",
              isRtl && "flex-row-reverse"
            )}
          >
            {isAuthenticated ? <LogOut className="size-3.5 shrink-0" /> : <LogIn className="size-3.5 shrink-0" />}
            {isAuthenticated
              ? (isRtl ? "تسجيل الخروج" : "Sign Out")
              : (isRtl ? "تسجيل الدخول" : "Sign In with Replit")}
          </button>
        )}
      </div>
    </div>
  )
}
