"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ImageEditor } from "@/components/image-editor"
import { VideoEditor } from "@/components/video-editor"
import { PresetManager } from "@/components/preset-manager"
import { SettingsPanel } from "@/components/settings-panel"
import { usePresets } from "@/hooks/use-presets"
import { useDitherSettings } from "@/hooks/use-dither-settings"
import { Upload, Download, Layers, Sliders } from "lucide-react"
import type { MediaType } from "@/lib/types"

export function DitherStudio() {
  const [mediaType, setMediaType] = useState<MediaType>("image")
  const [source, setSource] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { settings, updateSettings, resetSettings } = useDitherSettings()
  const { presets, activePreset, savePreset, loadPreset, deletePreset, setActivePreset } = usePresets(updateSettings)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setSource(result)

      // Determine media type
      if (file.type.startsWith("video/")) {
        setMediaType("video")
      } else {
        setMediaType("image")
      }

      setIsProcessing(false)
    }
    reader.readAsDataURL(file)
  }

  const handleDownload = () => {
    // Implementation will depend on whether we're downloading an image or video
    if (mediaType === "image") {
      const canvas = document.querySelector("#output-canvas") as HTMLCanvasElement
      if (!canvas) return

      const link = document.createElement("a")
      link.download = "dithered-output.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    } else {
      // Video download would be implemented here
      // This is more complex and would require rendering the video to a file
      alert("Video download not implemented in this demo")
    }
  }

  const handleSavePreset = (name: string, description: string) => {
    savePreset(name, description, settings)
  }

  return (
    <div className="flex h-full">
      {/* Left sidebar - Settings */}
      <div className="w-80 border-r border-zinc-800 h-[calc(100vh-73px)] overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-2">
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {source && (
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Result
              </Button>
            )}
          </div>

          <Separator />

          <Tabs defaultValue="settings">
            <TabsList className="w-full">
              <TabsTrigger value="settings" className="flex-1">
                <Sliders className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex-1">
                <Layers className="mr-2 h-4 w-4" />
                Presets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="mt-4 space-y-4">
              <SettingsPanel settings={settings} onSettingsChange={updateSettings} onResetSettings={resetSettings} />
            </TabsContent>

            <TabsContent value="presets" className="mt-4">
              <PresetManager
                presets={presets}
                activePreset={activePreset}
                onSavePreset={handleSavePreset}
                onLoadPreset={loadPreset}
                onDeletePreset={deletePreset}
                onSelectPreset={setActivePreset}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 h-[calc(100vh-73px)] overflow-hidden">
        {!source ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8 max-w-md">
              <Upload className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No Media Loaded</h3>
              <p className="text-zinc-400 mb-4">
                Upload an image or video to start applying GPU-accelerated dithering effects.
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Media
              </Button>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-500 mx-auto mb-4"></div>
              <p>Processing media...</p>
            </div>
          </div>
        ) : (
          <>
            {mediaType === "image" ? (
              <ImageEditor source={source} settings={settings} />
            ) : (
              <VideoEditor source={source} settings={settings} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
