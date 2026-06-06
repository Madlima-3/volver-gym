"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

type Props = {
  onDelete: () => Promise<void>
}

export function DeleteExerciseButton({ onDelete }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm("Remover este exercício?")) return
    startTransition(() => onDelete())
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
