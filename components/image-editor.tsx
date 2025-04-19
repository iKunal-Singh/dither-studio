"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, SquareSplitHorizontalIcon as SplitHorizontal } from "lucide-react"
import type { DitherSettings } from "@/lib/types"
import { initWebGLDithering } from "@/lib/webgl-dithering"

interface ImageEditorProps {
  source: string
  settings: DitherSettings
}

export function ImageEditor({ source, settings }: ImageEditorProps) {
  const [zoom, setZoom] = useState(1)
  const [splitPosition, setSplitPosition] = useState(0.5)
  const [showSplit, setShowSplit] = useState(true)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const rendererRef = useRef<any>(null)

  // Initialize WebGL renderer and load image
  useEffect(() => {
    if (!canvasRef.current) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (!canvasRef.current) return

      setDimensions({ width: img.width, height: img.height })

      // Initialize WebGL renderer
      if (!rendererRef.current) {
        rendererRef.current = initWebGLDithering(canvasRef.current)
      }

      // Set the image as the source texture
      rendererRef.current.setSourceTexture(img)

      // Apply initial settings
      rendererRef.current.updateSettings(settings)

      // Render the image
      rendererRef.current.render(splitPosition, showSplit)

      // Store the image reference
      imageRef.current = img
    }
    img.src = source

    return () => {
      // Clean up WebGL resources
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
    }
  }, [source])

  // Update rendering when settings change
  useEffect(() => {
    if (!rendererRef.current || !imageRef.current) return

    rendererRef.current.updateSettings(settings)
    rendererRef.current.render(splitPosition, showSplit)
  }, [settings, splitPosition, showSplit])

  // Handle zoom
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 4))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25))
  }

  // Handle split view toggle
  const handleToggleSplit = () => {
    setShowSplit((prev) => !prev)
  }

  // Handle split position change
  const handleSplitChange = (values: number[]) => {
    setSplitPosition(values[0])
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-zinc-900 p-3 border-b border-zinc-800 flex justify-between items-center">
        <div className="text-sm text-zinc-400">
          {dimensions.width > 0 ? `${dimensions.width} × ${dimensions.height}px` : "Loading..."}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.25}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 4}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant={showSplit ? "default" : "outline"} size="icon" onClick={handleToggleSplit}>
              <SplitHorizontal className="h-4 w-4" />
            </Button>

            {showSplit && (
              <div className="w-32">
                <Slider value={[splitPosition]} min={0} max={1} step={0.01} onValueChange={handleSplitChange} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-[#1a1a1a] relative">
        <div
          className="relative"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <canvas ref={canvasRef} id="output-canvas" className="bg-black" />
        </div>
      </div>
    </div>
  )
}
