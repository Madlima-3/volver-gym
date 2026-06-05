import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { createWorkoutPlan } from "@/lib/actions/workout-plans"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NovaFichaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/treinos")

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/treinos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova ficha</h1>
          <p className="text-muted-foreground text-sm">Crie uma nova ficha de treino</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações da ficha</CardTitle>
          <CardDescription>
            Você poderá adicionar exercícios e atribuir a um usuário depois de criar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createWorkoutPlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da ficha *</Label>
              <Input
                id="name"
                name="name"
                placeholder="ex: Treino A — Peito e Tríceps"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Objetivo, observações gerais da ficha..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link href="/treinos">Cancelar</Link>
              </Button>
              <Button type="submit">Criar ficha</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
