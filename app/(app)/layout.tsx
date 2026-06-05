import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/LogoutButton"
import { Dumbbell } from "lucide-react"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-semibold">Volver Gym</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="/dashboard" className="text-foreground hover:text-primary transition-colors">
              Início
            </a>
            <a href="/treinos" className="text-muted-foreground hover:text-primary transition-colors">
              Treinos
            </a>
            <a href="/historico" className="text-muted-foreground hover:text-primary transition-colors">
              Histórico
            </a>
            {profile?.role === "admin" && (
              <a href="/admin" className="text-muted-foreground hover:text-primary transition-colors">
                Admin
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.name ?? user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
