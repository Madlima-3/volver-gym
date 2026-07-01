import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GymCard } from "@/components/ui/GymCard"
import { Dumbbell, Play, MessageSquare, TrendingUp, ClipboardList, Zap, Clock, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"
  const firstName = (profile?.name ?? user.email ?? "").split(" ")[0]

  const { data: activePlans } = await supabase
    .from("workout_plans")
    .select("id, name, description, exercises(count)")
    .eq(isAdmin ? "created_by" : "assigned_to", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3)

  // Find next recommended plan: least recently executed (or never done)
  const planIds = activePlans?.map((p) => p.id) ?? []
  const { data: planLogs } = planIds.length > 0
    ? await supabase
        .from("workout_logs")
        .select("workout_plan_id, executed_at")
        .eq("user_id", user.id)
        .in("workout_plan_id", planIds)
        .order("executed_at", { ascending: false })
    : { data: [] }

  const lastExecMap = new Map<string, Date>()
  for (const log of planLogs ?? []) {
    if (!lastExecMap.has(log.workout_plan_id)) {
      lastExecMap.set(log.workout_plan_id, new Date(log.executed_at))
    }
  }

  let nextPlanId: string | null = null
  let oldestDate: Date | null = null
  for (const plan of activePlans ?? []) {
    const lastExec = lastExecMap.get(plan.id)
    if (!lastExec) { nextPlanId = plan.id; break }
    if (oldestDate === null || lastExec < oldestDate) { oldestDate = lastExec; nextPlanId = plan.id }
  }

  const sortedPlans = activePlans
    ? [...activePlans].sort((a, b) => (a.id === nextPlanId ? -1 : b.id === nextPlanId ? 1 : 0))
    : []

  const { data: recentLogs } = await supabase
    .from("workout_logs")
    .select("id, executed_at, admin_feedback, status, workout_plans(name), exercise_logs(count)")
    .eq("user_id", user.id)
    .order("executed_at", { ascending: false })
    .limit(3)

  const lastWorkout = recentLogs?.[0]
  const daysSinceLast = lastWorkout
    ? Math.floor((Date.now() - new Date(lastWorkout.executed_at).getTime()) / 86400000)
    : null

  const streakLabel =
    daysSinceLast === null
      ? "Nenhum treino ainda. Bora?"
      : daysSinceLast === 0
      ? "Você treinou hoje!"
      : daysSinceLast === 1
      ? "Último treino ontem."
      : `Último treino há ${daysSinceLast} dias.`

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div>
        <p className="text-sm text-muted-foreground font-medium mb-1">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, <span className="text-primary">{firstName}</span>
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <p className="text-sm text-muted-foreground">{streakLabel}</p>
        </div>
      </div>

      {/* Active plans */}
      {sortedPlans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {isAdmin ? "Suas fichas" : "Fichas ativas"}
          </h2>
          <div className="space-y-3">
            {sortedPlans.map((plan) => {
              const exCount = (plan.exercises as unknown as { count: number }[])[0]?.count ?? 0
              const isNext = plan.id === nextPlanId
              return (
                <GymCard key={plan.id} highlight={isNext} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{plan.name}</p>
                        {isNext && (
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 border-primary/50 text-primary">
                            <Flame className="h-2.5 w-2.5 mr-1" />
                            Próximo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exCount} exercício{exCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button size="sm" asChild className="shrink-0">
                      <Link href={`/treinos/${plan.id}/executar`}>
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                        Treinar
                      </Link>
                    </Button>
                  </div>
                </GymCard>
              )
            })}
          </div>
          <Button variant="ghost" size="sm" asChild className="w-full text-muted-foreground hover:text-foreground">
            <Link href="/treinos">Ver todas as fichas →</Link>
          </Button>
        </div>
      )}

      {/* Recent logs */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Treinos recentes
          </h2>
          <div className="space-y-2">
            {recentLogs.map((log) => {
              const inProgress = (log as any).status === "in_progress"
              const planName = (log.workout_plans as unknown as { name: string } | null)?.name
              const exCount = (log.exercise_logs as unknown as { count: number }[])[0]?.count ?? 0
              const date = new Date(log.executed_at)
              return (
                <Link key={log.id} href={`/historico/${log.id}`}>
                  <GymCard
                    className={cn(
                      "px-4 py-3 transition-colors cursor-pointer",
                      inProgress
                        ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
                        : "hover:border-border/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{planName ?? "Treino"}</p>
                          {inProgress && <Clock className="h-3 w-3 text-amber-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {inProgress
                            ? "Em andamento"
                            : `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · ${exCount} exercício${exCount !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                      {log.admin_feedback && (
                        <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </GymCard>
                </Link>
              )
            })}
          </div>
          <Button variant="ghost" size="sm" asChild className="w-full text-muted-foreground hover:text-foreground">
            <Link href="/historico">Ver histórico completo →</Link>
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!sortedPlans.length && !recentLogs?.length && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Dumbbell,
              title: "Fichas de Treino",
              desc: isAdmin ? "Crie e atribua fichas" : "Veja suas fichas ativas",
              href: "/treinos",
              label: "Ver fichas",
            },
            {
              icon: ClipboardList,
              title: "Histórico",
              desc: "Seus treinos registrados",
              href: "/historico",
              label: "Ver histórico",
            },
            {
              icon: TrendingUp,
              title: "Progressão",
              desc: "Evolução de cargas",
              href: "/progresso",
              label: "Ver progresso",
            },
          ].map(({ icon: Icon, title, desc, href, label }) => (
            <Link key={href} href={href}>
              <GymCard className="p-5 h-full hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                <p className="text-xs font-medium text-primary mt-3">{label} →</p>
              </GymCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
