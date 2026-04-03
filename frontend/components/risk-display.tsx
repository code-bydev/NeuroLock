'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Activity, TrendingUp, Clock, MousePointer, Keyboard, ArrowDownUp } from 'lucide-react'
import type { BehaviorData } from './behavior-tracker'

interface RiskDisplayProps {
  anomalyScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  samplesCollected: number
  modelTrained: boolean
  behaviorData?: BehaviorData
}

export function RiskDisplay({ 
  anomalyScore, 
  riskLevel, 
  samplesCollected, 
  modelTrained,
  behaviorData 
}: RiskDisplayProps) {
  const scorePercentage = Math.round(anomalyScore * 100)
  
  const riskConfig = {
    LOW: {
      color: 'bg-success',
      textColor: 'text-success',
      label: 'Normal Behavior',
      badgeClass: 'bg-success/20 text-success border-success/30',
    },
    MEDIUM: {
      color: 'bg-warning',
      textColor: 'text-warning',
      label: 'Unusual Pattern',
      badgeClass: 'bg-warning/20 text-warning border-warning/30',
    },
    HIGH: {
      color: 'bg-destructive',
      textColor: 'text-destructive',
      label: 'Anomaly Detected',
      badgeClass: 'bg-destructive/20 text-destructive border-destructive/30',
    },
  }

  const config = riskConfig[riskLevel]

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={cn('h-4 w-4', config.textColor)} />
          <span className="text-sm font-medium">Behavior Analysis</span>
        </div>
        <Badge variant="outline" className={config.badgeClass}>
          {config.label}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Anomaly Score</span>
          <span className={cn('font-mono font-medium', config.textColor)}>
            {scorePercentage}%
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn('h-full transition-all duration-500', config.color)}
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Samples: {samplesCollected}</span>
        <span>{modelTrained ? 'ML Model Active' : 'Learning Mode'}</span>
      </div>

      {behaviorData && (
        <div className="grid grid-cols-2 gap-3 border-t pt-4">
          <div className="flex items-center gap-2 text-xs">
            <Keyboard className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Typing Speed</span>
              <span className="font-mono">{behaviorData.typing_speed}ms</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <MousePointer className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Mouse Distance</span>
              <span className="font-mono">{behaviorData.mouse_distance}px</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Session Time</span>
              <span className="font-mono">{behaviorData.session_duration}s</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-muted-foreground">Scroll Velocity</span>
              <span className="font-mono">{behaviorData.avg_scroll_velocity}px/s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
