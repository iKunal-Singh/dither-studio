"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TimelineProps {
  duration: number
  currentTime: number
  keyframes: any[]
  onSeek: (time: number) => void
}

export function Timeline({ duration, currentTime, keyframes, onSeek }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return

    const rect = timelineRef.current.getBoundingClientRect()
    const clickPosition = (e.clientX - rect.left) / rect.width
    const newTime = clickPosition * duration

    onSeek(Math.max(0, Math.min(duration, newTime)))
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return

    const rect = timelineRef.current.getBoundingClientRect()
    const position = (e.clientX - rect.left) / rect.width
    const time = position * duration

    setHoverTime(Math.max(0, Math.min(duration, time)))

    if (isDragging) {
      onSeek(Math.max(0, Math.min(duration, time)))
    }
  }

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setHoverTime(null)
    setIsDragging(false)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative" onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}>
      <div
        ref={timelineRef}
        className="h-8 bg-zinc-800 rounded relative cursor-pointer"
        onClick={handleTimelineClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
      >
        {/* Timeline progress */}
        <div
          className="absolute top-0 left-0 h-full bg-zinc-700 transition-all duration-100"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />

        {/* Hover indicator */}
        {hoverTime !== null && !isDragging && (
          <div
            className="absolute top-0 w-0.5 h-full bg-zinc-500/50"
            style={{ left: `${(hoverTime / duration) * 100}%` }}
          />
        )}

        {/* Playhead */}
        <div className="absolute top-0 w-1 h-full bg-white" style={{ left: `${(currentTime / duration) * 100}%` }} />

        {/* Keyframes */}
        {keyframes.map((keyframe, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute top-0 w-2 h-full bg-yellow-500 rounded-full -ml-1 cursor-pointer hover:bg-yellow-400 transition-colors"
                  style={{ left: `${(keyframe.time / duration) * 100}%` }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSeek(keyframe.time)
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Keyframe at {formatTime(keyframe.time)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Time markers */}
        {Array.from({ length: Math.min(20, Math.ceil(duration / 30)) }).map((_, i) => {
          const interval = Math.ceil(duration / 20)
          const time = i * interval
          const position = (time / duration) * 100

          return (
            <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: `${position}%` }}>
              <div className="w-px h-2 bg-zinc-600" />
              <span className="text-xs text-zinc-500 mt-1">{formatTime(time)}</span>
            </div>
          )
        })}

        {/* Hover time tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute bottom-full mb-2 bg-zinc-900 px-2 py-1 rounded text-xs pointer-events-none"
            style={{
              left: `${(hoverTime / duration) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>
    </div>
  )
}
