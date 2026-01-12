"use client"

import { useCallback, useRef } from "react"

// Simple notification sound using Web Audio API
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null)

  const playSound = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }

      const ctx = audioContextRef.current

      // Resume context if suspended (required by browsers)
      if (ctx.state === "suspended") {
        ctx.resume()
      }

      // Create a simple "ding" sound
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      // Configure the sound
      oscillator.frequency.setValueAtTime(800, ctx.currentTime) // Higher pitch
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
      oscillator.type = "sine"

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

      // Play
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch (error) {
      // Silently fail if audio is not available
      console.debug("Audio notification not available:", error)
    }
  }, [])

  return { playSound }
}
