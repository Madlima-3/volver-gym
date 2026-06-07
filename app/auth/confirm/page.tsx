"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dumbbell } from "lucide-react"

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Supabase pode usar dois formatos dependendo do projeto:
    // 1. Hash fragment: /auth/confirm#access_token=...&type=invite  (implicit flow)
    // 2. Query param:  /auth/confirm?token_hash=...&type=invite     (PKCE flow)

    const searchParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))

    const token_hash = searchParams.get("token_hash")
    const type = (searchParams.get("type") ?? hashParams.get("type")) as string

    const access_token = hashParams.get("access_token")
    const refresh_token = hashParams.get("refresh_token")

    async function confirm() {
      let error = null

      if (token_hash) {
        // PKCE flow
        const result = await supabase.auth.verifyOtp({
          token_hash,
          type: type as Parameters<typeof supabase.auth.verifyOtp>[0]["type"],
        })
        error = result.error
      } else if (access_token && refresh_token) {
        // Implicit flow (hash fragment)
        const result = await supabase.auth.setSession({ access_token, refresh_token })
        error = result.error
      } else {
        router.push("/login")
        return
      }

      if (error) {
        router.push("/login")
        return
      }

      if (type === "invite") {
        router.push("/convite/definir-senha")
      } else {
        router.push("/dashboard")
      }
    }

    confirm()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <Dumbbell className="h-8 w-8 text-primary animate-pulse" />
      <p className="text-sm text-muted-foreground">Verificando convite...</p>
    </div>
  )
}
