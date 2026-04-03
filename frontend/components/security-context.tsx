'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, useId, type ReactNode } from 'react'
import { useBehaviorTracker, type BehaviorData } from './behavior-tracker'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type SystemStatus = 'learning' | 'active'

export interface SecurityState {
  riskLevel: RiskLevel
  anomalyScore: number
  bufferAvg: number
  status: SystemStatus
  samplesCollected: number
  modelTrained: boolean
  lastChecked: Date | null
  isChecking: boolean
}

export interface PredictionResponse {
  anomaly_score: number
  risk_level: RiskLevel
  action: 'ALLOW' | 'OTP_REQUIRED' | 'BIOMETRIC_REQUIRED'
  status: SystemStatus
  samples_collected: number
  model_trained: boolean
  buffer_avg: number
}

interface SecurityContextValue {
  userId: string
  securityState: SecurityState
  behaviorData: BehaviorData
  checkSecurity: () => Promise<PredictionResponse | null>
  resetSecurity: () => Promise<void>
}

const SecurityContext = createContext<SecurityContextValue | null>(null)

const MONITORING_INTERVAL = 5000 // 5 seconds

export function SecurityProvider({ children }: { children: ReactNode }) {
  const sessionId = useId()
  const userId = `user_${sessionId.replace(/:/g, '_')}`
  
  const { getBehaviorData, resetTracking } = useBehaviorTracker(userId)
  
  const [securityState, setSecurityState] = useState<SecurityState>({
    riskLevel: 'LOW',
    anomalyScore: 0,
    bufferAvg: 0,
    status: 'learning',
    samplesCollected: 0,
    modelTrained: false,
    lastChecked: null,
    isChecking: false,
  })

  const [behaviorData, setBehaviorData] = useState<BehaviorData>({
    user_id: userId,
    typing_speed: 0,
    typing_speed_variance: 0,
    avg_click_interval: 0,
    session_duration: 0,
    mouse_distance: 0,
    avg_scroll_velocity: 0,
  })

  const checkSecurity = useCallback(async (): Promise<PredictionResponse | null> => {
    setSecurityState(prev => ({ ...prev, isChecking: true }))
    
    try {
      const data = getBehaviorData()
      setBehaviorData(data)
      
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to check security')
      }

      const prediction: PredictionResponse = await response.json()
      
      setSecurityState({
        riskLevel: prediction.risk_level,
        anomalyScore: prediction.anomaly_score,
        bufferAvg: prediction.buffer_avg,
        status: prediction.status,
        samplesCollected: prediction.samples_collected,
        modelTrained: prediction.model_trained,
        lastChecked: new Date(),
        isChecking: false,
      })

      return prediction
    } catch (error) {
      console.error('Security check failed:', error)
      setSecurityState(prev => ({ ...prev, isChecking: false }))
      return null
    }
  }, [getBehaviorData])

  const resetSecurity = useCallback(async () => {
    try {
      await fetch(`/api/reset/${userId}`, { method: 'POST' })
      resetTracking()
      setSecurityState({
        riskLevel: 'LOW',
        anomalyScore: 0,
        bufferAvg: 0,
        status: 'learning',
        samplesCollected: 0,
        modelTrained: false,
        lastChecked: null,
        isChecking: false,
      })
    } catch (error) {
      console.error('Failed to reset security:', error)
    }
  }, [userId, resetTracking])

  // Continuous monitoring - check every 5 seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Initial check after a short delay to collect some behavior data
    const initialTimeout = setTimeout(() => {
      checkSecurity()
    }, 2000)

    // Set up continuous monitoring
    intervalRef.current = setInterval(() => {
      checkSecurity()
    }, MONITORING_INTERVAL)

    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkSecurity])

  return (
    <SecurityContext.Provider value={{
      userId,
      securityState,
      behaviorData,
      checkSecurity,
      resetSecurity,
    }}>
      {children}
    </SecurityContext.Provider>
  )
}

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider')
  }
  return context
}
