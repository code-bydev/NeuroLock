'use client'

import { useCallback, useRef, useEffect } from 'react'

export interface BehaviorData {
  user_id: string
  typing_speed: number
  typing_speed_variance: number
  avg_click_interval: number
  session_duration: number
  mouse_distance: number
  avg_scroll_velocity: number
}

interface BehaviorTrackerState {
  keystrokeTimestamps: number[]
  keystrokeDurations: number[]
  clickTimestamps: number[]
  scrollVelocities: number[]
  sessionStartTime: number
  mousePositions: { x: number; y: number; time: number }[]
  totalMouseDistance: number
  lastMousePosition: { x: number; y: number } | null
  lastScrollTime: number
  lastScrollPosition: number
}

export function useBehaviorTracker(userId: string) {
  const stateRef = useRef<BehaviorTrackerState>({
    keystrokeTimestamps: [],
    keystrokeDurations: [],
    clickTimestamps: [],
    scrollVelocities: [],
    sessionStartTime: Date.now(),
    mousePositions: [],
    totalMouseDistance: 0,
    lastMousePosition: null,
    lastScrollTime: 0,
    lastScrollPosition: 0,
  })

  // Handle keydown events - track timing between keystrokes
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return
    
    const now = Date.now()
    stateRef.current.keystrokeTimestamps.push(now)
  }, [])

  // Handle keyup events - track key hold duration
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return
    
    const timestamps = stateRef.current.keystrokeTimestamps
    if (timestamps.length > 0) {
      const lastKeydown = timestamps[timestamps.length - 1]
      const duration = Date.now() - lastKeydown
      stateRef.current.keystrokeDurations.push(duration)
    }
  }, [])

  // Handle click events
  const handleClick = useCallback(() => {
    stateRef.current.clickTimestamps.push(Date.now())
  }, [])

  // Handle mouse move events
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const state = stateRef.current
    const currentPos = { x: e.clientX, y: e.clientY }
    
    if (state.lastMousePosition) {
      const dx = currentPos.x - state.lastMousePosition.x
      const dy = currentPos.y - state.lastMousePosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      state.totalMouseDistance += distance
    }
    
    state.lastMousePosition = currentPos
    state.mousePositions.push({ ...currentPos, time: Date.now() })
    
    // Keep only last 100 positions to avoid memory issues
    if (state.mousePositions.length > 100) {
      state.mousePositions.shift()
    }
  }, [])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const state = stateRef.current
    const now = Date.now()
    const currentPosition = window.scrollY
    
    if (state.lastScrollTime > 0) {
      const timeDelta = now - state.lastScrollTime
      const positionDelta = Math.abs(currentPosition - state.lastScrollPosition)
      
      if (timeDelta > 0) {
        const velocity = positionDelta / timeDelta * 1000 // pixels per second
        state.scrollVelocities.push(velocity)
        
        // Keep only last 50 velocities
        if (state.scrollVelocities.length > 50) {
          state.scrollVelocities.shift()
        }
      }
    }
    
    state.lastScrollTime = now
    state.lastScrollPosition = currentPosition
  }, [])

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('click', handleClick)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleKeyDown, handleKeyUp, handleClick, handleMouseMove, handleScroll])

  // Calculate statistics
  const calculateMean = (arr: number[]): number => {
    if (arr.length === 0) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  const calculateVariance = (arr: number[]): number => {
    if (arr.length < 2) return 0
    const mean = calculateMean(arr)
    const squaredDiffs = arr.map(x => Math.pow(x - mean, 2))
    return calculateMean(squaredDiffs)
  }

  const calculateIntervals = (timestamps: number[]): number[] => {
    if (timestamps.length < 2) return []
    const intervals: number[] = []
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1])
    }
    return intervals
  }

  // Get current behavior data
  const getBehaviorData = useCallback((): BehaviorData => {
    const state = stateRef.current
    
    // Calculate typing speed from intervals between keystrokes
    const keystrokeIntervals = calculateIntervals(state.keystrokeTimestamps)
    const typingSpeed = calculateMean(keystrokeIntervals) || 150 // default 150ms
    const typingSpeedVariance = calculateVariance(keystrokeIntervals)
    
    // Calculate click intervals
    const clickIntervals = calculateIntervals(state.clickTimestamps)
    const avgClickInterval = calculateMean(clickIntervals) || 1000 // default 1000ms
    
    // Session duration in seconds
    const sessionDuration = (Date.now() - state.sessionStartTime) / 1000
    
    // Average scroll velocity
    const avgScrollVelocity = calculateMean(state.scrollVelocities)
    
    return {
      user_id: userId,
      typing_speed: Math.round(typingSpeed),
      typing_speed_variance: Math.round(typingSpeedVariance),
      avg_click_interval: Math.round(avgClickInterval),
      session_duration: Math.round(sessionDuration),
      mouse_distance: Math.round(state.totalMouseDistance),
      avg_scroll_velocity: Math.round(avgScrollVelocity),
    }
  }, [userId])

  // Reset tracking (for new sessions)
  const resetTracking = useCallback(() => {
    stateRef.current = {
      keystrokeTimestamps: [],
      keystrokeDurations: [],
      clickTimestamps: [],
      scrollVelocities: [],
      sessionStartTime: Date.now(),
      mousePositions: [],
      totalMouseDistance: 0,
      lastMousePosition: null,
      lastScrollTime: 0,
      lastScrollPosition: 0,
    }
  }, [])

  return {
    getBehaviorData,
    resetTracking,
  }
}
