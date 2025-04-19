"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Upload, Trash, Plus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Preset } from "@/lib/types"

interface PresetCardProps {
  preset: Preset
  isActive: boolean
  isStacked: boolean
  onSelect: () => void
  onLoad: () => void
  onDelete: () => void
  onToggleStack: () => void
}

export function PresetCard({
  preset,
  isActive,
  isStacked,
  onSelect,
  onLoad,
  onDelete,
  onToggleStack,
}: PresetCardProps) {
  const [isHovering, setIsHovering] = useState(false)

  // Generate a simple pattern based on preset settings for the thumbnail
  const generateThumbnailPattern = () => {
    const { algorithm, threshold, matrixSize } = preset.settings

    // Different patterns based on algorithm
    if (algorithm === "bayer") {
      return `repeating-linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 0px,
        rgba(255, 255, 255, 0.15) ${matrixSize}px,
        transparent ${matrixSize}px,
        transparent ${matrixSize * 2}px
      )`
    } else if (algorithm === "floydSteinberg") {
      return `radial-gradient(
        circle at ${threshold % 100}% ${(threshold / 2) % 100}%,
        rgba(255, 255, 255, 0.2),
        transparent
      )`
    } else {
      return `linear-gradient(
        ${threshold % 360}deg,
        rgba(255, 255, 255, 0.1),
        rgba(200, 200, 200, 0.1)
      )`
    }
  }

  const { matrixSize } = preset.settings

  return (
    <Card
      className={`relative overflow-hidden ${isActive ? "ring-2 ring-zinc-400" : ""} ${
        isStacked ? "border-l-4 border-l-zinc-500" : ""
      } transition-all duration-300 dither-bg`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Thumbnail */}
      <div
        className={`absolute top-0 left-0 w-16 h-full bg-zinc-800 ${
          isHovering ? "animate-[glitch_0.3s_ease_infinite]" : ""
        }`}
        style={{
          backgroundImage: generateThumbnailPattern(),
          backgroundSize: `${matrixSize * 4}px`,
        }}
      />

      <div className="ml-16">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle
              className={`glitch-effect ${isHovering ? "before:opacity-100 after:opacity-100" : ""}`}
              data-text={preset.name}
            >
              {preset.name}
            </CardTitle>

            {preset.rating && (
              <div className="flex items-center">
                <Star className="h-3 w-3 fill-zinc-400 text-zinc-400" />
                <span className="text-xs ml-1">{preset.rating}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">{preset.description}</p>
        </CardHeader>

        <CardContent className="py-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs bg-zinc-800/50">
              {preset.category || "General"}
            </Badge>

            <Badge variant="outline" className="text-xs bg-zinc-800/50">
              {preset.settings.algorithm}
            </Badge>

            {preset.settings.colorReduction <= 2 && (
              <Badge variant="outline" className="text-xs bg-zinc-800/50">
                Low Color
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <div className="flex gap-2 ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleStack()
                    }}
                    className={isStacked ? "bg-zinc-700/50" : ""}
                  >
                    <Plus className={`h-4 w-4 ${isStacked ? "text-zinc-300" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isStacked ? "Remove from stack" : "Add to stack"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onLoad()
                    }}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Apply preset</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete preset</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardFooter>
      </div>
    </Card>
  )
}
