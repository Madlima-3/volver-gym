import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { updateWorkoutPlan } from "@/lib/actions/workout-plans"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GymCard } from "@/components/ui/GymCard"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function EditarFichaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/treinos")

  const { data: plan } = await supabase
    .from("workout_plans")
    .select("id, name, description")
    .eq("id", id)
    .single()

  if (!plan) notFound()

  const update = updateWorkoutPlan.bind(null, id)

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
          <Link href={`/treinos/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar ficha</h1>
          <p className="text-muted-foreground text-sm truncate">{plan.name}</p>
        </div>
      </div>

      <GymCard elevated className="p-5">
        <form action={update} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" defaultValue={plan.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={plan.description ?? ""}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href={`/treinos/${id}`}>Cancelar</Link>
            </Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        </form>
      </GymCard>
    </div>
  )
}
