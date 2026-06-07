"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

type Props = {
  onDuplicate: () => Promise<void>
}

export function DuplicatePlanButton({ onDuplicate }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      disabled={isPending}
      onClick={() => startTransition(() => onDuplicate())}
    >
      <Copy className="h-4 w-4 mr-1.5" />
      {isPending ? "Duplicando..." : "Duplicar ficha"}
    </Button>
  )
}
