import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GymCard } from "@/components/ui/GymCard"
import { UserPlus, ChevronRight } from "lucide-react"

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, role, mode, created_at")
    .order("created_at")

  const { data: plans } = await supabase
    .from("workout_plans")
    .select("id, assigned_to")

  const planCountByUser: Record<string, number> = {}
  plans?.forEach((p) => {
    if (p.assigned_to) planCountByUser[p.assigned_to] = (planCountByUser[p.assigned_to] ?? 0) + 1
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground mt-1 text-sm">{users?.length ?? 0} membros</p>
        </div>
        <Button asChild>
          <Link href="/admin/usuarios/novo">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Convidar
          </Link>
        </Button>
      </div>

      <GymCard className="overflow-hidden divide-y divide-border">
        {!users?.length && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">Nenhum usuário ainda.</p>
        )}
        {users?.map((u) => {
          const planCount = planCountByUser[u.id] ?? 0
          return (
            <Link key={u.id} href={`/admin/usuarios/${u.id}`}>
              <div className="flex items-center justify-between px-4 py-3 hover:bg-secondary transition-colors cursor-pointer">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-xs font-bold text-primary">
                      {(u.name ?? u.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {planCount} ficha{planCount !== 1 ? "s" : ""}
                  </span>
                  <Badge
                    variant={u.role === "admin" ? "default" : "secondary"}
                    className={`text-[10px] ${u.role === "admin" ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20" : ""}`}
                  >
                    {u.role}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </div>
            </Link>
          )
        })}
      </GymCard>
    </div>
  )
}
