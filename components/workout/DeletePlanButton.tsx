"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

type Props = {
  onDelete: () => Promise<void>
}

export function DeletePlanButton({ onDelete }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta ficha? Esta ação não pode ser desfeita.")) return
    startTransition(() => onDelete())
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="h-4 w-4 mr-1" />
      {isPending ? "Excluindo..." : "Excluir ficha"}
    </Button>
  )
}
