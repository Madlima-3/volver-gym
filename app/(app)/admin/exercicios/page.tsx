import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GymCard } from "@/components/ui/GymCard"
import { DeleteTemplateButton } from "@/components/admin/DeleteTemplateButton"
import { AddTemplateForm } from "@/components/admin/AddTemplateForm"
import { deleteExerciseTemplate } from "@/lib/actions/exercise-templates"
import { ArrowLeft, Pencil, Dumbbell } from "lucide-react"

export const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps",
  "Quadríceps", "Posterior de coxa", "Glúteos", "Panturrilha",
  "Abdômen", "Trapézio",
]

export default async function ExerciciosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const { data: templates } = await supabase
    .from("exercise_templates")
    .select("id, name, muscle_group")
    .order("muscle_group")
    .order("name")

  const grouped = MUSCLE_GROUPS.reduce<Record<string, { id: string; name: string; muscle_group: string }[]>>(
    (acc, group) => {
      acc[group] = (templates ?? []).filter((t) => t.muscle_group === group)
      return acc
    },
    {}
  )

  const totalCount = templates?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 text-muted-foreground hover:text-foreground">
          <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Banco de exercícios</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{totalCount} exercícios cadastrados</p>
        </div>
      </div>

      {/* Add form */}
      <AddTemplateForm muscleGroups={MUSCLE_GROUPS} />

      {/* List grouped by muscle group */}
      <div className="space-y-5">
        {MUSCLE_GROUPS.map((group) => {
          const items = grouped[group]
          if (!items?.length) return null
          return (
            <div key={group} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Dumbbell className="h-3.5 w-3.5" />
                {group}
                <span className="font-normal text-muted-foreground/50 normal-case">({items.length})</span>
              </h2>
              <GymCard className="divide-y divide-border overflow-hidden">
                {items.map((t) => {
                  const deleteAction = deleteExerciseTemplate.bind(null, t.id)
                  return (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3 gap-3">
                      <p className="text-sm font-medium flex-1 min-w-0 truncate">{t.name}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          href={`/admin/exercicios/${t.id}/editar`}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteTemplateButton onDelete={deleteAction} />
                      </div>
                    </div>
                  )
                })}
              </GymCard>
            </div>
          )
        })}
      </div>
    </div>
  )
}
