import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"

export default function ProgressoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progressão</h1>
        <p className="text-muted-foreground mt-1">Evolução de cargas por exercício</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Em breve — Fase 4</p>
          <p className="text-xs text-muted-foreground mt-1">
            Gráficos de progressão de carga serão exibidos aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
