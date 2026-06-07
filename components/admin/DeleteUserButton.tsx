"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

type Props = {
  onDelete: () => Promise<{ error?: string } | void>
  userName: string
}

export function DeleteUserButton({ onDelete, userName }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Tem certeza que deseja excluir "${userName}"? Todos os dados do usuário serão removidos permanentemente.`)) return
    startTransition(async () => {
      const result = await onDelete()
      if (result?.error) alert(result.error)
    })
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="h-4 w-4 mr-1.5" />
      {isPending ? "Excluindo..." : "Excluir usuário"}
    </Button>
  )
}
