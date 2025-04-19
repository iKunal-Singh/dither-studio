"use client"

import { useState, useEffect, useCallback } from "react"
import type { Preset, DitherSettings } from "@/lib/types"
import { PRESET_EXAMPLES } from "@/lib/constants"

export function usePresets(onSettingsChange: (settings: Partial<DitherSettings>) => void) {
  const [presets, setPresets] = useState<Preset[]>([])
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Load presets from localStorage on mount
  useEffect(() => {
    const storedPresets = localStorage.getItem("dither-presets")

    if (storedPresets) {
      try {
        setPresets(JSON.parse(storedPresets))
      } catch (error) {
        console.error("Error loading presets:", error)
        // If there's an error, load example presets
        setPresets(PRESET_EXAMPLES)
      }
    } else {
      // If no presets are stored, load example presets
      setPresets(PRESET_EXAMPLES)
    }
  }, [])

  // Save presets to localStorage when they change
  useEffect(() => {
    localStorage.setItem("dither-presets", JSON.stringify(presets))
  }, [presets])

  // Save a new preset
  const savePreset = useCallback((name: string, description: string, settings: DitherSettings) => {
    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name,
      description,
      settings,
      createdAt: Date.now(),
    }

    setPresets((prev) => [...prev, newPreset])
    setActivePreset(newPreset.id)
  }, [])

  // Load a preset
  const loadPreset = useCallback(
    (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId)

      if (preset) {
        onSettingsChange(preset.settings)
        setActivePreset(preset.id)
      }
    },
    [presets, onSettingsChange],
  )

  // Delete a preset
  const deletePreset = useCallback(
    (presetId: string) => {
      setPresets((prev) => prev.filter((p) => p.id !== presetId))

      if (activePreset === presetId) {
        setActivePreset(null)
      }
    },
    [activePreset],
  )

  return {
    presets,
    activePreset,
    savePreset,
    loadPreset,
    deletePreset,
    setActivePreset,
  }
}
