import { Link, useLocation } from "wouter"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Navigation, 
  Map as MapIcon, 
  Leaf, 
  Wallet,
  LogOut,
  Bell
} from "lucide-react"
import { useGetProfile } from "@workspace/api-client-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Sidebar() {
  const [location] = useLocation()
  const { data: profile } = useGetProfile()

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/traffic", label: "Traffic & Routes", icon: Navigation },
    { href: "/safe-paths", label: "Safe Paths", icon: MapIcon },
    { href: "/eco", label: "Eco Rewards", icon: Leaf },
    { href: "/wallet", label: "Wallet", icon: Wallet },
  ]

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border relative">
      <div className="flex items-center gap-3 px-6 py-6 font-bold text-2xl tracking-tight text-white">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <MapIcon className="size-5 text-white" />
        </div>
        Urban Up
      </div>

      <div className="px-4 py-2">
        <div className="text-xs font-semibold text-sidebar-foreground/50 mb-3 px-2 uppercase tracking-wider">
          City Control
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
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-sidebar-accent text-white" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                )}
              >
                <Icon className={cn("size-5", isActive ? "text-primary" : "text-sidebar-foreground/50")} />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        {profile ? (
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <Avatar className="size-10 border border-sidebar-border">
              <AvatarFallback className="bg-primary text-white font-bold">
                {profile.avatarInitials || "UU"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-white">{profile.username}</span>
              <span className="text-xs text-primary font-medium">{profile.driverLevel} Driver</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="size-10 rounded-full bg-sidebar-accent animate-pulse" />
            <div className="flex flex-col gap-1 w-full">
              <div className="h-3 w-16 bg-sidebar-accent rounded animate-pulse" />
              <div className="h-2 w-10 bg-sidebar-accent rounded animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
