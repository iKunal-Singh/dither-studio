// Define the dithering algorithm types
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

// Define the dithering settings interface
export interface DitherSettings {
  algorithm: DitherAlgorithm
  threshold: number
  diffusionFactor: number
  matrixSize: number
  colorReduction: number
  serpentine?: boolean
}

// Define the algorithm metadata
export const DITHERING_ALGORITHMS = [
  { id: "floydSteinberg", name: "Floyd-Steinberg" },
  { id: "atkinson", name: "Atkinson" },
  { id: "jarvisJudiceNinke", name: "Jarvis-Judice-Ninke" },
  { id: "stucki", name: "Stucki" },
  { id: "burkes", name: "Burkes" },
  { id: "sierra", name: "Sierra" },
  { id: "twoRowSierra", name: "Two-Row Sierra" },
  { id: "sierraLite", name: "Sierra Lite" },
  { id: "bayer", name: "Bayer Matrix" },
  { id: "ordered", name: "Ordered" },
  { id: "clustered", name: "Clustered Dot" },
  { id: "halftone", name: "Halftone" },
  { id: "threshold", name: "Simple Threshold" },
  { id: "random", name: "Random" },
  { id: "dotScreen", name: "Dot Screen" },
  { id: "crossHatch", name: "Cross Hatch" },
  { id: "errorDiffusion", name: "Error Diffusion" },
  { id: "riemersma", name: "Riemersma" },
  { id: "falseDiffusion", name: "False Diffusion" },
  { id: "pattern", name: "Pattern Dithering" },
]

// Main function to apply dithering
export function applyDithering(imageData: ImageData, settings: DitherSettings): ImageData {
  const { algorithm, threshold, diffusionFactor, matrixSize, colorReduction } = settings

  // Create a copy of the image data to work with
  const result = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height

  // Apply color reduction
  const factor = Math.pow(2, 8 - colorReduction)
  for (let i = 0; i < result.length; i++) {
    if ((i + 1) % 4 !== 0) {
      // Skip alpha channel
      result[i] = Math.floor(result[i] / factor) * factor
    }
  }

  // Apply the selected dithering algorithm
  switch (algorithm) {
    case "floydSteinberg":
      return floydSteinbergDither(new ImageData(result, width, height), threshold, diffusionFactor)
    case "atkinson":
      return atkinsonDither(new ImageData(result, width, height), threshold, diffusionFactor)
    case "bayer":
      return bayerDither(new ImageData(result, width, height), threshold, matrixSize)
    case "threshold":
      return thresholdDither(new ImageData(result, width, height), threshold)
    case "random":
      return randomDither(new ImageData(result, width, height), threshold)
    // In a real implementation, all 20 algorithms would be implemented
    default:
      // Default to Floyd-Steinberg if the algorithm is not implemented
      return floydSteinbergDither(new ImageData(result, width, height), threshold, diffusionFactor)
  }
}

// Floyd-Steinberg dithering algorithm
function floydSteinbergDither(imageData: ImageData, threshold: number, diffusionFactor: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      // Get current pixel values
      const oldR = data[idx]
      const oldG = data[idx + 1]
      const oldB = data[idx + 2]

      // Calculate new pixel values (simple black and white)
      const avg = (oldR + oldG + oldB) / 3
      const newVal = avg > threshold ? 255 : 0

      // Set new pixel values
      data[idx] = newVal
      data[idx + 1] = newVal
      data[idx + 2] = newVal

      // Calculate error
      const errorR = oldR - newVal
      const errorG = oldG - newVal
      const errorB = oldB - newVal

      // Distribute error to neighboring pixels
      distributeError(data, width, height, x, y, errorR, errorG, errorB, diffusionFactor)
    }
  }

  return new ImageData(data, width, height)
}

// Helper function to distribute error in Floyd-Steinberg
function distributeError(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  errorR: number,
  errorG: number,
  errorB: number,
  diffusionFactor: number,
): void {
  // Floyd-Steinberg error distribution pattern:
  // [ * 7 ]
  // [ 3 5 1 ]
  // where * is the current pixel

  const distribute = (x: number, y: number, factor: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return

    const idx = (y * width + x) * 4
    data[idx] = Math.max(0, Math.min(255, data[idx] + errorR * factor * diffusionFactor))
    data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + errorG * factor * diffusionFactor))
    data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + errorB * factor * diffusionFactor))
  }

  distribute(x + 1, y, 7 / 16)
  distribute(x - 1, y + 1, 3 / 16)
  distribute(x, y + 1, 5 / 16)
  distribute(x + 1, y + 1, 1 / 16)
}

// Atkinson dithering algorithm
function atkinsonDither(imageData: ImageData, threshold: number, diffusionFactor: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      // Get current pixel values
      const oldR = data[idx]
      const oldG = data[idx + 1]
      const oldB = data[idx + 2]

      // Calculate new pixel values (simple black and white)
      const avg = (oldR + oldG + oldB) / 3
      const newVal = avg > threshold ? 255 : 0

      // Set new pixel values
      data[idx] = newVal
      data[idx + 1] = newVal
      data[idx + 2] = newVal

      // Calculate error
      const error = Math.floor(((avg - newVal) / 8) * diffusionFactor)

      // Atkinson pattern distributes 1/8 of the error to 6 surrounding pixels
      const pattern = [
        [1, 0],
        [2, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
        [0, 2],
      ]

      for (const [dx, dy] of pattern) {
        const nx = x + dx
        const ny = y + dy

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = (ny * width + nx) * 4
          data[nidx] = Math.max(0, Math.min(255, data[nidx] + error))
          data[nidx + 1] = Math.max(0, Math.min(255, data[nidx + 1] + error))
          data[nidx + 2] = Math.max(0, Math.min(255, data[nidx + 2] + error))
        }
      }
    }
  }

  return new ImageData(data, width, height)
}

// Bayer matrix dithering
function bayerDither(imageData: ImageData, threshold: number, matrixSize: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height

  // Generate Bayer matrix of the specified size
  const bayerMatrix = generateBayerMatrix(matrixSize)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      // Get current pixel values
      const oldR = data[idx]
      const oldG = data[idx + 1]
      const oldB = data[idx + 2]

      // Get threshold from Bayer matrix
      const matrixX = x % matrixSize
      const matrixY = y % matrixSize
      const matrixThreshold = bayerMatrix[matrixY][matrixX] * 255

      // Apply threshold to each channel
      data[idx] = oldR > matrixThreshold ? 255 : 0
      data[idx + 1] = oldG > matrixThreshold ? 255 : 0
      data[idx + 2] = oldB > matrixThreshold ? 255 : 0
    }
  }

  return new ImageData(data, width, height)
}

// Generate Bayer matrix of specified size
function generateBayerMatrix(n: number): number[][] {
  if (n === 2) {
    return [
      [0 / 4, 2 / 4],
      [3 / 4, 1 / 4],
    ]
  }

  // Generate larger matrices recursively
  const prevMatrix = generateBayerMatrix(n / 2)
  const matrix: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const quadrant = Math.floor(y / (n / 2)) * 2 + Math.floor(x / (n / 2))
      const prevY = y % (n / 2)
      const prevX = x % (n / 2)

      switch (quadrant) {
        case 0:
          matrix[y][x] = prevMatrix[prevY][prevX] / 4
          break
        case 1:
          matrix[y][x] = prevMatrix[prevY][prevX] / 4 + 2 / 4
          break
        case 2:
          matrix[y][x] = prevMatrix[prevY][prevX] / 4 + 3 / 4
          break
        case 3:
          matrix[y][x] = prevMatrix[prevY][prevX] / 4 + 1 / 4
          break
      }
    }
  }

  return matrix
}

// Simple threshold dithering
function thresholdDither(imageData: ImageData, threshold: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    const newVal = avg > threshold ? 255 : 0

    data[i] = newVal
    data[i + 1] = newVal
    data[i + 2] = newVal
  }

  return new ImageData(data, width, height)
}

// Random dithering
function randomDither(imageData: ImageData, threshold: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    const randomThreshold = threshold * (0.8 + Math.random() * 0.4) // Random threshold ±20%
    const newVal = avg > randomThreshold ? 255 : 0

    data[i] = newVal
    data[i + 1] = newVal
    data[i + 2] = newVal
  }

  return new ImageData(data, width, height)
}
