"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

interface ImageAdjustmentsProps {
  adjustments: {
    brightness: number
    contrast: number
    saturation: number
    gamma: number
    sharpness: number
  }
  setAdjustments: React.Dispatch<
    React.SetStateAction<{
      brightness: number
      contrast: number
      saturation: number
      gamma: number
      sharpness: number
    }>
  >
}

export function ImageAdjustments({ adjustments, setAdjustments }: ImageAdjustmentsProps) {
  const updateAdjustment = (key: keyof typeof adjustments, value: number) => {
    setAdjustments((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="brightness">Brightness</Label>
            <span className="text-xs text-zinc-400">{adjustments.brightness}</span>
          </div>
          <Slider
            id="brightness"
            min={-100}
            max={100}
            step={1}
            value={[adjustments.brightness]}
            onValueChange={([value]) => updateAdjustment("brightness", value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="contrast">Contrast</Label>
            <span className="text-xs text-zinc-400">{adjustments.contrast}</span>
          </div>
          <Slider
            id="contrast"
            min={-100}
            max={100}
            step={1}
            value={[adjustments.contrast]}
            onValueChange={([value]) => updateAdjustment("contrast", value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="saturation">Saturation</Label>
            <span className="text-xs text-zinc-400">{adjustments.saturation}</span>
          </div>
          <Slider
            id="saturation"
            min={-100}
            max={100}
            step={1}
            value={[adjustments.saturation]}
            onValueChange={([value]) => updateAdjustment("saturation", value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="gamma">Gamma</Label>
            <span className="text-xs text-zinc-400">{adjustments.gamma.toFixed(2)}</span>
          </div>
          <Slider
            id="gamma"
            min={0.1}
            max={3}
            step={0.05}
            value={[adjustments.gamma]}
            onValueChange={([value]) => updateAdjustment("gamma", value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="sharpness">Sharpness</Label>
            <span className="text-xs text-zinc-400">{adjustments.sharpness}</span>
          </div>
          <Slider
            id="sharpness"
            min={0}
            max={100}
            step={1}
            value={[adjustments.sharpness]}
            onValueChange={([value]) => updateAdjustment("sharpness", value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
