import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList } from "lucide-react"

export default function HistoricoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
        <p className="text-muted-foreground mt-1">Seus treinos registrados</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Em breve — Fase 3</p>
          <p className="text-xs text-muted-foreground mt-1">
            Aqui vai aparecer o histórico completo dos seus treinos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
