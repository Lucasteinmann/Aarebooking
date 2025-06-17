import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"

export function MenuButton({ onClick, className }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className={className}>
      <Menu />
    </Button>
  )
}
