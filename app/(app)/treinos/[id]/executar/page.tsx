import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { WorkoutExecutionForm } from "@/components/workout/WorkoutExecutionForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function ExecutarTreinoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: plan } = await supabase
    .from("workout_plans")
    .select(`
      id, name, assigned_to,
      exercises(id, name, sets, reps, suggested_weight, notes, order_index)
    `)
    .eq("id", id)
    .single()

  if (!plan) notFound()

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  // Usuário comum só pode executar fichas atribuídas a ele
  if (!isAdmin && plan.assigned_to !== user.id) redirect("/treinos")

  const exercises = (plan.exercises as {
    id: string; name: string; sets: number | null; reps: string | null;
    suggested_weight: number | null; notes: string | null; order_index: number
  }[]).sort((a, b) => a.order_index - b.order_index)

  // Busca o último log de cada exercício para sugerir progressão
  const lastLogs: Record<string, { weight_used: number | null; reps_done: string | null }> = {}

  if (exercises.length > 0) {
    const { data: recentLogs } = await supabase
      .from("exercise_logs")
      .select("exercise_id, weight_used, reps_done, workout_log:workout_logs!inner(user_id, executed_at)")
      .in("exercise_id", exercises.map((e) => e.id))
      .eq("workout_log.user_id", isAdmin ? (plan.assigned_to ?? user.id) : user.id)
      .order("workout_log(executed_at)", { ascending: false })

    recentLogs?.forEach((log) => {
      if (!lastLogs[log.exercise_id]) {
        lastLogs[log.exercise_id] = {
          weight_used: log.weight_used,
          reps_done: log.reps_done,
        }
      }
    })
  }

  const exercisesWithHistory = exercises.map((ex) => ({
    ...ex,
    lastWeight: lastLogs[ex.id]?.weight_used ?? null,
    lastReps: lastLogs[ex.id]?.reps_done ?? null,
  }))

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/treinos/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{plan.name}</h1>
          <p className="text-muted-foreground text-sm">
            {exercises.length} exercício{exercises.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <WorkoutExecutionForm
        workoutPlanId={id}
        planName={plan.name}
        exercises={exercisesWithHistory}
      />
    </div>
  )
}
