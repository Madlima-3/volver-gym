import { cn } from "@/lib/utils"

interface GymCardProps {
  children: React.ReactNode
  className?: string
  highlight?: boolean
  elevated?: boolean
}

export function GymCard({ children, className, highlight, elevated }: GymCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        elevated ? "bg-secondary" : "bg-card",
        highlight
          ? "border-primary/40 shadow-[0_0_24px_-6px_var(--gym-orange)]"
          : "border-border",
        className
      )}
    >
      {children}
    </div>
  )
}
