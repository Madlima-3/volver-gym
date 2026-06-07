import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GymCard } from "@/components/ui/GymCard"
import { Users, ClipboardList, UserPlus, ChevronRight } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const [{ data: users }, { data: plans }] = await Promise.all([
    supabase.from("users").select("id, name, email, role, created_at").order("created_at"),
    supabase.from("workout_plans").select("id, name, is_active, assigned_to").order("created_at", { ascending: false }),
  ])

  const totalUsers = users?.filter((u) => u.role === "user").length ?? 0
  const totalPlans = plans?.length ?? 0
  const unassignedPlans = plans?.filter((p) => !p.assigned_to).length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel Admin</h1>
        <p className="text-muted-foreground mt-1 text-sm">Visão geral do app</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <GymCard highlight className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Usuários</p>
          <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
          <p className="text-xs text-muted-foreground mt-1">membros ativos</p>
        </GymCard>

        <GymCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Fichas</p>
          <p className="text-3xl font-bold text-foreground">{totalPlans}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {unassignedPlans > 0 ? `${unassignedPlans} sem atribuição` : "todas atribuídas"}
          </p>
        </GymCard>

        <GymCard elevated className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Ações rápidas</p>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="outline" asChild className="justify-start">
              <Link href="/admin/usuarios/novo">
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar usuário
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="justify-start">
              <Link href="/treinos/nova">
                <ClipboardList className="h-4 w-4 mr-2" />
                Nova ficha
              </Link>
            </Button>
          </div>
        </GymCard>
      </div>

      {/* Users list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Usuários
          </h2>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground text-xs">
            <Link href="/admin/usuarios">Ver todos</Link>
          </Button>
        </div>

        {!users?.length && (
          <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>
        )}

        <GymCard className="overflow-hidden divide-y divide-border">
          {users?.map((u) => {
            const assignedPlans = plans?.filter((p) => p.assigned_to === u.id) ?? []
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
                      <p className="text-sm font-medium truncate">{u.name ?? u.email}</p>
                      {u.name && (
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-xs text-muted-foreground">
                      {assignedPlans.length} ficha{assignedPlans.length !== 1 ? "s" : ""}
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
    </div>
  )
}
