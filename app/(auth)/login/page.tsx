"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dumbbell, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotStatus, setForgotStatus] = useState<"idle" | "loading" | "sent">("idle")
  const [forgotError, setForgotError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("Email ou senha incorretos. Tente novamente.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotError("")
    setForgotStatus("loading")

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo })

    if (error) {
      setForgotError("Não foi possível enviar o email. Verifique o endereço.")
      setForgotStatus("idle")
      return
    }

    setForgotStatus("sent")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Volver Gym</h1>
          <p className="text-sm text-muted-foreground">
            Seu acompanhamento de treinos
          </p>
        </div>

        {!forgotMode ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entrar</CardTitle>
              <CardDescription>
                Use o email e a senha que você criou ao aceitar o convite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Redefinir senha</CardTitle>
              <CardDescription>
                {forgotStatus === "sent"
                  ? "Verifique seu email."
                  : "Enviaremos um link para criar uma nova senha."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forgotStatus === "sent" ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle className="h-10 w-10 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Se esse email estiver cadastrado, você receberá o link em instantes.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setForgotMode(false); setForgotStatus("idle"); setForgotEmail("") }}
                  >
                    Voltar ao login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  {forgotError && <p className="text-sm text-destructive">{forgotError}</p>}

                  <Button type="submit" className="w-full" disabled={forgotStatus === "loading"}>
                    {forgotStatus === "loading" ? "Enviando..." : "Enviar link de redefinição"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => { setForgotMode(false); setForgotError("") }}
                  >
                    Voltar ao login
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Acesso por convite. Fale com o admin para criar sua conta.
        </p>
      </div>
    </div>
  )
}
