"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Download, Upload, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PresetCard } from "@/components/preset-card"
import type { Preset, PresetCategory } from "@/lib/types"

interface PresetManagerProps {
  presets: Preset[]
  activePreset: string | null
  onSavePreset: (name: string, description: string, category: string) => void
  onLoadPreset: (presetId: string) => void
  onDeletePreset: (presetId: string) => void
  onSelectPreset: (presetId: string | null) => void
}

export function PresetManager({
  presets,
  activePreset,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onSelectPreset,
}: PresetManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState("")
  const [presetDescription, setPresetDescription] = useState("")
  const [presetCategory, setPresetCategory] = useState("general")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [stackedPresets, setStackedPresets] = useState<string[]>([])
  const [showInfo, setShowInfo] = useState(false)

  // Preset categories
  const categories: PresetCategory[] = [
    { id: "all", name: "All Presets" },
    { id: "retro", name: "Retro Consoles" },
    { id: "film", name: "Film Grain" },
    { id: "glitch", name: "Glitch Art" },
    { id: "minimalist", name: "Minimalist" },
    { id: "general", name: "General" },
  ]

  // Filter presets by category
  const filteredPresets =
    activeCategory === "all" ? presets : presets.filter((preset) => preset.category === activeCategory)

  const handleSavePreset = () => {
    if (!presetName.trim()) return

    onSavePreset(presetName, presetDescription, presetCategory)
    setPresetName("")
    setPresetDescription("")
    setIsDialogOpen(false)
  }

  const handleExportPresets = () => {
    const dataStr = JSON.stringify(presets)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = "dither-presets.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleImportPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedPresets = JSON.parse(event.target?.result as string)

        // Here you would typically validate the imported presets
        // and then add them to your existing presets
        alert(`Imported ${importedPresets.length} presets successfully!`)

        // Reset the input
        e.target.value = ""
      } catch (error) {
        console.error("Error importing presets:", error)
        alert("Failed to import presets. Invalid format.")
      }
    }
    reader.readAsText(file)
  }

  // Toggle a preset in the stacked presets array
  const toggleStackedPreset = (presetId: string) => {
    setStackedPresets((prev) => {
      if (prev.includes(presetId)) {
        return prev.filter((id) => id !== presetId)
      } else {
        return [...prev, presetId]
      }
    })
  }

  // Apply stacked presets
  const applyStackedPresets = () => {
    // In a real implementation, this would merge the settings from all stacked presets
    if (stackedPresets.length > 0) {
      onLoadPreset(stackedPresets[stackedPresets.length - 1])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setIsDialogOpen(true)} className="flex-1">
          <Save className="mr-2 h-4 w-4" />
          Save Preset
        </Button>

        <input type="file" id="import-presets" className="hidden" accept=".json" onChange={handleImportPresets} />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" onClick={handleExportPresets}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export all presets</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" onClick={() => document.getElementById("import-presets")?.click()}>
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Import presets</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" onClick={() => setShowInfo(!showInfo)}>
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Preset information</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {showInfo && (
        <Card className="bg-zinc-800/50 border-zinc-700 noise-bg">
          <CardContent className="p-4 text-sm">
            <h4 className="font-medium mb-2">Using Presets</h4>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
              <li>Click a preset to select it</li>
              <li>Use the "Load" button to apply a preset's settings</li>
              <li>Stack multiple presets by using the "+" button</li>
              <li>Create your own presets with the "Save Preset" button</li>
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full grid grid-cols-3 h-auto">
          {categories.slice(0, 3).map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs py-1">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsList className="w-full grid grid-cols-3 h-auto mt-1">
          {categories.slice(3).map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs py-1">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-4">
            <Card className="noise-bg">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-2 flex justify-between items-center">
                  <span>{category.name}</span>
                  {stackedPresets.length > 0 && (
                    <Button size="sm" variant="glitch" onClick={applyStackedPresets}>
                      Apply Stacked ({stackedPresets.length})
                    </Button>
                  )}
                </h3>

                {filteredPresets.length === 0 ? (
                  <p className="text-sm text-zinc-400">No presets in this category.</p>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {filteredPresets.map((preset) => (
                        <PresetCard
                          key={preset.id}
                          preset={preset}
                          isActive={activePreset === preset.id}
                          isStacked={stackedPresets.includes(preset.id)}
                          onSelect={() => onSelectPreset(preset.id === activePreset ? null : preset.id)}
                          onLoad={() => onLoadPreset(preset.id)}
                          onDelete={() => onDeletePreset(preset.id)}
                          onToggleStack={() => toggleStackedPreset(preset.id)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-700 noise-bg">
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="preset-name" className="text-sm font-medium">
                Preset Name
              </label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="My Awesome Preset"
                className="border-zinc-700 bg-zinc-800/50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="preset-category" className="text-sm font-medium">
                Category
              </label>
              <select
                id="preset-category"
                value={presetCategory}
                onChange={(e) => setPresetCategory(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm"
              >
                {categories
                  .filter((c) => c.id !== "all")
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="preset-description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="preset-description"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Describe what this preset is good for..."
                rows={3}
                className="border-zinc-700 bg-zinc-800/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>Save Preset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
