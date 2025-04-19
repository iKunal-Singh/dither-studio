export type DitherAlgorithm =
  | "floydSteinberg"
  | "atkinson"
  | "jarvisJudiceNinke"
  | "stucki"
  | "burkes"
  | "sierra"
  | "twoRowSierra"
  | "sierraLite"
  | "bayer"
  | "ordered"
  | "clustered"
  | "halftone"
  | "threshold"
  | "random"
  | "dotScreen"
  | "crossHatch"
  | "errorDiffusion"
  | "riemersma"
  | "falseDiffusion"
  | "pattern"

export interface DitherSettings {
  algorithm: DitherAlgorithm
  threshold: number
  diffusionFactor: number
  matrixSize: number
  colorReduction: number
  serpentine: boolean
  noiseAmount: number
  passes: number
}

export interface Preset {
  id: string
  name: string
  description: string
  settings: DitherSettings
  createdAt: number
  category?: string
  rating?: number
}

export interface PresetCategory {
  id: string
  name: string
}

export type MediaType = "image" | "video"
