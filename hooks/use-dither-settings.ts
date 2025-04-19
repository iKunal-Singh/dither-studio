"use client"

import { useState, useCallback } from "react"
import type { DitherSettings } from "@/lib/types"
import { DEFAULT_SETTINGS } from "@/lib/constants"

export function useDitherSettings() {
  const [settings, setSettings] = useState<DitherSettings>(DEFAULT_SETTINGS)

  const updateSettings = useCallback((newSettings: Partial<DitherSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return {
    settings,
    updateSettings,
    resetSettings,
  }
}
