import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GymCard } from "@/components/ui/GymCard"
import { AddExerciseForm } from "@/components/workout/AddExerciseForm"
import { DeleteExerciseButton } from "@/components/workout/DeleteExerciseButton"
import { AssignPlanForm } from "@/components/workout/AssignPlanForm"
import { DeletePlanButton } from "@/components/workout/DeletePlanButton"
import { addExercise, deleteExercise } from "@/lib/actions/exercises"
import { assignWorkoutPlan, deleteWorkoutPlan } from "@/lib/actions/workout-plans"
import { ArrowLeft, Dumbbell, Play } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function FichaDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user.id).single()

  const isAdmin = profile?.role === "admin"

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .select("id, name, description, is_active, assigned_to")
    .eq("id", id)
    .single()

  if (planError || !plan) notFound()

  if (!isAdmin && plan.assigned_to !== user.id) redirect("/treinos")

  const { data: exercisesData } = await supabase
    .from("exercises")
    .select("id, name, sets, reps, suggested_weight, notes, order_index, muscle_group")
    .eq("workout_plan_id", id)
    .order("order_index")

  const exercises = (exercisesData ?? []) as {
    id: string; name: string; sets: number | null; reps: string | null;
    suggested_weight: number | null; notes: string | null; order_index: number; muscle_group: string | null
  }[]

  const { data: templatesData } = await supabase
    .from("exercise_templates")
    .select("name, muscle_group")
    .order("muscle_group")
    .order("name")

  const addExerciseAction = addExercise.bind(null, id)
  const deletePlanAction = deleteWorkoutPlan.bind(null, id)
  const assignAction = assignWorkoutPlan.bind(null, id)

  let allUsers: { id: string; name: string | null; email: string }[] = []
  if (isAdmin) {
    const { data } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("role", "user")
      .order("name")
    allUsers = data ?? []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground">
          <Link href="/treinos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
            <Badge
              variant={plan.is_active ? "default" : "secondary"}
              className={plan.is_active ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20" : ""}
            >
              {plan.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          {plan.description && (
            <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
          )}
        </div>
        <Button size="sm" asChild>
          <Link href={`/treinos/${id}/executar`}>
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {isAdmin ? "Executar" : "Iniciar treino"}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Exercises list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Exercícios{" "}
            <span className="text-muted-foreground/60 normal-case font-normal">({exercises.length})</span>
          </h2>

          {exercises.length === 0 ? (
            <GymCard className="flex flex-col items-center justify-center p-10 text-center border-dashed">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                <Dumbbell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum exercício ainda.{isAdmin ? " Adicione o primeiro abaixo." : ""}
              </p>
            </GymCard>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex, idx) => {
                const deleteExAction = deleteExercise.bind(null, ex.id, id)
                return (
                  <GymCard key={ex.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{ex.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                          {ex.muscle_group && (
                            <span className="text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                              {ex.muscle_group}
                            </span>
                          )}
                          {ex.sets && (
                            <span className="text-xs text-muted-foreground">{ex.sets} séries</span>
                          )}
                          {ex.reps && (
                            <span className="text-xs text-muted-foreground">{ex.reps} reps</span>
                          )}
                          {ex.suggested_weight && (
                            <span className="text-xs text-muted-foreground">{ex.suggested_weight} kg</span>
                          )}
                        </div>
                        {ex.notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">{ex.notes}</p>
                        )}
                      </div>
                      {isAdmin && <DeleteExerciseButton onDelete={deleteExAction} />}
                    </div>
                  </GymCard>
                )
              })}
            </div>
          )}

          {isAdmin && (
            <AddExerciseForm action={addExerciseAction} templates={templatesData ?? []} />
          )}
        </div>

        {/* Admin panel */}
        {isAdmin && (
          <div className="space-y-4">
            <GymCard elevated className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Atribuição
              </h3>
              <AssignPlanForm
                users={allUsers}
                currentAssignedTo={plan.assigned_to ?? null}
                onAssign={assignAction}
              />
            </GymCard>

            <GymCard className="p-4 border-destructive/20">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-destructive mb-3">
                Zona de perigo
              </h3>
              <DeletePlanButton onDelete={deletePlanAction} />
            </GymCard>
          </div>
        )}
      </div>
    </div>
  )
}
