import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/LogoutButton"
import { SidebarNav, BottomNav } from "@/components/layout/AppNav"
import Image from "next/image"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"
  const displayName = profile?.name ?? user.email ?? ""
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
          <Image src="/logo-white.png" alt="Volver Gym" width={32} height={32} className="shrink-0" />
          <span className="font-bold text-base tracking-tight">Volver Gym</span>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav isAdmin={isAdmin} />
        </div>

        {/* User info + logout */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{displayName}</p>
              {profile?.name && (
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="min-h-screen mx-auto max-w-4xl px-4 py-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav isAdmin={isAdmin} />
    </div>
  )
}
