import { cn } from "../../lib/utils"

export function AnimatedShine({ className }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-lg",
        "before:absolute before:inset-y-0 before:left-[-45%] before:w-1/2 before:rotate-12 before:bg-white/35 before:blur-2xl before:content-['']",
        "before:animate-[shine_5.5s_ease-in-out_infinite]",
        className,
      )}
    />
  )
}
