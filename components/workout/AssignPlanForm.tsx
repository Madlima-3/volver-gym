"use client"

import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type User = { id: string; name: string | null; email: string }

type Props = {
  users: User[]
  currentAssignedTo: string | null
  onAssign: (formData: FormData) => Promise<void>
}

export function AssignPlanForm({ users, currentAssignedTo, onAssign }: Props) {
  const [selected, setSelected] = useState(currentAssignedTo ?? "")
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.set("assigned_to", selected)
    startTransition(async () => {
      await onAssign(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="assign-select">Atribuir a</Label>
        <select
          id="assign-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Nenhum (sem atribuição)</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm" disabled={isPending} className="w-full">
        {saved ? "Salvo!" : isPending ? "Salvando..." : "Salvar atribuição"}
      </Button>
    </form>
  )
}
