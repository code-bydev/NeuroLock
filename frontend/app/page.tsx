'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TransferForm, type TransferData } from '@/components/transfer-form'
import { OTPDialog } from '@/components/otp-dialog'
import { BiometricDialog } from '@/components/biometric-dialog'
import { Dashboard } from '@/components/dashboard'
import { SecurityHeader } from '@/components/security-header'
import { SecurityProvider, useSecurity, type PredictionResponse } from '@/components/security-context'
import { CheckCircle, XCircle, Shield, RefreshCcw, Send, LayoutDashboard } from 'lucide-react'

type TransactionState = 'idle' | 'success' | 'otp_required' | 'biometric_required' | 'blocked'

function TransferPage() {
  const [transactionState, setTransactionState] = useState<TransactionState>('idle')
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [formData, setFormData] = useState<TransferData | null>(null)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isVerifyingBiometric, setIsVerifyingBiometric] = useState(false)
  const [otpDialogOpen, setOtpDialogOpen] = useState(false)
  const [biometricDialogOpen, setBiometricDialogOpen] = useState(false)

  const { resetSecurity } = useSecurity()

  const handleTransferSubmit = useCallback((pred: PredictionResponse, data: TransferData) => {
    setPrediction(pred)
    setFormData(data)

    switch (pred.action) {
      case 'ALLOW':
        setTransactionState('success')
        break
      case 'OTP_REQUIRED':
        setTransactionState('otp_required')
        setOtpDialogOpen(true)
        break
      case 'BIOMETRIC_REQUIRED':
        setTransactionState('biometric_required')
        setBiometricDialogOpen(true)
        break
    }
  }, [])

  const handleOtpVerify = useCallback(async () => {
    setIsVerifyingOtp(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsVerifyingOtp(false)
    setOtpDialogOpen(false)
    setTransactionState('success')
  }, [])

  const handleBiometricVerify = useCallback(async () => {
    setIsVerifyingBiometric(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsVerifyingBiometric(false)
    setBiometricDialogOpen(false)
    setTransactionState('success')
  }, [])

  const handleReset = useCallback(() => {
    setTransactionState('idle')
    setPrediction(null)
    setFormData(null)
  }, [])

  const handleResetModel = useCallback(async () => {
    await resetSecurity()
    handleReset()
  }, [resetSecurity, handleReset])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Transfer Money</CardTitle>
              <CardDescription>
                Send money securely with behavioral authentication
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactionState === 'idle' && (
            <TransferForm onSubmit={handleTransferSubmit} />
          )}

          {transactionState === 'success' && formData && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Transfer Successful</h3>
                <p className="mt-1 text-muted-foreground">
                  ${formData.amount} has been sent to {formData.recipient}
                </p>
              </div>
              <Button onClick={handleReset} variant="outline" className="mt-4">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Make Another Transfer
              </Button>
            </div>
          )}

          {(transactionState === 'otp_required' && !otpDialogOpen) && formData && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
                <Shield className="h-8 w-8 text-warning" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Verification Required</h3>
                <p className="mt-1 text-muted-foreground">
                  Additional verification is needed to complete this transfer.
                </p>
              </div>
              <Button onClick={() => setOtpDialogOpen(true)} className="mt-4">
                Enter Verification Code
              </Button>
            </div>
          )}

          {(transactionState === 'biometric_required' && !biometricDialogOpen) && formData && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Biometric Verification Required</h3>
                <p className="mt-1 text-muted-foreground">
                  High-risk behavior detected. Please verify your identity.
                </p>
              </div>
              <Button onClick={() => setBiometricDialogOpen(true)} className="mt-4">
                Verify Identity
              </Button>
            </div>
          )}

          {transactionState === 'blocked' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-destructive">Transaction Blocked</h3>
                <p className="mt-1 text-muted-foreground">
                  Unusual behavior detected. For your security, this transaction has been blocked.
                </p>
              </div>
              <Alert variant="destructive" className="mt-2 text-left">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Security Alert</AlertTitle>
                <AlertDescription>
                  Your behavior pattern significantly differs from your normal profile. 
                  Please contact support if you believe this is an error.
                </AlertDescription>
              </Alert>
              <Button onClick={handleReset} variant="outline" className="mt-4">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-4 w-4 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Continuous Behavioral Authentication</p>
                <p className="text-muted-foreground">
                  Your behavior is continuously monitored across the entire session. The ML model 
                  analyzes typing patterns, mouse movements, and interaction timing to verify your identity.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetModel}
                className="text-xs"
              >
                Reset ML Model
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <OTPDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        onVerify={handleOtpVerify}
        isVerifying={isVerifyingOtp}
      />

      <BiometricDialog
        open={biometricDialogOpen}
        onOpenChange={setBiometricDialogOpen}
        onVerify={handleBiometricVerify}
        isVerifying={isVerifyingBiometric}
      />
    </>
  )
}

function MainContent() {
  return (
    <>
      <SecurityHeader />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Transfer
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <Dashboard />
          </TabsContent>
          <TabsContent value="transfer" className="mt-6 flex flex-col gap-4">
            <TransferPage />
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}

export default function Home() {
  return (
    <SecurityProvider>
      <div className="min-h-screen bg-background">
        <MainContent />
      </div>
    </SecurityProvider>
  )
}
