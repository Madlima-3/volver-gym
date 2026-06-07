import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GymCard } from "@/components/ui/GymCard"
import { Plus, Dumbbell, Users, ChevronRight } from "lucide-react"

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

  const plansQuery = supabase
    .from("workout_plans")
    .select("id, name, description, is_active, assigned_to, created_at, exercises(count)")
    .order("created_at", { ascending: false })

  if (!isAdmin) {
    plansQuery.eq("assigned_to", authUser.id)
  }

  const { data: plans } = await plansQuery

  const assignedIds = [...new Set((plans ?? []).map((p) => p.assigned_to).filter(Boolean))] as string[]
  const userMap: Record<string, string> = {}

  if (isAdmin && assignedIds.length > 0) {
    const { data: assignedUsers } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", assignedIds)
    assignedUsers?.forEach((u) => { userMap[u.id] = u.name ?? u.email })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fichas de Treino</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isAdmin ? `${plans?.length ?? 0} fichas no total` : "Suas fichas ativas"}
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/treinos/nova">
              <Plus className="h-4 w-4 mr-1.5" />
              Nova ficha
            </Link>
          </Button>
        )}
      </div>

      {!plans?.length && (
        <GymCard className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <Dumbbell className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {isAdmin ? "Nenhuma ficha criada ainda." : "Nenhuma ficha atribuída a você ainda."}
          </p>
          {isAdmin && (
            <Button asChild className="mt-4" size="sm">
              <Link href="/treinos/nova">Criar primeira ficha</Link>
            </Button>
          )}
        </GymCard>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {plans?.map((plan) => {
          const exerciseCount = (plan.exercises as unknown as { count: number }[])[0]?.count ?? 0
          const assignedName = plan.assigned_to ? userMap[plan.assigned_to] : null

          return (
            <Link key={plan.id} href={`/treinos/${plan.id}`}>
              <GymCard className="p-4 hover:border-primary/30 transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight">{plan.name}</p>
                      <Badge
                        variant={plan.is_active ? "default" : "secondary"}
                        className={`text-[10px] shrink-0 ${plan.is_active ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20" : ""}`}
                      >
                        {plan.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{plan.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {exerciseCount} ex.
                      </span>
                      {isAdmin && assignedName && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {assignedName}
                        </span>
                      )}
                      {isAdmin && !assignedName && (
                        <span className="text-muted-foreground/50">Sem atribuição</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                </div>
              </GymCard>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
