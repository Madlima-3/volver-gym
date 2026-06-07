import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GymCard } from "@/components/ui/GymCard"
import { DeleteUserButton } from "@/components/admin/DeleteUserButton"
import { deleteUser } from "@/lib/actions/users"
import { ArrowLeft, ClipboardList, ChevronRight } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function UsuarioDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const { data: targetUser } = await supabase
    .from("users")
    .select("id, name, email, role, mode, created_at")
    .eq("id", id)
    .single()

  if (!targetUser) notFound()

  const { data: plans } = await supabase
    .from("workout_plans")
    .select("id, name, is_active, created_at, exercises(count)")
    .eq("assigned_to", id)
    .order("created_at", { ascending: false })

  const { data: recentLogs } = await supabase
    .from("workout_logs")
    .select("id, executed_at, workout_plans(name)")
    .eq("user_id", id)
    .order("executed_at", { ascending: false })
    .limit(5)

  const isSelf = user.id === id
  const deleteAction = deleteUser.bind(null, id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 text-muted-foreground hover:text-foreground">
          <Link href="/admin/usuarios"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {targetUser.name ?? targetUser.email}
            </h1>
            <Badge
              variant={targetUser.role === "admin" ? "default" : "secondary"}
              className={targetUser.role === "admin" ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20" : ""}
            >
              {targetUser.role}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{targetUser.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <GymCard className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Membro desde</p>
          <p className="text-sm font-medium">
            {new Date(targetUser.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric",
            })}
          </p>
        </GymCard>
        <GymCard className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Fichas</p>
          <p className="text-2xl font-bold">{plans?.length ?? 0}</p>
        </GymCard>
        <GymCard className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Treinos</p>
          <p className="text-2xl font-bold">{recentLogs?.length ?? 0}</p>
        </GymCard>
      </div>

      {/* Assigned plans */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5" />
            Fichas atribuídas
          </h2>
          <Button size="sm" variant="outline" asChild>
            <Link href="/treinos/nova">+ Nova ficha</Link>
          </Button>
        </div>

        {!plans?.length && (
          <p className="text-sm text-muted-foreground">Nenhuma ficha atribuída.</p>
        )}

        <div className="space-y-2">
          {plans?.map((plan) => {
            const exCount = (plan.exercises as unknown as { count: number }[])[0]?.count ?? 0
            return (
              <Link key={plan.id} href={`/treinos/${plan.id}`}>
                <GymCard className="px-4 py-3 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{plan.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exCount} exercício{exCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge
                      variant={plan.is_active ? "default" : "secondary"}
                      className={`text-[10px] shrink-0 ${plan.is_active ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20" : ""}`}
                    >
                      {plan.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </div>
                </GymCard>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent logs */}
      {recentLogs && recentLogs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Treinos recentes
          </h2>
          <GymCard className="divide-y divide-border overflow-hidden">
            {recentLogs.map((log) => {
              const planName = (log.workout_plans as unknown as { name: string } | null)?.name
              return (
                <div key={log.id} className="flex items-center px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{planName ?? "Treino"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(log.executed_at).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </GymCard>
        </div>
      )}

      {/* Danger zone */}
      {!isSelf && (
        <GymCard className="p-4 border-destructive/20">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-destructive mb-3">
            Zona de perigo
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Remove o usuário permanentemente do app e do Supabase Auth. Fichas atribuídas ficam sem dono.
          </p>
          <DeleteUserButton
            onDelete={deleteAction}
            userName={targetUser.name ?? targetUser.email}
          />
        </GymCard>
      )}
    </div>
  )
}
