import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddExerciseForm } from "@/components/workout/AddExerciseForm"
import { DeleteExerciseButton } from "@/components/workout/DeleteExerciseButton"
import { AssignPlanForm } from "@/components/workout/AssignPlanForm"
import { DeletePlanButton } from "@/components/workout/DeletePlanButton"
import { ArrowLeft, Pencil, Dumbbell } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function FichaDetailPage({ params }: Props) {
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

  const { data: plan } = await supabase
    .from("workout_plans")
    .select(`
      *,
      exercises(id, name, sets, reps, suggested_weight, notes, order_index),
      assigned_user:users!workout_plans_assigned_to_fkey(id, name, email)
    `)
    .eq("id", id)
    .single()

  if (!plan) notFound()

  // Usuário só pode ver se a ficha está atribuída a ele
  if (!isAdmin && plan.assigned_to !== user.id) redirect("/treinos")

  const exercises = (plan.exercises as {
    id: string; name: string; sets: number | null; reps: string | null;
    suggested_weight: number | null; notes: string | null; order_index: number
  }[]).sort((a, b) => a.order_index - b.order_index)

  const assignedUser = plan.assigned_user as { id: string; name: string | null; email: string } | null

  // Lista de usuários para o select de atribuição (só admin precisa)
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
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href="/treinos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
        {isAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/treinos/${id}/editar`}>
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Exercícios */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Exercícios{" "}
              <span className="text-muted-foreground font-normal text-sm">
                ({exercises.length})
              </span>
            </h2>
          </div>

          {exercises.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
              <Dumbbell className="h-7 w-7 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum exercício ainda. {isAdmin && "Adicione o primeiro abaixo."}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {exercises.map((ex, idx) => (
              <div
                key={ex.id}
                className="flex items-start gap-3 rounded-lg border bg-card p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{ex.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {ex.sets && (
                      <span className="text-xs text-muted-foreground">
                        {ex.sets} série{ex.sets !== 1 ? "s" : ""}
                      </span>
                    )}
                    {ex.reps && (
                      <span className="text-xs text-muted-foreground">
                        {ex.reps} rep{ex.reps !== "1" ? "s" : ""}
                      </span>
                    )}
                    {ex.suggested_weight && (
                      <span className="text-xs text-muted-foreground">
                        {ex.suggested_weight} kg
                      </span>
                    )}
                  </div>
                  {ex.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{ex.notes}</p>
                  )}
                </div>
                {isAdmin && (
                  <DeleteExerciseButton exerciseId={ex.id} workoutPlanId={id} />
                )}
              </div>
            ))}
          </div>

          {isAdmin && <AddExerciseForm workoutPlanId={id} />}
        </div>

        {/* Painel lateral — só admin */}
        {isAdmin && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Atribuição</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {assignedUser && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Atribuída a:{" "}
                    <span className="font-medium text-foreground">
                      {assignedUser.name ?? assignedUser.email}
                    </span>
                  </p>
                )}
                <AssignPlanForm
                  planId={id}
                  users={allUsers}
                  currentAssignedTo={plan.assigned_to ?? null}
                />
              </CardContent>
            </Card>

            <Card className="border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-destructive">Zona de perigo</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DeletePlanButton planId={id} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
