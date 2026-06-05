import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Dumbbell, Users } from "lucide-react"

export default async function TreinosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  // Admin vê todas as fichas, usuário só vê as atribuídas a ele
  const query = supabase
    .from("workout_plans")
    .select(`
      id, name, description, is_active, assigned_to, created_at,
      exercises(count),
      assigned_user:users!workout_plans_assigned_to_fkey(name, email)
    `)
    .order("created_at", { ascending: false })

  if (!isAdmin) {
    query.eq("assigned_to", user.id)
  }

  const { data: plans } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fichas de Treino</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? `${plans?.length ?? 0} fichas no total` : "Suas fichas ativas"}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/treinos/nova">
              <Plus className="h-4 w-4 mr-1" />
              Nova ficha
            </Link>
          </Button>
        )}
      </div>

      {!plans?.length && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            {isAdmin ? "Nenhuma ficha criada ainda." : "Nenhuma ficha atribuída a você ainda."}
          </p>
          {isAdmin && (
            <Button asChild className="mt-4" size="sm">
              <Link href="/treinos/nova">Criar primeira ficha</Link>
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {plans?.map((plan) => {
          const assignedUser = plan.assigned_user as unknown as { name: string | null; email: string } | null
          const exerciseCount = (plan.exercises as unknown as { count: number }[])[0]?.count ?? 0

          return (
            <Link key={plan.id} href={`/treinos/${plan.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{plan.name}</CardTitle>
                    <Badge variant={plan.is_active ? "default" : "secondary"} className="shrink-0">
                      {plan.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  {plan.description && (
                    <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3.5 w-3.5" />
                      {exerciseCount} exercício{exerciseCount !== 1 ? "s" : ""}
                    </span>
                    {isAdmin && assignedUser && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {assignedUser.name ?? assignedUser.email}
                      </span>
                    )}
                    {isAdmin && !assignedUser && (
                      <span className="text-muted-foreground/60">Sem atribuição</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
