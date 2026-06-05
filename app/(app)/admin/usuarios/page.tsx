import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus } from "lucide-react"

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const { data: users } = await supabase
    .from("users")
    .select(`
      id, name, email, role, mode, created_at,
      workout_plans:workout_plans!workout_plans_assigned_to_fkey(count)
    `)
    .order("created_at")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground mt-1">{users?.length ?? 0} membros</p>
        </div>
        <Button asChild>
          <Link href="/admin/usuarios/novo">
            <UserPlus className="h-4 w-4 mr-1" />
            Convidar
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border divide-y">
        {users?.map((u) => {
          const planCount = (u.workout_plans as unknown as { count: number }[])[0]?.count ?? 0
          return (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {planCount} ficha{planCount !== 1 ? "s" : ""}
                </span>
                <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-xs">
                  {u.role}
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/usuarios/${u.id}`}>Detalhes</Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
