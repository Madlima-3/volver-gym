"use client"

import { useTransition } from "react"
import { assignWorkoutPlan } from "@/lib/actions/workout-plans"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState } from "react"

type User = { id: string; name: string | null; email: string }

export function AssignPlanForm({
  planId,
  users,
  currentAssignedTo,
}: {
  planId: string
  users: User[]
  currentAssignedTo: string | null
}) {
  const [selected, setSelected] = useState(currentAssignedTo ?? "")
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.set("assigned_to", selected)
    startTransition(async () => {
      await assignWorkoutPlan(planId, formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label>Atribuir a</Label>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um usuário..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhum (sem atribuição)</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name ?? u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={isPending} className="w-full">
        {saved ? "Salvo!" : isPending ? "Salvando..." : "Salvar atribuição"}
      </Button>
    </form>
  )
}
