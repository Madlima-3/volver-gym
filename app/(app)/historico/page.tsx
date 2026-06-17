import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { GymCard } from "@/components/ui/GymCard"
import { WorkoutCalendar } from "@/components/workout/WorkoutCalendar"
import { ClipboardList, MessageSquare, ChevronRight } from "lucide-react"

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("id, executed_at, notes, admin_feedback, workout_plans(name), exercise_logs(count)")
    .eq("user_id", user.id)
    .order("executed_at", { ascending: false })

  const calendarLogs = (logs ?? []).map((l) => ({
    id: l.id,
    executed_at: l.executed_at,
    planName: (l.workout_plans as unknown as { name: string } | null)?.name ?? null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {logs?.length
            ? `${logs.length} treino${logs.length !== 1 ? "s" : ""} registrado${logs.length !== 1 ? "s" : ""}`
            : "Nenhum treino ainda"}
        </p>
      </div>

      {logs && logs.length > 0 && (
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
          const planName = (log.workout_plans as unknown as { name: string } | null)?.name
          const exCount = (log.exercise_logs as unknown as { count: number }[])[0]?.count ?? 0
          const date = new Date(log.executed_at)

          return (
            <Link key={log.id} href={`/historico/${log.id}`}>
              <GymCard className="px-4 py-3.5 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{planName ?? "Treino"}</p>
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
                    <Badge variant="secondary" className="text-[11px] bg-secondary text-muted-foreground">
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
