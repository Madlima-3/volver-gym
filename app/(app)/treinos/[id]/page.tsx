import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddExerciseForm } from "@/components/workout/AddExerciseForm"
import { DeleteExerciseButton } from "@/components/workout/DeleteExerciseButton"
import { AssignPlanForm } from "@/components/workout/AssignPlanForm"
import { DeletePlanButton } from "@/components/workout/DeletePlanButton"
import { addExercise, deleteExercise } from "@/lib/actions/exercises"
import { assignWorkoutPlan, deleteWorkoutPlan } from "@/lib/actions/workout-plans"
import { ArrowLeft, Dumbbell } from "lucide-react"

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
    .select("id, name, sets, reps, suggested_weight, notes, order_index")
    .eq("workout_plan_id", id)
    .order("order_index")

  const exercises = (exercisesData ?? []) as {
    id: string; name: string; sets: number | null; reps: string | null;
    suggested_weight: number | null; notes: string | null; order_index: number
  }[]

  // Bound server actions passed as props (not imported directly in client components)
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
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href="/treinos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
            <Badge variant={plan.is_active ? "default" : "secondary"}>
              {plan.is_active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          {plan.description && (
            <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
          )}
        </div>
        <Button size="sm" asChild>
          <Link href={`/treinos/${id}/executar`}>
            <Dumbbell className="h-4 w-4 mr-1" />
            {isAdmin ? "Executar" : "Iniciar treino"}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold">
            Exercícios{" "}
            <span className="text-muted-foreground font-normal text-sm">({exercises.length})</span>
          </h2>

          {exercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
              <Dumbbell className="h-7 w-7 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum exercício ainda.{isAdmin ? " Adicione o primeiro abaixo." : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex, idx) => {
                const deleteExAction = deleteExercise.bind(null, ex.id, id)
                return (
                  <div key={ex.id} className="flex items-start gap-3 rounded-lg border bg-card p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{ex.name}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        {ex.sets && <span className="text-xs text-muted-foreground">{ex.sets} séries</span>}
                        {ex.reps && <span className="text-xs text-muted-foreground">{ex.reps} reps</span>}
                        {ex.suggested_weight && <span className="text-xs text-muted-foreground">{ex.suggested_weight} kg</span>}
                      </div>
                      {ex.notes && <p className="text-xs text-muted-foreground mt-1 italic">{ex.notes}</p>}
                    </div>
                    {isAdmin && <DeleteExerciseButton onDelete={deleteExAction} />}
                  </div>
                )
              })}
            </div>
          )}

          {isAdmin && <AddExerciseForm action={addExerciseAction} />}
        </div>

        {isAdmin && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Atribuição</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <AssignPlanForm
                  users={allUsers}
                  currentAssignedTo={plan.assigned_to ?? null}
                  onAssign={assignAction}
                />
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-destructive">Zona de perigo</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DeletePlanButton onDelete={deletePlanAction} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
