import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Dumbbell, Users } from "lucide-react"

export default async function TreinosPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single()

  const isAdmin = profile?.role === "admin"

  // Busca planos sem join a users (para evitar problema com FK hint)
  const plansQuery = supabase
    .from("workout_plans")
    .select("id, name, description, is_active, assigned_to, created_at, exercises(count)")
    .order("created_at", { ascending: false })

  if (!isAdmin) {
    plansQuery.eq("assigned_to", authUser.id)
  }

  const { data: plans } = await plansQuery

  // Se admin, busca nomes dos usuários atribuídos em lote
  const assignedIds = [...new Set((plans ?? []).map((p) => p.assigned_to).filter(Boolean))] as string[]
  const userMap: Record<string, string> = {}

  if (isAdmin && assignedIds.length > 0) {
    const { data: assignedUsers } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", assignedIds)
    assignedUsers?.forEach((u) => {
      userMap[u.id] = u.name ?? u.email
    })
  }

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
          const exerciseCount = (plan.exercises as unknown as { count: number }[])[0]?.count ?? 0
          const assignedName = plan.assigned_to ? userMap[plan.assigned_to] : null

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
                    {isAdmin && assignedName && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {assignedName}
                      </span>
                    )}
                    {isAdmin && !assignedName && (
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
