import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { updateExerciseTemplate } from "@/lib/actions/exercise-templates"
import { MUSCLE_GROUPS } from "../../page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GymCard } from "@/components/ui/GymCard"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function EditarTemplatePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const { data: template } = await supabase
    .from("exercise_templates")
    .select("id, name, muscle_group")
    .eq("id", id)
    .single()

  if (!template) notFound()

  const update = updateExerciseTemplate.bind(null, id)

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/admin/exercicios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar exercício</h1>
          <p className="text-muted-foreground text-sm truncate">{template.name}</p>
        </div>
      </div>

      <GymCard elevated className="p-5">
        <form action={update} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" defaultValue={template.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="muscle_group">Grupo muscular *</Label>
            <select
              id="muscle_group"
              name="muscle_group"
              defaultValue={template.muscle_group}
              required
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href="/admin/exercicios">Cancelar</Link>
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </GymCard>
    </div>
  )
}
