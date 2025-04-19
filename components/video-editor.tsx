"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  ZoomIn,
  ZoomOut,
  SquareSplitHorizontalIcon as SplitHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Info,
  Maximize,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import type { DitherSettings } from "@/lib/types"
import { initWebGLDithering } from "@/lib/webgl-dithering"
import { Timeline } from "@/components/timeline"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface VideoEditorProps {
  source: string
  settings: DitherSettings
}

export function VideoEditor({ source, settings }: VideoEditorProps) {
  const [zoom, setZoom] = useState(1)
  const [splitPosition, setSplitPosition] = useState(0.5)
  const [showSplit, setShowSplit] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [keyframes, setKeyframes] = useState<any[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fps, setFps] = useState(0)
  const [showWaveform, setShowWaveform] = useState(false)
  const [temporalDithering, setTemporalDithering] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rendererRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 })
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Initialize video and WebGL renderer
  useEffect(() => {
    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.muted = true
    video.playsInline = true

    setIsProcessing(true)
    toast({
      title: "Processing video",
      description: "Preparing video for dithering...",
      duration: 3000,
    })

    video.onloadedmetadata = () => {
      if (!canvasRef.current) return

      setDimensions({ width: video.videoWidth, height: video.videoHeight })
      setDuration(video.duration)

      // Set canvas dimensions
      canvasRef.current.width = video.videoWidth
      canvasRef.current.height = video.videoHeight

      // Initialize WebGL renderer
      if (!rendererRef.current) {
        rendererRef.current = initWebGLDithering(canvasRef.current)
      }

      // Store video reference
      videoRef.current = video
      setIsProcessing(false)

      toast({
        title: "Video ready",
        description: `${video.videoWidth}x${video.videoHeight} at ${Math.round(video.duration)} seconds`,
        duration: 3000,
      })
    }

    video.src = source

    // Set up keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        setIsPlaying((prev) => !prev)
      } else if (e.code === "ArrowLeft") {
        e.preventDefault()
        if (videoRef.current) {
          const newTime = Math.max(0, videoRef.current.currentTime - 5)
          handleSeek(newTime)
        }
      } else if (e.code === "ArrowRight") {
        e.preventDefault()
        if (videoRef.current) {
          const newTime = Math.min(duration, videoRef.current.currentTime + 5)
          handleSeek(newTime)
        }
      } else if (e.code === "KeyF") {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      // Clean up
      window.removeEventListener("keydown", handleKeyDown)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }

      video.pause()
      video.src = ""
    }
  }, [source, toast])

  // Handle video playback and rendering
  useEffect(() => {
    if (!videoRef.current || !rendererRef.current) return

    const video = videoRef.current

    const renderFrame = () => {
      if (!video || !rendererRef.current) return

      // Update current time
      setCurrentTime(video.currentTime)

      // Calculate FPS
      const now = performance.now()
      fpsCounterRef.current.frames++
      if (now - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames)
        fpsCounterRef.current.frames = 0
        fpsCounterRef.current.lastTime = now
      }

      // Get settings for current time (interpolate between keyframes if needed)
      const currentSettings = getSettingsAtTime(video.currentTime, keyframes, settings)

      // Update renderer settings
      rendererRef.current.updateSettings({
        ...currentSettings,
        temporalDithering: temporalDithering,
      })

      // Set video frame as source texture
      rendererRef.current.setSourceTexture(video)

      // Render the frame
      rendererRef.current.render(splitPosition, showSplit)

      // Update waveform if enabled
      if (showWaveform && waveformCanvasRef.current) {
        updateWaveform(video, waveformCanvasRef.current)
      }

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(renderFrame)
    }

    if (isPlaying) {
      video
        .play()
        .then(() => {
          renderFrame()
        })
        .catch((error) => {
          console.error("Error playing video:", error)
          setIsPlaying(false)
          toast({
            title: "Playback error",
            description: "Could not play the video. Try again.",
            variant: "destructive",
          })
        })
    } else {
      video.pause()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Render current frame
      rendererRef.current.setSourceTexture(video)
      rendererRef.current.updateSettings({
        ...getSettingsAtTime(video.currentTime, keyframes, settings),
        temporalDithering: temporalDithering,
      })
      rendererRef.current.render(splitPosition, showSplit)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isPlaying, splitPosition, showSplit, keyframes, settings, temporalDithering, showWaveform])

  // Handle seeking
  const handleSeek = (time: number) => {
    if (!videoRef.current) return

    videoRef.current.currentTime = time
    setCurrentTime(time)

    // Render the frame at the new position
    if (!isPlaying && rendererRef.current) {
      rendererRef.current.setSourceTexture(videoRef.current)
      rendererRef.current.updateSettings(getSettingsAtTime(time, keyframes, settings))
      rendererRef.current.render(splitPosition, showSplit)
    }
  }

  // Handle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  // Handle zoom
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 4))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25))
  }

  // Handle split view toggle
  const handleToggleSplit = () => {
    setShowSplit((prev) => !prev)
  }

  // Handle split position change
  const handleSplitChange = (values: number[]) => {
    setSplitPosition(values[0])
  }

  // Add keyframe at current time
  const addKeyframe = () => {
    const newKeyframe = {
      time: currentTime,
      settings: { ...settings },
    }

    setKeyframes((prev) => {
      // Check if a keyframe already exists at this time
      const existingIndex = prev.findIndex((kf) => Math.abs(kf.time - currentTime) < 0.1)

      if (existingIndex >= 0) {
        // Update existing keyframe
        const updated = [...prev]
        updated[existingIndex] = newKeyframe
        return updated
      } else {
        // Add new keyframe and sort by time
        return [...prev, newKeyframe].sort((a, b) => a.time - b.time)
      }
    })

    toast({
      title: "Keyframe added",
      description: `Keyframe set at ${formatTime(currentTime)}`,
    })
  }

  // Delete keyframe at current time
  const deleteKeyframe = () => {
    setKeyframes((prev) => {
      const existingIndex = prev.findIndex((kf) => Math.abs(kf.time - currentTime) < 0.1)

      if (existingIndex >= 0) {
        const updated = [...prev]
        updated.splice(existingIndex, 1)

        toast({
          title: "Keyframe deleted",
          description: `Keyframe at ${formatTime(currentTime)} removed`,
        })

        return updated
      }

      return prev
    })
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true)
        })
        .catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Format time as MM:SS.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
      .toString()
      .padStart(2, "0")}`
  }

  // Update waveform visualization
  const updateWaveform = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw waveform (simplified representation)
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)"

    // Create a simple waveform visualization based on the current time
    const numBars = 50
    const barWidth = canvas.width / numBars

    for (let i = 0; i < numBars; i++) {
      // Generate a pseudo-random height based on video time and position
      const height = Math.sin(video.currentTime * 2 + i * 0.2) * 0.3 + 0.5
      const barHeight = height * canvas.height

      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight)
    }

    // Draw playhead
    const playheadPosition = (video.currentTime / video.duration) * canvas.width
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.fillRect(playheadPosition, 0, 2, canvas.height)
  }

  // Skip forward/backward
  const skipForward = () => {
    if (!videoRef.current) return
    const newTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10)
    handleSeek(newTime)
  }

  const skipBackward = () => {
    if (!videoRef.current) return
    const newTime = Math.max(0, videoRef.current.currentTime - 10)
    handleSeek(newTime)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-zinc-900 p-3 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="text-sm text-zinc-400">
            {dimensions.width > 0 ? `${dimensions.width} × ${dimensions.height}px` : "Loading..."}
          </div>
          {showStats && (
            <Badge variant="outline" className="ml-2">
              {fps} FPS
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.25}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 4}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={showSplit ? "default" : "outline"} size="icon" onClick={handleToggleSplit}>
                    <SplitHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle split view to compare original and dithered video</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {showSplit && (
              <div className="w-32">
                <Slider value={[splitPosition]} min={0} max={1} step={0.01} onValueChange={handleSplitChange} />
              </div>
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle fullscreen (F)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-[#1a1a1a] relative">
        {isProcessing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-500 mx-auto mb-4"></div>
              <p className="text-zinc-300">Processing video...</p>
            </div>
          </div>
        ) : null}

        <div
          className="relative"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <canvas ref={canvasRef} id="output-canvas" className="bg-black" />
        </div>

        {showWaveform && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/30 backdrop-blur-sm">
            <canvas ref={waveformCanvasRef} className="w-full h-full" />
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border-t border-zinc-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={skipBackward}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={togglePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={skipForward}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-zinc-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={addKeyframe}>
                    <Clock className="h-4 w-4 mr-2" />
                    Add Keyframe
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a keyframe at the current position to animate dithering settings over time</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
              className="text-zinc-400"
            >
              Advanced{" "}
              {showAdvancedPanel ? <ChevronRight className="h-4 w-4 ml-1" /> : <ChevronLeft className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>

        <Timeline duration={duration} currentTime={currentTime} keyframes={keyframes} onSeek={handleSeek} />

        {showAdvancedPanel && (
          <Card className="mt-3 p-3 bg-zinc-800/50 border-zinc-700">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm mr-2">Temporal Dithering</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Distributes dithering errors across frames to reduce flicker in animations</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  variant={temporalDithering ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTemporalDithering(!temporalDithering)}
                >
                  {temporalDithering ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm mr-2">Waveform</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Display audio waveform visualization</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  variant={showWaveform ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowWaveform(!showWaveform)}
                >
                  {showWaveform ? "On" : "Off"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm mr-2">Performance Stats</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Show FPS and performance metrics</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button variant={showStats ? "default" : "outline"} size="sm" onClick={() => setShowStats(!showStats)}>
                  {showStats ? "On" : "Off"}
                </Button>
              </div>
            </div>

            <div className="mt-3 flex justify-between">
              <Button variant="outline" size="sm" onClick={deleteKeyframe}>
                Delete Keyframe
              </Button>

              <Button variant="outline" size="sm">
                Export Frame
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

// Helper function to get interpolated settings at a specific time
function getSettingsAtTime(time: number, keyframes: any[], defaultSettings: DitherSettings): DitherSettings {
  if (keyframes.length === 0) {
    return defaultSettings
  }

  // Find the keyframes before and after the current time
  const beforeKeyframes = keyframes.filter((kf) => kf.time <= time).sort((a, b) => b.time - a.time)
  const afterKeyframes = keyframes.filter((kf) => kf.time > time).sort((a, b) => a.time - b.time)

  // If we're before the first keyframe or after the last keyframe, use the closest one
  if (beforeKeyframes.length === 0) {
    return afterKeyframes[0].settings
  }

  if (afterKeyframes.length === 0) {
    return beforeKeyframes[0].settings
  }

  // Otherwise, interpolate between the two closest keyframes
  const beforeKeyframe = beforeKeyframes[0]
  const afterKeyframe = afterKeyframes[0]

  // Calculate interpolation factor (0 to 1)
  const factor = (time - beforeKeyframe.time) / (afterKeyframe.time - beforeKeyframe.time)

  // Interpolate numeric settings
  const result: any = {}

  for (const key in beforeKeyframe.settings) {
    if (typeof beforeKeyframe.settings[key] === "number") {
      result[key] = beforeKeyframe.settings[key] + (afterKeyframe.settings[key] - beforeKeyframe.settings[key]) * factor
    } else {
      // For non-numeric settings, use the before keyframe's value
      result[key] = beforeKeyframe.settings[key]
    }
  }

  return result as DitherSettings
}
