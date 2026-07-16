import { Sidebar } from "./Sidebar"
import { Bell, Search } from "lucide-react"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6 shadow-sm z-10 relative">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-sm hidden md:flex">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search spots, events, or traffic..." 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent/50">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive border border-background"></span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  )
}
