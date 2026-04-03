'use client'

import { useSecurity } from './security-context'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Shield, Wallet, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SecurityHeader() {
  const { securityState } = useSecurity()

  const statusConfig = {
    LOW: {
      color: 'bg-success',
      textColor: 'text-success',
      badgeClass: 'bg-success/20 text-success border-success/30',
      label: 'Safe',
      description: 'Your behavior matches your normal profile',
    },
    MEDIUM: {
      color: 'bg-warning',
      textColor: 'text-warning',
      badgeClass: 'bg-warning/20 text-warning border-warning/30',
      label: 'Suspicious',
      description: 'Some unusual behavior detected',
    },
    HIGH: {
      color: 'bg-destructive',
      textColor: 'text-destructive',
      badgeClass: 'bg-destructive/20 text-destructive border-destructive/30',
      label: 'Risky',
      description: 'Significant anomaly detected',
    },
  }

  const config = statusConfig[securityState.riskLevel]

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">SecureBank</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Security Status Indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    config.color,
                    securityState.isChecking && "animate-pulse"
                  )} />
                  <Badge variant="outline" className={cn("text-xs", config.badgeClass)}>
                    {config.label}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{config.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span>Score: {Math.round(securityState.bufferAvg * 100)}%</span>
                    <span>|</span>
                    <span>{securityState.status === 'learning' ? 'Learning' : 'Active'}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Account Balance */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            <span>$12,450.00</span>
          </div>
        </div>
      </div>
    </header>
  )
}
