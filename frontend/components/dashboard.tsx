'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useSecurity } from './security-context'
import { cn } from '@/lib/utils'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Activity,
  Keyboard,
  MousePointer,
  Clock,
  TrendingUp,
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'incoming' | 'outgoing'
  description: string
  amount: number
  date: string
}

const recentTransactions: Transaction[] = [
  { id: '1', type: 'incoming', description: 'Salary Deposit', amount: 5200.00, date: 'Today' },
  { id: '2', type: 'outgoing', description: 'Netflix Subscription', amount: 15.99, date: 'Yesterday' },
  { id: '3', type: 'outgoing', description: 'Grocery Store', amount: 127.45, date: 'Mar 31' },
  { id: '4', type: 'incoming', description: 'Refund - Amazon', amount: 49.99, date: 'Mar 30' },
  { id: '5', type: 'outgoing', description: 'Electric Bill', amount: 89.00, date: 'Mar 29' },
]

export function Dashboard() {
  const { securityState, behaviorData } = useSecurity()

  const statusConfig = {
    LOW: {
      color: 'bg-success',
      textColor: 'text-success',
      label: 'Protected',
      description: 'All systems normal',
    },
    MEDIUM: {
      color: 'bg-warning',
      textColor: 'text-warning',
      label: 'Monitoring',
      description: 'Unusual activity detected',
    },
    HIGH: {
      color: 'bg-destructive',
      textColor: 'text-destructive',
      label: 'Alert',
      description: 'Action may be required',
    },
  }

  const config = statusConfig[securityState.riskLevel]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Account Balance Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" />
            Total Balance
          </CardDescription>
          <CardTitle className="text-3xl">$12,450.00</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-success">
            <TrendingUp className="h-4 w-4" />
            <span>+2.5% from last month</span>
          </div>
        </CardContent>
      </Card>

      {/* Security Status Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Security Status
          </CardDescription>
          <CardTitle className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded-full", config.color)} />
            {config.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {securityState.status === 'learning' ? 'Learning Mode' : 'ML Active'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {securityState.samplesCollected} samples
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Behavior Analysis Card */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" />
            Real-time Analysis
          </CardDescription>
          <CardTitle className="text-lg">Behavior Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Anomaly Level</span>
              <span className={cn("font-mono font-medium", config.textColor)}>
                {Math.round(securityState.bufferAvg * 100)}%
              </span>
            </div>
            <Progress 
              value={securityState.bufferAvg * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <CardDescription>Your latest account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    tx.type === 'incoming' ? "bg-success/20" : "bg-muted"
                  )}>
                    {tx.type === 'incoming' ? (
                      <ArrowDownLeft className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <span className={cn(
                  "font-mono text-sm font-medium",
                  tx.type === 'incoming' ? "text-success" : "text-foreground"
                )}>
                  {tx.type === 'incoming' ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Behavior Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Live Behavior Metrics</CardTitle>
          <CardDescription>Currently tracked patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Typing Speed</span>
                <span className="font-mono text-sm">{behaviorData.typing_speed}ms</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Mouse Dist.</span>
                <span className="font-mono text-sm">{Math.round(behaviorData.mouse_distance)}px</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Session</span>
                <span className="font-mono text-sm">{behaviorData.session_duration}s</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Click Interval</span>
                <span className="font-mono text-sm">{behaviorData.avg_click_interval}ms</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
