"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"

type Props = {
  onDelete: () => Promise<{ error?: string }>
}

export function DeleteTemplateButton({ onDelete }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm("Excluir este exercício do banco? Essa ação não afeta fichas já criadas.")) return
        startTransition(async () => {
          const result = await onDelete()
          if (result?.error) alert(result.error)
        })
      }}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
      title="Excluir"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
