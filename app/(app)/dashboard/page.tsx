import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GymCard } from "@/components/ui/GymCard"
import { Dumbbell, Play, MessageSquare, TrendingUp, ClipboardList, Zap } from "lucide-react"

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

  const { data: recentLogs } = await supabase
    .from("workout_logs")
    .select("id, executed_at, admin_feedback, workout_plans(name), exercise_logs(count)")
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
      {activePlans && activePlans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {isAdmin ? "Suas fichas" : "Fichas ativas"}
          </h2>
          <div className="space-y-3">
            {activePlans.map((plan, i) => {
              const exCount = (plan.exercises as unknown as { count: number }[])[0]?.count ?? 0
              return (
                <GymCard key={plan.id} highlight={i === 0} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{plan.name}</p>
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
              const planName = (log.workout_plans as unknown as { name: string } | null)?.name
              const exCount = (log.exercise_logs as unknown as { count: number }[])[0]?.count ?? 0
              const date = new Date(log.executed_at)
              return (
                <Link key={log.id} href={`/historico/${log.id}`}>
                  <GymCard className="px-4 py-3 hover:border-border/60 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{planName ?? "Treino"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          {" · "}{exCount} exercício{exCount !== 1 ? "s" : ""}
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
      {!activePlans?.length && !recentLogs?.length && (
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
