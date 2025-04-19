"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Undo, Redo } from "lucide-react"

interface HistoryControlsProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export function HistoryControls({ canUndo, canRedo, onUndo, onRedo }: HistoryControlsProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" disabled={!canUndo} onClick={onUndo}>
            <Undo className="mr-2 h-4 w-4" />
            Undo
          </Button>
          <Button variant="outline" size="sm" className="flex-1" disabled={!canRedo} onClick={onRedo}>
            <Redo className="mr-2 h-4 w-4" />
            Redo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
