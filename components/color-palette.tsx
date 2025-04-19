"use client"

import { useEffect, useRef } from "react"

interface ColorPaletteProps {
  colorReduction: number
}

export function ColorPalette({ colorReduction }: ColorPaletteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Calculate colors based on bit depth
    const colors = Math.pow(2, colorReduction)
    const cellSize = Math.min(20, Math.max(8, Math.floor(200 / Math.sqrt(colors))))
    const cols = Math.ceil(Math.sqrt(colors))
    const rows = Math.ceil(colors / cols)

    // Set canvas size
    canvas.width = cols * cellSize
    canvas.height = rows * cellSize

    // Draw color palette
    let colorIndex = 0
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (colorIndex >= colors) break

        // Calculate color based on index
        const step = 255 / (Math.pow(2, colorReduction / 3) - 1)
        const r = Math.round((colorIndex % Math.pow(2, colorReduction / 3)) * step)
        const g = Math.round(
          (Math.floor(colorIndex / Math.pow(2, colorReduction / 3)) % Math.pow(2, colorReduction / 3)) * step,
        )
        const b = Math.round(
          (Math.floor(colorIndex / Math.pow(2, (colorReduction / 3) * 2)) % Math.pow(2, colorReduction / 3)) * step,
        )

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

        colorIndex++
      }
    }
  }, [colorReduction])

  return (
    <div className="mt-4">
      <div className="text-sm font-medium mb-2">Color Palette ({Math.pow(2, colorReduction)} colors)</div>
      <div className="border border-zinc-800 rounded p-2 flex justify-center">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
    </div>
  )
}
