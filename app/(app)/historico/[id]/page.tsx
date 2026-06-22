import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminFeedbackForm } from "@/components/workout/AdminFeedbackForm"
import { ArrowLeft, MessageSquare, TrendingUp, Clock, Play } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function WorkoutLogPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  const { data: log } = await supabase
    .from("workout_logs")
    .select(`
      id, executed_at, notes, admin_feedback, status, user_id,
      workout_plans(id, name),
      exercise_logs(
        id, sets_done, reps_done, weight_used, notes,
        exercises(id, name, sets, reps, suggested_weight)
      )
    `)
    .eq("id", id)
    .single()

  if (!log) notFound()

  // Só o próprio usuário ou admin pode ver
  if (!isAdmin && log.user_id !== user.id) redirect("/historico")

  const plan = log.workout_plans as unknown as { id: string; name: string } | null
  const inProgress = (log as any).status === "in_progress"

  const exerciseLogs = (log.exercise_logs as unknown as {
    id: string
    sets_done: number | null
    reps_done: string | null
    weight_used: number | null
    notes: string | null
    exercises: { id: string; name: string; sets: number | null; reps: string | null; suggested_weight: number | null } | null
  }[])

  // Fetch all exercises from the plan to show "Não executado" for missing ones
  let planExercises: { id: string; name: string; order_index: number }[] = []
  if (plan && !inProgress) {
    const { data: exData } = await supabase
      .from("exercises")
      .select("id, name, order_index")
      .eq("workout_plan_id", plan.id)
      .order("order_index")
    planExercises = exData ?? []
  }

  const date = new Date(log.executed_at)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/historico">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight">{plan?.name ?? "Treino"}</h1>
            {inProgress && (
              <span className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                <Clock className="h-3 w-3" />
                Em andamento
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {date.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}{" "}
            às{" "}
            {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {/* Treino em andamento: botão para continuar */}
      {inProgress && plan && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <p className="text-sm text-amber-500 font-medium">
            Este treino ainda não foi concluído.
          </p>
          <p className="text-xs text-muted-foreground">
            Os exercícios só ficam registrados após clicar em "Concluir treino".
          </p>
          <Button asChild className="w-full">
            <Link href={`/treinos/${plan.id}/executar`}>
              <Play className="h-4 w-4 mr-2" />
              Continuar treino
            </Link>
          </Button>
        </div>
      )}

      {/* Exercícios realizados (só para treinos concluídos) */}
      {!inProgress && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Exercícios
          </h2>
          {planExercises.map((planEx, idx) => {
            const el = exerciseLogs.find((l) => l.exercises?.id === planEx.id)

            if (!el) {
              return (
                <div key={planEx.id} className="rounded-xl border border-dashed bg-card/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <p className="font-semibold text-sm text-muted-foreground">{planEx.name}</p>
                    <span className="ml-auto text-xs text-muted-foreground italic">Não executado</span>
                  </div>
                </div>
              )
            }

            const ex = el.exercises
            const weightDiff =
              el.weight_used && ex?.suggested_weight
                ? el.weight_used - ex.suggested_weight
                : null

            return (
              <div key={el.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <p className="font-semibold text-sm">{ex?.name ?? planEx.name}</p>
                  {weightDiff !== null && weightDiff > 0 && (
                    <span className="ml-auto flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
                      <TrendingUp className="h-3 w-3" />
                      +{weightDiff} kg
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-lg font-bold">{el.sets_done ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">séries</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-lg font-bold">{el.reps_done ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">reps</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-lg font-bold">{el.weight_used ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">kg</p>
                  </div>
                </div>

                {el.notes && (
                  <p className="text-xs text-muted-foreground italic border-l-2 pl-2">
                    {el.notes}
                  </p>
                )}

                {ex?.suggested_weight && el.weight_used && (
                  <p className="text-xs text-muted-foreground">
                    Carga sugerida: {ex.suggested_weight} kg
                  </p>
                )}
              </div>
            )
          })}

          {/* Fallback: exercises logged without plan cross-reference */}
          {planExercises.length === 0 && exerciseLogs.map((el, idx) => {
            const ex = el.exercises
            const weightDiff =
              el.weight_used && ex?.suggested_weight
                ? el.weight_used - ex.suggested_weight
                : null
            return (
              <div key={el.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <p className="font-semibold text-sm">{ex?.name ?? "Exercício"}</p>
                  {weightDiff !== null && weightDiff > 0 && (
                    <span className="ml-auto flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
                      <TrendingUp className="h-3 w-3" />
                      +{weightDiff} kg
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-lg font-bold">{el.sets_done ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">séries</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-lg font-bold">{el.reps_done ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">reps</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-lg font-bold">{el.weight_used ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">kg</p>
                  </div>
                </div>
                {el.notes && (
                  <p className="text-xs text-muted-foreground italic border-l-2 pl-2">
                    {el.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Notas gerais */}
      {log.notes && !inProgress && (
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Notas do treino</p>
          <p className="text-sm">{log.notes}</p>
        </div>
      )}

      {/* Feedback do admin (leitura) */}
      {!isAdmin && log.admin_feedback && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Feedback do admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{log.admin_feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Feedback do admin (edição) */}
      {isAdmin && !inProgress && (
        <AdminFeedbackForm logId={id} currentFeedback={log.admin_feedback ?? null} />
      )}

      {/* Link para a ficha */}
      {plan && !inProgress && (
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/treinos/${plan.id}`}>Ver ficha: {plan.name}</Link>
        </Button>
      )}
    </div>
  )
}
