import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    .select("id, name, description, is_active, assigned_to, exercises(id, name, sets, reps, suggested_weight, notes, order_index)")
    .eq("id", id)
    .single()

  if (planError) {
    console.error("[treinos/[id]] planError:", JSON.stringify(planError))
    notFound()
  }
  if (!plan) notFound()

  if (!isAdmin && plan.assigned_to !== user.id) redirect("/treinos")

  const exercises = (plan.exercises as {
    id: string; name: string; sets: number | null; reps: string | null;
    suggested_weight: number | null; notes: string | null; order_index: number
  }[] ?? []).sort((a, b) => a.order_index - b.order_index)

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

      <div className="space-y-4">
        <h2 className="font-semibold">
          Exercícios{" "}
          <span className="text-muted-foreground font-normal text-sm">({exercises.length})</span>
        </h2>

        {exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
            <Dumbbell className="h-7 w-7 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum exercício ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {exercises.map((ex, idx) => (
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
              </div>
            ))}
          </div>
        )}

        {/* Links de ação para admin (sem client components) */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/treinos/${id}/editar`}>Editar ficha</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/treinos/${id}/exercicios/novo`}>+ Exercício</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/treinos/${id}/atribuir`}>Atribuir usuário</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
