"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Page error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 space-y-4">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div>
        <h2 className="text-lg font-semibold">Algo deu errado</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {error.message || "Erro inesperado ao carregar a página."}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mt-1">
            Código: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          Voltar
        </Button>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  )
}
