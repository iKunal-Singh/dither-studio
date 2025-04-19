"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DitherSettings } from "@/lib/types"
import { DITHERING_ALGORITHMS } from "@/lib/constants"

interface SettingsPanelProps {
  settings: DitherSettings
  onSettingsChange: (settings: Partial<DitherSettings>) => void
  onResetSettings: () => void
}

export function SettingsPanel({ settings, onSettingsChange, onResetSettings }: SettingsPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="noise-bg">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Dithering Algorithm</h3>
            <Button variant="secondary" size="sm" onClick={onResetSettings}>
              <RefreshCw className="h-3 w-3 mr-2" />
              Reset
            </Button>
          </div>

          <Select value={settings.algorithm} onValueChange={(value) => onSettingsChange({ algorithm: value })}>
            <SelectTrigger className="border-zinc-700 bg-zinc-800/50">
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-800">
              {DITHERING_ALGORITHMS.map((algo) => (
                <SelectItem key={algo.id} value={algo.id}>
                  {algo.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic">
        <TabsList className="w-full">
          <TabsTrigger value="basic" className="flex-1">
            Basic
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1">
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card className="noise-bg">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Label htmlFor="threshold" className="mr-2">
                      Threshold
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Controls the cutoff point between light and dark pixels</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-xs text-zinc-400">{settings.threshold}</span>
                </div>
                <Slider
                  id="threshold"
                  min={0}
                  max={255}
                  step={1}
                  value={[settings.threshold]}
                  onValueChange={([value]) => onSettingsChange({ threshold: value })}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Label htmlFor="diffusionFactor" className="mr-2">
                      Diffusion Factor
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Controls how much error is diffused to neighboring pixels</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-xs text-zinc-400">{settings.diffusionFactor.toFixed(2)}</span>
                </div>
                <Slider
                  id="diffusionFactor"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[settings.diffusionFactor]}
                  onValueChange={([value]) => onSettingsChange({ diffusionFactor: value })}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Label htmlFor="colorReduction" className="mr-2">
                      Color Reduction
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reduces the number of colors in the output (lower = fewer colors)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-xs text-zinc-400">{settings.colorReduction} bits</span>
                </div>
                <Slider
                  id="colorReduction"
                  min={1}
                  max={8}
                  step={1}
                  value={[settings.colorReduction]}
                  onValueChange={([value]) => onSettingsChange({ colorReduction: value })}
                  className="cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card className="noise-bg">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Label htmlFor="matrixSize" className="mr-2">
                      Matrix Size
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Size of the dithering pattern matrix (larger = more detailed patterns)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {settings.matrixSize}×{settings.matrixSize}
                  </span>
                </div>
                <Slider
                  id="matrixSize"
                  min={2}
                  max={16}
                  step={1}
                  value={[settings.matrixSize]}
                  onValueChange={([value]) => onSettingsChange({ matrixSize: value })}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Label htmlFor="serpentine" className="mr-2">
                    Serpentine Scanning
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Alternates scan direction for each row to reduce directional artifacts</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="serpentine"
                  checked={settings.serpentine}
                  onCheckedChange={(checked) => onSettingsChange({ serpentine: checked })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Label htmlFor="noiseAmount" className="mr-2">
                      Noise Amount
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Adds random noise to break up patterns and create texture</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-xs text-zinc-400">{settings.noiseAmount.toFixed(2)}</span>
                </div>
                <Slider
                  id="noiseAmount"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[settings.noiseAmount]}
                  onValueChange={([value]) => onSettingsChange({ noiseAmount: value })}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Label htmlFor="passes" className="mr-2">
                      Rendering Passes
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of times to apply the dithering algorithm (higher = stronger effect)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-xs text-zinc-400">{settings.passes}</span>
                </div>
                <Slider
                  id="passes"
                  min={1}
                  max={4}
                  step={1}
                  value={[settings.passes]}
                  onValueChange={([value]) => onSettingsChange({ passes: value })}
                  className="cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
