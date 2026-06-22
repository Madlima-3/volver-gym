"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Home, Dumbbell, ClipboardList, ShieldCheck, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { PWAInstallButton } from "@/components/PWAInstallButton"

const BASE_LINKS = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/treinos", icon: Dumbbell, label: "Treinos" },
  { href: "/historico", icon: ClipboardList, label: "Histórico" },
]

const ADMIN_LINK = { href: "/admin", icon: ShieldCheck, label: "Admin" }

function useLinks(isAdmin: boolean) {
  return isAdmin ? [...BASE_LINKS, ADMIN_LINK] : BASE_LINKS
}

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const links = useLinks(isAdmin)

  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {links.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", active && "stroke-[2.5]")} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const links = useLinks(isAdmin)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/90 backdrop-blur-md">
      <div className="flex items-center justify-around h-16 px-2 safe-area-bottom">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        <PWAInstallButton compact />
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl text-muted-foreground transition-colors active:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </div>
    </nav>
  )
}
