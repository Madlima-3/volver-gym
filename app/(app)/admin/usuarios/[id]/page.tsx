import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ClipboardList } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function UsuarioDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const { data: targetUser } = await supabase
    .from("users")
    .select("id, name, email, role, mode, created_at")
    .eq("id", id)
    .single()

  if (!targetUser) notFound()

  const { data: plans } = await supabase
    .from("workout_plans")
    .select(`
      id, name, is_active, created_at,
      exercises(count)
    `)
    .eq("assigned_to", id)
    .order("created_at", { ascending: false })

  const { data: recentLogs } = await supabase
    .from("workout_logs")
    .select("id, executed_at, workout_plans(name)")
    .eq("user_id", id)
    .order("executed_at", { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/usuarios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {targetUser.name ?? targetUser.email}
          </h1>
          <p className="text-muted-foreground text-sm">{targetUser.email}</p>
        </div>
        <Badge variant={targetUser.role === "admin" ? "default" : "secondary"}>
          {targetUser.role}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground font-medium">Membro desde</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {new Date(targetUser.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric"
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground font-medium">Fichas atribuídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{plans?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground font-medium">Treinos registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{recentLogs?.length ?? 0}+ treinos</p>
          </CardContent>
        </Card>
      </div>

      {/* Fichas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Fichas atribuídas
          </h2>
          <Button size="sm" variant="outline" asChild>
            <Link href="/treinos/nova">+ Nova ficha</Link>
          </Button>
        </div>

        {!plans?.length && (
          <p className="text-sm text-muted-foreground">Nenhuma ficha atribuída.</p>
        )}

        <div className="space-y-2">
          {plans?.map((plan) => {
            const exCount = (plan.exercises as unknown as { count: number }[])[0]?.count ?? 0
            return (
              <div key={plan.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exCount} exercício{exCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={plan.is_active ? "default" : "secondary"} className="text-xs">
                    {plan.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/treinos/${plan.id}`}>Ver</Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Histórico recente */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Treinos recentes</h2>
          <div className="rounded-lg border divide-y">
            {recentLogs.map((log) => {
              const planName = (log.workout_plans as unknown as { name: string } | null)?.name
              return (
                <div key={log.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{planName ?? "Treino"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.executed_at).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
