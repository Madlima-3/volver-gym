import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, ClipboardList, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user!.id)
    .single()

  const displayName = profile?.name ?? user?.email ?? "Usuário"
  const isAdmin = profile?.role === "admin"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Olá, {displayName.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? "Painel de administrador — gerencie fichas e usuários."
            : "Aqui estão seus treinos de hoje."}
        </p>
      </div>

      {/* Cards de ação rápida */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <Dumbbell className="h-5 w-5 text-primary mb-1" />
            <CardTitle className="text-base">Fichas de Treino</CardTitle>
            <CardDescription>
              {isAdmin ? "Crie e atribua fichas" : "Veja suas fichas ativas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/treinos"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver fichas →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <ClipboardList className="h-5 w-5 text-primary mb-1" />
            <CardTitle className="text-base">Histórico</CardTitle>
            <CardDescription>Seus treinos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/historico"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver histórico →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <TrendingUp className="h-5 w-5 text-primary mb-1" />
            <CardTitle className="text-base">Progressão</CardTitle>
            <CardDescription>Evolução de cargas por exercício</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/progresso"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver progresso →
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Informação de fase */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            🏗️ <strong>Fase 1 concluída!</strong> Em breve: fichas de treino, registro de execução e gráficos de evolução.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
