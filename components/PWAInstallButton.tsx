"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (isStandalone || !prompt) return null

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") setPrompt(null)
  }

  if (compact) {
    return (
      <button
        onClick={install}
        className="flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl text-muted-foreground transition-colors"
      >
        <Download className="h-5 w-5" />
        <span className="text-[10px] font-medium">Instalar</span>
      </button>
    )
  }

  return (
    <button
      onClick={install}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
        "text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      )}
    >
      <Download className="h-4 w-4 shrink-0" />
      Instalar app
    </button>
  )
}
