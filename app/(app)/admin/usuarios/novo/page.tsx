import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GymCard } from "@/components/ui/GymCard"
import { InviteUserForm } from "@/components/admin/InviteUserForm"
import { ArrowLeft, Mail } from "lucide-react"

export default async function NovoUsuarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/admin/usuarios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Convidar usuário</h1>
          <p className="text-muted-foreground text-sm">Enviar convite por email</p>
        </div>
      </div>

      <GymCard elevated className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Dados do novo membro</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          O usuário vai receber um email com o link para criar a senha e acessar o app.
        </p>
        <InviteUserForm />
      </GymCard>

      <p className="text-xs text-muted-foreground text-center">
        O convite expira em 24 horas. Você pode reenviar se necessário.
      </p>
    </div>
  )
}
