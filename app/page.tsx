import { DitherStudio } from "@/components/dither-studio"

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col dither-bg">
      <header className="border-b border-zinc-800 p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold glitch-effect" data-text="WebGL Dither Studio">WebGL Dither Studio</h1>
          <p className="text-zinc-400">GPU-accelerated dithering engine with 20+ algorithms and video support</p>
        </div>
      </header>
      <div className="flex-1">
        <DitherStudio />
      </div>
    </main>
  )
}
