'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ShieldAlert, Fingerprint, ScanFace, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BiometricDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerify: () => void
  isVerifying: boolean
}

type BiometricMethod = 'face' | 'fingerprint' | null
type VerificationState = 'idle' | 'scanning' | 'success' | 'failed'

export function BiometricDialog({ open, onOpenChange, onVerify, isVerifying }: BiometricDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<BiometricMethod>(null)
  const [verificationState, setVerificationState] = useState<VerificationState>('idle')
  const [progress, setProgress] = useState(0)

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedMethod(null)
      setVerificationState('idle')
      setProgress(0)
    }
  }, [open])

  const handleMethodSelect = (method: BiometricMethod) => {
    setSelectedMethod(method)
    setVerificationState('scanning')
    setProgress(0)

    // Simulate biometric scanning
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setVerificationState('success')
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleContinue = () => {
    onVerify()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={verificationState !== 'scanning'}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Biometric Verification Required</DialogTitle>
              <DialogDescription className="mt-1">
                High-risk behavior detected. Please verify your identity using biometrics.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {verificationState === 'idle' && (
          <div className="flex flex-col gap-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              Choose a verification method
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleMethodSelect('face')}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-border bg-secondary/50 p-6 transition-all hover:border-primary hover:bg-secondary"
              >
                <ScanFace className="h-12 w-12 text-primary" />
                <span className="text-sm font-medium">Face ID</span>
              </button>
              <button
                onClick={() => handleMethodSelect('fingerprint')}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-border bg-secondary/50 p-6 transition-all hover:border-primary hover:bg-secondary"
              >
                <Fingerprint className="h-12 w-12 text-primary" />
                <span className="text-sm font-medium">Fingerprint</span>
              </button>
            </div>
          </div>
        )}

        {verificationState === 'scanning' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <div className={cn(
                "flex h-24 w-24 items-center justify-center rounded-full border-4 transition-all",
                progress < 100 ? "border-primary/30 animate-pulse" : "border-success"
              )}>
                {selectedMethod === 'face' ? (
                  <ScanFace className={cn(
                    "h-12 w-12 transition-colors",
                    progress < 100 ? "text-primary" : "text-success"
                  )} />
                ) : (
                  <Fingerprint className={cn(
                    "h-12 w-12 transition-colors",
                    progress < 100 ? "text-primary" : "text-success"
                  )} />
                )}
              </div>
              {/* Progress ring */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-primary"
                  strokeDasharray={`${progress * 2.89} 289`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedMethod === 'face' ? 'Scanning face...' : 'Scanning fingerprint...'}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{progress}%</p>
          </div>
        )}

        {verificationState === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <div className="text-center">
              <p className="font-medium text-success">Verification Successful</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your identity has been confirmed
              </p>
            </div>
            <Button onClick={handleContinue} disabled={isVerifying} className="mt-2">
              {isVerifying ? (
                <>
                  <Spinner className="mr-2" />
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          For demo purposes, biometric verification is simulated
        </p>
      </DialogContent>
    </Dialog>
  )
}
