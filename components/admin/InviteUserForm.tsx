"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inviteUser, type InviteState } from "@/lib/actions/users"

const initialState: InviteState = {}

export function InviteUserForm() {
  const [state, formAction, isPending] = useActionState(inviteUser, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      router.push("/admin/usuarios")
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Nome completo" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="nome@email.com"
          required
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/usuarios")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enviando..." : "Enviar convite"}
        </Button>
      </div>
    </form>
  )
}
