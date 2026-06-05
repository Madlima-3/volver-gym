import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, MessageSquare } from "lucide-react"

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const { data: logs } = await supabase
    .from("workout_logs")
    .select(`
      id, executed_at, notes, admin_feedback,
      workout_plans(name),
      exercise_logs(count)
    `)
    .eq("user_id", user.id)
    .order("executed_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground mt-1">
          {logs?.length
            ? `${logs.length} treino${logs.length !== 1 ? "s" : ""} registrado${logs.length !== 1 ? "s" : ""}`
            : "Nenhum treino ainda"}
        </p>
      </div>

      {!logs?.length && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Nenhum treino registrado ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Abra uma ficha e clique em "Iniciar treino" para começar.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {logs?.map((log) => {
          const planName = (log.workout_plans as unknown as { name: string } | null)?.name
          const exCount = (log.exercise_logs as unknown as { count: number }[])[0]?.count ?? 0
          const date = new Date(log.executed_at)

          return (
            <Link key={log.id} href={`/historico/${log.id}`}>
              <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow cursor-pointer">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{planName ?? "Treino"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {date.toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {log.admin_feedback && (
                    <MessageSquare className="h-4 w-4 text-primary" />
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {exCount} ex.
                  </Badge>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
