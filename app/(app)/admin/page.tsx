import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, ClipboardList, UserPlus } from "lucide-react"

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
        <p className="text-muted-foreground mt-1">Visão geral do app</p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">membros ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fichas criadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalPlans}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {unassignedPlans > 0 ? `${unassignedPlans} sem atribuição` : "todas atribuídas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/usuarios/novo">
                <UserPlus className="h-4 w-4 mr-1" />
                Convidar usuário
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/treinos/nova">
                <ClipboardList className="h-4 w-4 mr-1" />
                Nova ficha
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lista de usuários resumida */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/usuarios">Ver todos</Link>
          </Button>
        </div>

        {!users?.length && (
          <p className="text-sm text-muted-foreground">Nenhum usuário ainda.</p>
        )}

        <div className="rounded-lg border divide-y">
          {users?.map((u) => {
            const assignedPlans = plans?.filter((p) => p.assigned_to === u.id) ?? []
            return (
              <div key={u.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{u.name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {assignedPlans.length} ficha{assignedPlans.length !== 1 ? "s" : ""}
                  </span>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                    {u.role}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/usuarios/${u.id}`}>Ver</Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
