import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { GymCard } from "@/components/ui/GymCard"
import { WorkoutCalendar } from "@/components/workout/WorkoutCalendar"
import { ClipboardList, MessageSquare, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("id, executed_at, notes, admin_feedback, status, workout_plans(name), exercise_logs(count)")
    .eq("user_id", user.id)
    .order("executed_at", { ascending: false })

  const completedLogs = (logs ?? []).filter((l) => (l as any).status !== "in_progress")

  const calendarLogs = completedLogs.map((l) => ({
    id: l.id,
    executed_at: l.executed_at,
    planName: (l.workout_plans as unknown as { name: string } | null)?.name ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {completedLogs.length
            ? `${completedLogs.length} treino${completedLogs.length !== 1 ? "s" : ""} registrado${completedLogs.length !== 1 ? "s" : ""}`
            : "Nenhum treino ainda"}
        </p>
      </div>

      {calendarLogs.length > 0 && (
        <WorkoutCalendar logs={calendarLogs} />
      )}

      {!logs?.length && (
        <GymCard className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Nenhum treino registrado ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Abra uma ficha e clique em "Iniciar treino" para começar.
          </p>
        </GymCard>
      )}

      <div className="space-y-2">
        {logs?.map((log) => {
          const inProgress = (log as any).status === "in_progress"
          const planName = (log.workout_plans as unknown as { name: string } | null)?.name
          const exCount = (log.exercise_logs as unknown as { count: number }[])[0]?.count ?? 0
          const date = new Date(log.executed_at)

          return (
            <Link key={log.id} href={`/historico/${log.id}`}>
              <GymCard
                className={cn(
                  "px-4 py-3.5 transition-colors cursor-pointer",
                  inProgress
                    ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
                    : "hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{planName ?? "Treino"}</p>
                      {inProgress && (
                        <span className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-amber-500">
                          <Clock className="h-3 w-3" />
                          Em andamento
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {date.toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" · "}
                      {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.admin_feedback && (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    )}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[11px]",
                        inProgress
                          ? "bg-amber-500/15 text-amber-500 border-amber-500/20"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {exCount} ex.
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </div>
              </GymCard>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
