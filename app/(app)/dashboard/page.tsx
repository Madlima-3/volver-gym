import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, ClipboardList, TrendingUp, Play, MessageSquare } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"
  const firstName = (profile?.name ?? user.email ?? "").split(" ")[0]

  // Ficha ativa do usuário (ou todas para admin)
  const { data: activePlans } = await supabase
    .from("workout_plans")
    .select(`id, name, description, exercises(count)`)
    .eq(isAdmin ? "created_by" : "assigned_to", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3)

  // Últimos treinos do usuário
  const { data: recentLogs } = await supabase
    .from("workout_logs")
    .select(`
      id, executed_at, admin_feedback,
      workout_plans(name),
      exercise_logs(count)
    `)
    .eq("user_id", user.id)
    .order("executed_at", { ascending: false })
    .limit(3)

  const lastWorkout = recentLogs?.[0]
  const daysSinceLast = lastWorkout
    ? Math.floor((Date.now() - new Date(lastWorkout.executed_at).getTime()) / 86400000)
    : null

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Olá, {firstName}!</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {daysSinceLast === null
            ? "Nenhum treino registrado ainda. Bora começar?"
            : daysSinceLast === 0
            ? "Você treinou hoje."
            : daysSinceLast === 1
            ? "Último treino ontem."
            : `Último treino há ${daysSinceLast} dias.`}
        </p>
      </div>

      {/* Fichas ativas */}
      {activePlans && activePlans.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">
            {isAdmin ? "Suas fichas" : "Fichas ativas"}
          </h2>
          <div className="space-y-2">
            {activePlans.map((plan) => {
              const exCount = (plan.exercises as unknown as { count: number }[])[0]?.count ?? 0
              return (
                <div
                  key={plan.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {exCount} exercício{exCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/treinos/${plan.id}/executar`}>
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Treinar
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link href="/treinos">Ver todas as fichas</Link>
          </Button>
        </div>
      )}

      {/* Treinos recentes */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">Treinos recentes</h2>
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const planName = (log.workout_plans as unknown as { name: string } | null)?.name
              const exCount = (log.exercise_logs as unknown as { count: number }[])[0]?.count ?? 0
              const date = new Date(log.executed_at)
              return (
                <Link key={log.id} href={`/historico/${log.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{planName ?? "Treino"}</p>
                      <p className="text-xs text-muted-foreground">
                        {date.toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short",
                        })}{" "}
                        · {exCount} ex.
                      </p>
                    </div>
                    {log.admin_feedback && (
                      <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link href="/historico">Ver histórico completo</Link>
          </Button>
        </div>
      )}

      {/* Estado vazio para novos usuários */}
      {(!activePlans?.length && !recentLogs?.length) && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <Dumbbell className="h-5 w-5 text-primary mb-1" />
              <CardTitle className="text-base">Fichas de Treino</CardTitle>
              <CardDescription>
                {isAdmin ? "Crie e atribua fichas" : "Veja suas fichas ativas"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/treinos" className="text-sm font-medium text-primary hover:underline">
                Ver fichas →
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <ClipboardList className="h-5 w-5 text-primary mb-1" />
              <CardTitle className="text-base">Histórico</CardTitle>
              <CardDescription>Seus treinos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/historico" className="text-sm font-medium text-primary hover:underline">
                Ver histórico →
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <TrendingUp className="h-5 w-5 text-primary mb-1" />
              <CardTitle className="text-base">Progressão</CardTitle>
              <CardDescription>Evolução de cargas</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/progresso" className="text-sm font-medium text-primary hover:underline">
                Ver progresso →
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
