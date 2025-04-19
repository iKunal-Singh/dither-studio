"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Upload, ZoomIn, ZoomOut, Layers, SlidersHorizontal } from "lucide-react"
import { applyDithering, DITHERING_ALGORITHMS, type DitherAlgorithm, type DitherSettings } from "@/lib/dithering"
import { ImageAdjustments } from "@/components/image-adjustments"
import { HistoryControls } from "@/components/history-controls"
import { ColorPalette } from "@/components/color-palette"

export function DitherEditor() {
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
  const [currentSettings, setCurrentSettings] = useState<DitherSettings>({
    algorithm: "floydSteinberg",
    threshold: 128,
    diffusionFactor: 0.75,
    matrixSize: 8,
    colorReduction: 8,
    serpentine: true,
  })
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    gamma: 1,
    sharpness: 0,
  })
  const [history, setHistory] = useState<DitherSettings[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoom, setZoom] = useState(1)

  const originalCanvasRef = useRef<HTMLCanvasElement>(null)
  const outputCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          setOriginalImage(img)

          // Reset history when loading a new image
          setHistory([currentSettings])
          setHistoryIndex(0)
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    },
    [currentSettings],
  )

  // Apply dithering effect when settings change
  useEffect(() => {
    if (!originalImage || !originalCanvasRef.current || !outputCanvasRef.current) return

    const originalCtx = originalCanvasRef.current.getContext("2d")
    const outputCtx = outputCanvasRef.current.getContext("2d")

    if (!originalCtx || !outputCtx) return

    // Set canvas dimensions
    originalCanvasRef.current.width = originalImage.width
    originalCanvasRef.current.height = originalImage.height
    outputCanvasRef.current.width = originalImage.width
    outputCanvasRef.current.height = originalImage.height

    // Draw original image
    originalCtx.clearRect(0, 0, originalImage.width, originalImage.height)
    originalCtx.drawImage(originalImage, 0, 0)

    // Apply pre-processing adjustments
    const imageData = originalCtx.getImageData(0, 0, originalImage.width, originalImage.height)
    const adjustedImageData = applyAdjustments(imageData, adjustments)

    // Apply dithering
    const ditheredImageData = applyDithering(adjustedImageData, currentSettings)

    // Draw dithered image
    outputCtx.putImageData(ditheredImageData, 0, 0)
  }, [originalImage, currentSettings, adjustments])

  // Update settings and add to history
  const updateSettings = useCallback(
    (newSettings: Partial<DitherSettings>) => {
      const updatedSettings = { ...currentSettings, ...newSettings }
      setCurrentSettings(updatedSettings)

      // Add to history, removing any future states if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(updatedSettings)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [currentSettings, history, historyIndex],
  )

  // Handle undo/redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCurrentSettings(history[historyIndex - 1])
    }
  }, [history, historyIndex])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCurrentSettings(history[historyIndex + 1])
    }
  }, [history, historyIndex])

  // Handle download
  const handleDownload = useCallback(() => {
    if (!outputCanvasRef.current) return

    const link = document.createElement("a")
    link.download = "dithered-image.png"
    link.href = outputCanvasRef.current.toDataURL("image/png")
    link.click()
  }, [])

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      {/* Controls Panel */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col gap-4">
              <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

              {originalImage && (
                <Button onClick={handleDownload} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Result
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {originalImage && (
          <>
            <Tabs defaultValue="algorithm">
              <TabsList className="w-full">
                <TabsTrigger value="algorithm" className="flex-1">
                  <Layers className="mr-2 h-4 w-4" />
                  Dithering
                </TabsTrigger>
                <TabsTrigger value="adjustments" className="flex-1">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Adjustments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="algorithm" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="algorithm">Algorithm</Label>
                      <Select
                        value={currentSettings.algorithm}
                        onValueChange={(value) => updateSettings({ algorithm: value as DitherAlgorithm })}
                      >
                        <SelectTrigger id="algorithm">
                          <SelectValue placeholder="Select algorithm" />
                        </SelectTrigger>
                        <SelectContent>
                          {DITHERING_ALGORITHMS.map((algo) => (
                            <SelectItem key={algo.id} value={algo.id}>
                              {algo.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="threshold">Threshold</Label>
                        <span className="text-xs text-zinc-400">{currentSettings.threshold}</span>
                      </div>
                      <Slider
                        id="threshold"
                        min={0}
                        max={255}
                        step={1}
                        value={[currentSettings.threshold]}
                        onValueChange={([value]) => updateSettings({ threshold: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="diffusion">Diffusion Factor</Label>
                        <span className="text-xs text-zinc-400">{currentSettings.diffusionFactor.toFixed(2)}</span>
                      </div>
                      <Slider
                        id="diffusion"
                        min={0}
                        max={1}
                        step={0.01}
                        value={[currentSettings.diffusionFactor]}
                        onValueChange={([value]) => updateSettings({ diffusionFactor: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="matrixSize">Matrix Size</Label>
                        <span className="text-xs text-zinc-400">
                          {currentSettings.matrixSize}×{currentSettings.matrixSize}
                        </span>
                      </div>
                      <Slider
                        id="matrixSize"
                        min={2}
                        max={16}
                        step={1}
                        value={[currentSettings.matrixSize]}
                        onValueChange={([value]) => updateSettings({ matrixSize: value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="colorReduction">Color Reduction</Label>
                        <span className="text-xs text-zinc-400">{currentSettings.colorReduction} bits</span>
                      </div>
                      <Slider
                        id="colorReduction"
                        min={1}
                        max={8}
                        step={1}
                        value={[currentSettings.colorReduction]}
                        onValueChange={([value]) => updateSettings({ colorReduction: value })}
                      />
                    </div>

                    <ColorPalette colorReduction={currentSettings.colorReduction} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="adjustments" className="mt-4">
                <ImageAdjustments adjustments={adjustments} setAdjustments={setAdjustments} />
              </TabsContent>
            </Tabs>

            <HistoryControls
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </>
        )}
      </div>

      {/* Canvas Display */}
      <div className="bg-zinc-900 rounded-lg overflow-hidden flex flex-col">
        {originalImage ? (
          <div className="relative flex-1 overflow-auto">
            <div className="sticky top-0 z-10 bg-zinc-900 p-3 border-b border-zinc-800 flex justify-between items-center">
              <div className="text-sm text-zinc-400">
                {originalImage.width} × {originalImage.height}px
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4">
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium mb-2 text-zinc-400">Original</div>
                <div className="relative border border-zinc-800 rounded overflow-hidden">
                  <canvas
                    ref={originalCanvasRef}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-sm font-medium mb-2 text-zinc-400">Dithered Result</div>
                <div className="relative border border-zinc-800 rounded overflow-hidden">
                  <canvas
                    ref={outputCanvasRef}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4">
              <Upload className="h-12 w-12 text-zinc-600 mx-auto" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Image Loaded</h3>
            <p className="text-zinc-400 mb-4 max-w-md">
              Upload an image to start applying dithering effects with 20 different algorithms and customizable
              parameters.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to apply image adjustments
function applyAdjustments(imageData: ImageData, adjustments: any): ImageData {
  const { brightness, contrast, saturation, gamma, sharpness } = adjustments
  const data = new Uint8ClampedArray(imageData.data)

  // This is a simplified version - a real implementation would apply all these adjustments
  for (let i = 0; i < data.length; i += 4) {
    // Apply brightness
    data[i] = clamp(data[i] + brightness * 2.55)
    data[i + 1] = clamp(data[i + 1] + brightness * 2.55)
    data[i + 2] = clamp(data[i + 2] + brightness * 2.55)

    // Apply contrast
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
    data[i] = clamp(factor * (data[i] - 128) + 128)
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128)
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128)

    // More adjustments would be implemented here
  }

  return new ImageData(data, imageData.width, imageData.height)
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value))
}
